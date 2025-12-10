import { Queue } from "bullmq";
import { env } from "@lumina/config";
import { z } from "zod";
import { query, DataSource, Document } from "@lumina/db";
import { randomUUID } from "crypto";

// Job Queue
const ingestionQueue = new Queue("ingestion", {
  connection: { url: env.REDIS_URL }
});

export const sourcesRouter = (t: any, protectedProcedure: any) => t.router({
  list: protectedProcedure.query(async ({ ctx }: any) => {
    // Count documents per source using correlated subquery or group by
    const sql = `
      SELECT ds.*, 
      (SELECT COUNT(*) FROM "Document" d WHERE d."dataSourceId" = ds.id) as "docCount"
      FROM "DataSource" ds
      WHERE ds."organizationId" = $1
      ORDER BY ds."createdAt" DESC
    `;
    const { rows } = await query<DataSource & { docCount: string }>(sql, [ctx.organizationId]);
    
    return rows.map(r => ({
      ...r,
      _count: { documents: parseInt(r.docCount || "0") }
    }));
  }),

  listDocuments: protectedProcedure
    .query(async ({ ctx }: any) => {
      const sql = `
        SELECT d.*, ds."displayName" as "sourceName"
        FROM "Document" d
        JOIN "DataSource" ds ON d."dataSourceId" = ds.id
        WHERE d."organizationId" = $1
        ORDER BY d."createdAt" DESC
        LIMIT 50
      `;
      const { rows } = await query<Document & { sourceName: string }>(sql, [ctx.organizationId]);
      return rows;
    }),

  upload: protectedProcedure
    .input(z.object({
      fileName: z.string(),
      contentBase64: z.string()
    }))
    .mutation(async ({ ctx, input }: any) => {
      // 1. Ensure "Manual Upload" datasource exists
      let { rows: dsRows } = await query<DataSource>(
        `SELECT * FROM "DataSource" WHERE "organizationId" = $1 AND type = 'MANUAL_UPLOAD'`, 
        [ctx.organizationId]
      );
      let ds = dsRows[0];

      if (!ds) {
        const newDsId = randomUUID();
        await query(
          `INSERT INTO "DataSource" (id, "organizationId", type, "displayName", status) VALUES ($1, $2, 'MANUAL_UPLOAD', 'Manual Uploads', 'ACTIVE')`,
          [newDsId, ctx.organizationId]
        );
        ds = { id: newDsId } as DataSource; // minimal needed
      }

      // 2. Create Document record
      const docId = randomUUID();
      await query(
        `INSERT INTO "Document" (id, "organizationId", "dataSourceId", title, "mimeType", status) VALUES ($1, $2, $3, $4, 'text/plain', 'PENDING')`,
        [docId, ctx.organizationId, ds.id, input.fileName]
      );

      // 3. Queue Job
      await ingestionQueue.add("ingest-doc", {
        organizationId: ctx.organizationId,
        documentId: docId,
        contentBase64: input.contentBase64 
      });

      return { id: docId };
    })
});