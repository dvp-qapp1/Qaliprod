import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { SubscriptionTier, RateLimitResult } from "@/types/api.types";

let _redis: Redis | null = null;

/**
 * Get Redis client lazily - only creates when needed.
 */
function getRedis(): Redis {
    if (!_redis) {
        _redis = Redis.fromEnv();
    }
    return _redis;
}

/**
 * Rate limits per subscription tier.
 * Free: 10 requests per minute
 * Premium: 50 requests per minute
 * Pro: 200 requests per minute
 */
const TIER_LIMITS = {
    free: { requests: 10, window: "1 m" },
    premium: { requests: 50, window: "1 m" },
    pro: { requests: 200, window: "1 m" },
} as const;

/**
 * Create a rate limiter for a specific subscription tier.
 */
export function createRateLimiter(tier: SubscriptionTier) {
    const config = TIER_LIMITS[tier];

    return new Ratelimit({
        redis: getRedis(),
        limiter: Ratelimit.slidingWindow(
            config.requests,
            config.window as "1 m" | "1 h" | "1 d"
        ),
        analytics: true,
        prefix: `qalia:ratelimit:${tier}`,
    });
}

/**
 * Check if a user is within their rate limit.
 *
 * @param userId - The user's unique identifier
 * @param tier - The user's subscription tier
 * @returns Rate limit result with allowed status and remaining requests
 */
export async function checkRateLimit(
    userId: string,
    tier: SubscriptionTier = "free"
): Promise<RateLimitResult> {
    const limiter = createRateLimiter(tier);
    const { success, remaining, reset } = await limiter.limit(userId);

    return {
        allowed: success,
        remaining,
        resetAt: new Date(reset),
    };
}
