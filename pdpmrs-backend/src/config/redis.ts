import Redis from "ioredis";
import { env } from "./env";
import { logger } from "../common/logger";

export const redis = new Redis(env.redisUrl, {
  maxRetriesPerRequest: 3,
  lazyConnect: false,
});

redis.on("error", (err) => {
  logger.warn(`Redis connection error: ${err.message}`);
});

redis.on("connect", () => {
  logger.info("Connected to Redis");
});

/**
 * Cache-aside helper. If Redis is unavailable, falls through to the
 * loader function so business flows keep working (CON-014, CON-019).
 */
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>
): Promise<T> {
  try {
    const hit = await redis.get(key);
    if (hit) return JSON.parse(hit) as T;
  } catch (err) {
    logger.warn(`Redis read failed for key ${key}, bypassing cache`);
  }

  const value = await loader();

  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch (err) {
    logger.warn(`Redis write failed for key ${key}`);
  }

  return value;
}

export async function invalidate(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length) await redis.del(...keys);
  } catch (err) {
    logger.warn(`Redis invalidate failed for pattern ${pattern}`);
  }
}
