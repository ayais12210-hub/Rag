import { query, Message } from "@lumina/db";
import { vectorStore, generateAnswerStream, embedText } from "@lumina/ai";
import { CONSTANTS } from "@lumina/config";
import { randomUUID } from "crypto";

export async function chatStreamHandler(req: any, reply: any) {
  const { sessionId, message, organizationId, userId } = req.body; 

  if (!sessionId || !message || !organizationId || !userId) {
    reply.code(400).send("Missing fields");
    return;
  }

  // 1. Save User Message
  await query(
    `INSERT INTO "Message" (id, "chatSessionId", role, content) VALUES ($1, $2, 'USER', $3)`,
    [randomUUID(), sessionId, message]
  );

  // 2. RAG Retrieval
  const embedding = await embedText(message);
  const contextChunks = await vectorStore.query(embedding, CONSTANTS.DEFAULT_TOP_K, { organizationId });

  // 3. Load History
  const { rows: history } = await query<Message>(
    `SELECT * FROM "Message" WHERE "chatSessionId" = $1 ORDER BY "createdAt" ASC LIMIT 10`,
    [sessionId]
  );

  const historyFormatted = history.map((h) => ({
    role: h.role === 'USER' ? 'user' : 'assistant' as const,
    content: h.content
  }));

  // 4. Stream Response
  reply.raw.setHeader("Content-Type", "text/event-stream");
  reply.raw.setHeader("Cache-Control", "no-cache");
  reply.raw.setHeader("Connection", "keep-alive");

  let fullResponse = "";

  try {
    const generator = generateAnswerStream(message, contextChunks, historyFormatted);
    
    for await (const token of generator) {
      reply.raw.write(token);
      fullResponse += token;
    }
  } catch (e) {
    console.error("Streaming error", e);
    reply.raw.write(" [Error generating response]");
  } finally {
    // 5. Save Assistant Message
    await query(
        `INSERT INTO "Message" (id, "chatSessionId", role, content) VALUES ($1, $2, 'ASSISTANT', $3)`,
        [randomUUID(), sessionId, fullResponse]
    );
    
    reply.raw.end();
  }
}