// lib/redis.ts
import { createClient } from "redis";

const redis = createClient({
  url: process.env.REDIS_URL ?? "redis://localhost:6379",
});

redis.on("error", (err : unknown) => {
  console.error(" Redis error:", err);
});

if (!redis.isOpen) {
  redis.connect().then(() => {
    console.log(" Redis connected");
  });
}

export default redis;
