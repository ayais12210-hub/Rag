import { z } from "zod";
import dotenv from "dotenv";

dotenv.config({ path: "../../.env" });

const envSchema = z.object({
  DATABASE_URL: z.string().default("postgresql://postgres:postgres@localhost:5432/lumina"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  OPENAI_API_KEY: z.string().optional(), // Optional for dev stubbing
  CLERK_SECRET_KEY: z.string().optional(),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().optional(),
  API_PORT: z.string().default("3001"),
  WEB_URL: z.string().default("http://localhost:3000"),
});

export const env = envSchema.parse(process.env);

export const CONSTANTS = {
  DEFAULT_TOP_K: 5,
  CHUNK_SIZE_CHARS: 1000,
  CHUNK_OVERLAP_CHARS: 200,
  VECTOR_STORE_FILE_PATH: "./tmp-vector-store.json"
};
