import { query } from "./client";
import type {
  Organization,
  User,
  Membership,
  DataSource,
  Document,
  DocumentChunk,
  ChatSession,
  Message,
  AuditEvent,
} from "./schema";

export * from "./schema";
export { query };

// Example repository helpers

export async function getOrganizationById(id: string): Promise<Organization | null> {
  const { rows } = await query<Organization>(
    `SELECT id, name, "createdAt", "updatedAt"
     FROM "Organization"
     WHERE id = $1`,
    [id],
  );
  return rows[0] ?? null;
}

export async function getUserByClerkUserId(clerkUserId: string): Promise<User | null> {
  const { rows } = await query<User>(
    `SELECT id, "clerkUserId", email, name, "createdAt", "updatedAt"
     FROM "User"
     WHERE "clerkUserId" = $1`,
    [clerkUserId],
  );
  return rows[0] ?? null;
}

export async function getMembershipForUserInOrg(userId: string, organizationId: string): Promise<Membership | null> {
  const { rows } = await query<Membership>(
    `SELECT id, "userId", "organizationId", role, "createdAt", "updatedAt"
     FROM "Membership"
     WHERE "userId" = $1 AND "organizationId" = $2`,
    [userId, organizationId],
  );
  return rows[0] ?? null;
}