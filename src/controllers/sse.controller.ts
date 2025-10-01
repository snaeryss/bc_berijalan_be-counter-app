import { Request, Response } from "express";
import { redisClient } from "../config/redis.config";
import { sseEventFormat } from "../utils/sse.util";

export const CInitSSE = async (req: Request, res: Response): Promise<void> => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  res.write(sseEventFormat("connected", JSON.stringify({ time: Date.now() })));

  const subscriber = redisClient.duplicate();
  await subscriber.connect();

  const heartbeat = setInterval(() => {
    res.write(
      sseEventFormat("heartbeat", JSON.stringify({ time: Date.now() }))
    );
  }, 10_000);

  await subscriber.subscribe("queue_updates", (message) => {
    const event = JSON.parse(message).event;
    res.write(sseEventFormat(event, message));
  });

  req.on("close", async () => {
    clearInterval(heartbeat);
    await subscriber.unsubscribe("queue_updates");
    await subscriber.quit();
  });
};
