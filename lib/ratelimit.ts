import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

// Create a Redis client. If keys are missing (e.g., local development without Upstash), 
// we initialize it with dummy values so the app doesn't crash on boot, but we'll check validity before using.
const url = process.env.UPSTASH_REDIS_REST_URL ?? "https://dummy.upstash.io";
const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? "dummy-token";

export const redis = new Redis({
  url,
  token,
});

// Define rate limits for different tiers and actions
export const rateLimits = {
  analyse: {
    free: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, "1 d"),
      analytics: true,
      prefix: "@upstash/ratelimit/analyse_free",
    }),
    pro: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, "1 d"),
      analytics: true,
      prefix: "@upstash/ratelimit/analyse_pro",
    }),
  },
  upload: {
    free: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "1 d"),
      analytics: true,
      prefix: "@upstash/ratelimit/upload_free",
    }),
    pro: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, "1 d"),
      analytics: true,
      prefix: "@upstash/ratelimit/upload_pro",
    }),
  },
};

// Soft limit: warnings for free tier analysis at 2 reports
export const analysisSoftLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(2, "1 d"),
  analytics: false,
  prefix: "@upstash/ratelimit/analyse_soft_free",
});

/**
 * Helper to check rate limits gracefully.
 * If Upstash keys are missing, it bypasses the limit automatically.
 */
export async function checkRateLimit(
  userId: string,
  tier: "free" | "pro" = "free",
  action: "analyse" | "upload" = "analyse"
) {
  // Bypass if no real keys are configured
  if (url === "https://dummy.upstash.io") {
    return { success: true, isWarning: false, limit: 10, remaining: 10 };
  }

  try {
    const limiter = rateLimits[action]?.[tier];
    if (!limiter) {
      return { success: true, isWarning: false, limit: 10, remaining: 10 };
    }

    const hard = await limiter.limit(userId);

    // If it's a free analysis request, also check the soft limit warning
    let isWarning = false;
    if (action === "analyse" && tier === "free" && hard.success) {
      const soft = await analysisSoftLimit.limit(userId);
      isWarning = !soft.success;
    }

    return {
      success: hard.success,
      isWarning,
      limit: hard.limit,
      remaining: hard.remaining,
    };
  } catch (error) {
    console.error(`Rate limiting failed for ${action} (${tier}). Bypassing limit for safety.`, error);
    return { success: true, isWarning: false, limit: 10, remaining: 10 };
  }
}
