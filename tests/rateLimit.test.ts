import { describe, expect, it } from "vitest";
import { createRateLimiter, rateLimitResponse } from "@/backend/lib/rateLimit";

describe("sliding window rate limiter", () => {
  it("allows N requests, rejects N+1, and resets after its window", () => {
    let now = 1000;
    const check = createRateLimiter(() => now);
    expect(check("ip-a", 2, 1000).allowed).toBe(true);
    expect(check("ip-a", 2, 1000).allowed).toBe(true);
    expect(check("ip-a", 2, 1000)).toEqual({ allowed: false, retryAfter: 1 });
    now += 1000;
    expect(check("ip-a", 2, 1000).allowed).toBe(true);
  });
  it("keeps separate keys isolated", () => {
    let now = 1000;
    const check = createRateLimiter(() => now);
    check("ip-a", 1, 1000);
    expect(check("ip-b", 1, 1000).allowed).toBe(true);
    now += 1001;
    expect(check("ip-a", 1, 1000).allowed).toBe(true);
  });
  it("prunes expired keys and returns a Retry-After header", () => {
    let now = 0;
    const check = createRateLimiter(() => now);
    for (let index = 0; index < 10_001; index += 1) check(`key-${index}`, 1, 1000);
    now = 2000;
    expect(check("fresh", 1, 1000).allowed).toBe(true);
    expect(check("key-10000", 1, 1000).allowed).toBe(true);

    const request = new Request("http://local/api", { headers: { "x-forwarded-for": "rate-limit-test" } });
    expect(rateLimitResponse(request, "test", 1, 60_000)).toBeNull();
    const limited = rateLimitResponse(request, "test", 1, 60_000);
    expect(limited?.status).toBe(429);
    expect(limited?.headers.get("Retry-After")).toBe("60");
  });
});
