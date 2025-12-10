import Fastify from "fastify";
import cors from "@fastify/cors";
import { env } from "@lumina/config";
import { appRouter } from "./router";
import { createContext } from "./router/context";
import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify";
import { chatStreamHandler } from "./router/chatStream";
import process from "process";

const server = Fastify({
  logger: true,
});

async function main() {
  await server.register(cors, {
    origin: "*", // Lock down in prod
  });

  // tRPC Plugin
  await server.register(fastifyTRPCPlugin, {
    prefix: "/trpc",
    trpcOptions: { router: appRouter, createContext },
  });

  // Streaming Chat Endpoint (Standard HTTP Stream)
  server.post("/api/chat/stream", chatStreamHandler);

  server.get("/health", async () => {
    return { status: "ok" };
  });

  try {
    await server.listen({ port: parseInt(env.API_PORT), host: "0.0.0.0" });
    console.log(`API running on port ${env.API_PORT}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

main();