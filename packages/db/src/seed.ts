import { query } from "./client";
import process from "process";

async function main() {
  console.log("Initializing Database Schema...");

  await query(`
    CREATE TABLE IF NOT EXISTS "Organization" (
      "id" TEXT PRIMARY KEY,
      "name" TEXT NOT NULL,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS "User" (
      "id" TEXT PRIMARY KEY,
      "clerkUserId" TEXT UNIQUE NOT NULL,
      "email" TEXT UNIQUE NOT NULL,
      "name" TEXT,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS "Membership" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "organizationId" TEXT NOT NULL,
      "role" TEXT NOT NULL,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW(),
      UNIQUE("userId", "organizationId")
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS "DataSource" (
      "id" TEXT PRIMARY KEY,
      "organizationId" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "displayName" TEXT NOT NULL,
      "status" TEXT DEFAULT 'INDEXING',
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS "Document" (
      "id" TEXT PRIMARY KEY,
      "organizationId" TEXT NOT NULL,
      "dataSourceId" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "mimeType" TEXT NOT NULL,
      "size" INTEGER,
      "status" TEXT DEFAULT 'PENDING',
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS "DocumentChunk" (
      "id" TEXT PRIMARY KEY,
      "documentId" TEXT NOT NULL,
      "organizationId" TEXT NOT NULL,
      "index" INTEGER NOT NULL,
      "content" TEXT NOT NULL,
      "embeddingRef" TEXT,
      "createdAt" TIMESTAMP DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS "ChatSession" (
      "id" TEXT PRIMARY KEY,
      "organizationId" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS "Message" (
      "id" TEXT PRIMARY KEY,
      "chatSessionId" TEXT NOT NULL,
      "role" TEXT NOT NULL,
      "content" TEXT NOT NULL,
      "createdAt" TIMESTAMP DEFAULT NOW()
    );
  `);

  console.log("Database initialized successfully.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});