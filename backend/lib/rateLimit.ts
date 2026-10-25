import { NextResponse } from "next/server";

export type Clock = () => number;
type Bucket = { timestamps: number[] };

/** Creates an in-memory sliding-window limiter; inject a clock for deterministic tests. */
export function createRateLimiter(clock: Clock = Date.now) {
  const buckets = new Map<string, Bucket>();
  return (key: string, limit: number, windowMs: number) => {
    const now = clock();
    const bucket = buckets.get(key) ?? { timestamps: [] };
    bucket.timestamps = bucket.timestamps.filter((time) => time > now - windowMs);
    if (bucket.timestamps.length >= limit) {
      buckets.set(key, bucket);
      return { allowed: false, retryAfter: Math.max(1, Math.ceil((bucket.timestamps[0] + windowMs - now) / 1000)) };
    }
    bucket.timestamps.push(now);
    buckets.set(key, bucket);
    if (buckets.size > 10_000) {
      for (const [bucketKey, value] of buckets) {
        if (value.timestamps.every((time) => time <= now - windowMs)) buckets.delete(bucketKey);
      }
    }
    return { allowed: true, retryAfter: 0 };
  };
}

const limit = createRateLimiter();

/** Applies a per-IP request limit and returns a 429 response when exceeded. */
export function rateLimitResponse(request: Request, scope: string, maxRequests = 10, windowMs = 60_000): Response | null {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",", 1)[0]?.trim();
  const ip = forwarded || request.headers.get("x-real-ip")?.trim() || "unknown";
  const result = limit(`${scope}:${ip}`, maxRequests, windowMs);
  if (result.allowed) return null;
  return NextResponse.json({ error: "Too many requests" }, {
    status: 429,
    headers: { "Retry-After": String(result.retryAfter) },
  });
}
