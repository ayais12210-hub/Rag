import { Worker } from "bullmq";
import { query, DocumentChunk } from "@lumina/db";
import { env, CONSTANTS } from "@lumina/config";
import { embedText, vectorStore } from "@lumina/ai";
import { Buffer } from "buffer";
import { randomUUID } from "crypto";

console.log("Worker starting...");

const worker = new Worker("ingestion", async (job) => {
  const { organizationId, documentId, contentBase64 } = job.data;
  console.log(`Processing doc ${documentId} for org ${organizationId}`);

  try {
    // 1. Update Status
    await query(`UPDATE "Document" SET status = 'INDEXING' WHERE id = $1`, [documentId]);

    // 2. Decode Content (Mock parsing)
    const content = Buffer.from(contentBase64, 'base64').toString('utf-8');
    
    // 3. Chunking (Naive)
    const chunkSize = CONSTANTS.CHUNK_SIZE_CHARS;
    const overlap = CONSTANTS.CHUNK_OVERLAP_CHARS;
    const chunks: string[] = [];
    
    for (let i = 0; i < content.length; i += (chunkSize - overlap)) {
      chunks.push(content.slice(i, i + chunkSize));
    }

    // 4. Process Chunks
    const vectorChunks = [];
    let idx = 0;
    
    for (const chunkText of chunks) {
      const embedding = await embedText(chunkText);
      const chunkId = randomUUID();
      const embeddingRef = `vec_${documentId}_${idx}`;

      // Store in PG
      await query(
        `INSERT INTO "DocumentChunk" (id, "documentId", "organizationId", index, content, "embeddingRef") VALUES ($1, $2, $3, $4, $5, $6)`,
        [chunkId, documentId, organizationId, idx, chunkText, embeddingRef]
      );

      // Prepare for Vector Store
      vectorChunks.push({
        id: chunkId,
        vector: embedding,
        metadata: {
          documentId,
          organizationId,
          content: chunkText
        }
      });
      idx++;
    }

    // 5. Insert into Vector DB
    await vectorStore.upsertMany(vectorChunks);

    // 6. Complete
    await query(`UPDATE "Document" SET status = 'ACTIVE' WHERE id = $1`, [documentId]);
    console.log(`Done processing ${documentId}`);

  } catch (e) {
    console.error("Job failed", e);
    await query(`UPDATE "Document" SET status = 'ERROR' WHERE id = $1`, [documentId]);
    throw e;
  }

}, { connection: { url: env.REDIS_URL } });

worker.on('completed', job => {
  console.log(`${job.id} has completed!`);
});

worker.on('failed', (job, err) => {
  console.log(`${job?.id} has failed with ${err.message}`);
});