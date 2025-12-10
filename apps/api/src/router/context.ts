import { inferAsyncReturnType } from "@trpc/server";
import { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";
import { Clerk } from "@clerk/clerk-sdk-node";
import { env } from "@lumina/config";

const clerk = Clerk({ secretKey: env.CLERK_SECRET_KEY });

export async function createContext({ req, res }: CreateFastifyContextOptions) {
  // Simple bearer token extraction for MVP
  const authHeader = req.headers.authorization;
  let userId: string | null = null;
  let organizationId: string | null = null;

  if (authHeader) {
    try {
      const token = authHeader.split(" ")[1];
      if (!env.CLERK_SECRET_KEY && env.OPENAI_API_KEY === undefined) {
          // DEV MODE BACKDOOR
          userId = "user_dev";
      } else {
        // Real verify would go here
      }
    } catch (e) {
      console.error("Auth fail", e);
    }
  }

  return {
    req,
    res,
    userId,
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;