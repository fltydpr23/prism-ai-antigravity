import { z } from "zod";

const envSchema = z.object({
  // AI
  TOGETHER_API_KEY: z.string().min(1, "TOGETHER_API_KEY is required"),
  
  // Database (Supabase)
  NEXT_PUBLIC_SUPABASE_URL: z.string().min(1, "NEXT_PUBLIC_SUPABASE_URL is required"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),
  
  // Storage (Cloudflare R2)
  R2_ACCOUNT_ID: z.string().min(1, "R2_ACCOUNT_ID is required").optional(),
  R2_ACCESS_KEY_ID: z.string().min(1, "R2_ACCESS_KEY_ID is required").optional(),
  R2_SECRET_ACCESS_KEY: z.string().min(1, "R2_SECRET_ACCESS_KEY is required").optional(),
  R2_BUCKET_NAME: z.string().min(1, "R2_BUCKET_NAME is required").optional(),
  
  // Rate Limiting (Upstash)
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
});

/**
 * Parse and validate environment variables at runtime.
 * We use a try/catch block so this doesn't crash the build process
 * if some vars are missing during build time, but it will throw a 
 * loud error when running the app.
 */
function getEnv() {
  const parsed = envSchema.safeParse(process.env);
  
  if (!parsed.success) {
    console.error(
      "❌ Invalid environment variables:",
      parsed.error.flatten().fieldErrors
    );
    throw new Error("Invalid environment variables");
  }
  
  return parsed.data;
}

export const env = getEnv();
