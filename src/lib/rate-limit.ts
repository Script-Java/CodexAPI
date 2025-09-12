import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

const authLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"),
});

const searchLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "1 m"),
});

const writeLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "1 m"),
});

function getIdentifier(req: Request, userId?: string) {
  return userId ?? req.headers.get("x-forwarded-for") ?? "0.0.0.0";
}

export async function rateLimitAuth(req: Request) {
  return authLimiter.limit(getIdentifier(req));
}

export async function rateLimitSearch(req: Request, userId?: string) {
  return searchLimiter.limit(getIdentifier(req, userId));
}

export async function rateLimitWrite(req: Request, userId?: string) {
  return writeLimiter.limit(getIdentifier(req, userId));
}
