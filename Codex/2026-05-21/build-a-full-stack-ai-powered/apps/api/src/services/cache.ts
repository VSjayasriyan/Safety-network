import Redis from "ioredis";
import { config } from "../config.js";

const redis = config.redisUrl ? new Redis(config.redisUrl) : undefined;
const memory = new Map<string, { value: string; expiresAt: number }>();

export async function cached<T>(key: string, seconds: number, loader: () => Promise<T>): Promise<T> {
  const now = Date.now();
  if (redis) {
    const hit = await redis.get(key);
    if (hit) return JSON.parse(hit) as T;
    const value = await loader();
    await redis.set(key, JSON.stringify(value), "EX", seconds);
    return value;
  }
  const hit = memory.get(key);
  if (hit && hit.expiresAt > now) return JSON.parse(hit.value) as T;
  const value = await loader();
  memory.set(key, { value: JSON.stringify(value), expiresAt: now + seconds * 1000 });
  return value;
}
