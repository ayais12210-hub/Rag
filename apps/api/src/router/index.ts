import { initTRPC, TRPCError } from "@trpc/server";
import { Context } from "./context";
import { z } from "zod";
import { sourcesRouter } from "./sources";
import { teamRouter } from "./team";
import { chatRouter } from "./chat";
import { query, User, Membership } from "@lumina/db";
import { randomUUID } from "crypto";

const t = initTRPC.context<Context>().create();

export const middleware = t.middleware;
export const publicProcedure = t.procedure;

// Auth Middleware: Ensures user is logged in and attaches Org
const isAuthed = middleware(async ({ ctx, next }) => {
  // Hardcoded for dev/demo if headers missing
  const userId = ctx.userId || ctx.req.headers['x-user-id'] as string;
  if (!userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  // Get Org ID from header (client selects org)
  const organizationId = ctx.req.headers['x-org-id'] as string;
  if (!organizationId) {
     throw new TRPCError({ code: "BAD_REQUEST", message: "Organization ID required" });
  }

  return next({
    ctx: {
      userId,
      organizationId,
    },
  });
});

export const protectedProcedure = t.procedure.use(isAuthed);

export const appRouter = t.router({
  health: publicProcedure.query(() => "ok"),
  sources: sourcesRouter(t, protectedProcedure),
  team: teamRouter(t, protectedProcedure),
  chat: chatRouter(t, protectedProcedure),
  // Bootstrapping: Check if user exists, create if not
  me: publicProcedure
    .input(z.object({ clerkId: z.string(), email: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Find User
      const userRes = await query<User>(`SELECT * FROM "User" WHERE "clerkUserId" = $1`, [input.clerkId]);
      let user = userRes.rows[0];

      if (!user) {
        const newId = randomUUID();
        await query(`INSERT INTO "User" (id, "clerkUserId", email) VALUES ($1, $2, $3)`, [newId, input.clerkId, input.email]);
        const newUserRes = await query<User>(`SELECT * FROM "User" WHERE id = $1`, [newId]);
        user = newUserRes.rows[0];
      }

      // Return memberships
      // Using a JOIN-like structure or just fetching memberships and manually stitching orgs if needed, 
      // but simple select with join is better
      const memberRes = await query<Membership & { orgName: string }>(`
        SELECT m.*, o.name as "orgName", o.id as "orgId" 
        FROM "Membership" m 
        JOIN "Organization" o ON m."organizationId" = o.id 
        WHERE m."userId" = $1
      `, [user.id]);

      // Map to expected format
      const memberships = memberRes.rows.map(row => ({
          ...row,
          organization: { id: row.organizationId, name: row.orgName }
      }));

      return { user, memberships };
    }),
  createOrg: publicProcedure
    .input(z.object({ clerkId: z.string(), name: z.string() }))
    .mutation(async ({ ctx, input }) => {
       const userRes = await query<User>(`SELECT * FROM "User" WHERE "clerkUserId" = $1`, [input.clerkId]);
       const user = userRes.rows[0];
       if (!user) throw new Error("User not found");

       const orgId = randomUUID();
       const memberId = randomUUID();

       // Transaction implies sequential execution here or using BEGIN/COMMIT blocks via client
       // For MVP simplicity, sequential awaits
       await query(`INSERT INTO "Organization" (id, name) VALUES ($1, $2)`, [orgId, input.name]);
       await query(`INSERT INTO "Membership" (id, "userId", "organizationId", role) VALUES ($1, $2, $3, 'ADMIN')`, [memberId, user.id, orgId]);

       return { id: orgId, name: input.name };
    })
});

export type AppRouter = typeof appRouter;