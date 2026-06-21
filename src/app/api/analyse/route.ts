import { NextResponse } from "next/server";
import { Resend } from "resend";

import { analyse } from "../../../../lib/analyse.js";
import { localLlmConfig } from "../../../../lib/local-llm.js";
import { createSupabaseServer } from "../../../../lib/supabase-server.js";
import { runPipelineAnalysis, runSmallFileAnalysis, detectModality } from "../../../../lib/pipeline-local.js";
import { detectIndustry } from "../../../../lib/industryDetector";
import { INDUSTRY_MAP } from "../../../../lib/industryConfig";
import { getPostHogClient } from "../../../../lib/posthog-server";

export const runtime = "nodejs";

type Body = {
  text?: unknown;
  persist?: unknown;
  skipLocalModel?: unknown;
  localLlmModel?: unknown;
  industry?: unknown; // "auto" | IndustryId — passed from the frontend dropdown
  workspace_id?: unknown;
};

function trimModel(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const s = v.trim();
  return s === "" ? undefined : s;
}

async function buildAnalysis(
  text: string,
  skipLocalModel: boolean,
  modelOverride?: string,
  industryOverride?: string,
  onProgress: (stage: string) => void = () => {}
) {
  const base = analyse(text);
  const modality = detectModality(text);
  
  const cfg = localLlmConfig(
    modelOverride ? { model: modelOverride, modality } : { modality },
  );
  const useLocal = cfg && !skipLocalModel && !base.empty;

  console.log(`[API] useLocal: ${useLocal}, cfg: ${!!cfg}, skipLocalModel: ${skipLocalModel}, base.empty: ${base.empty}, modality: ${modality}`);

  // ── Industry detection ────────────────────────────────────────────────────
  // If user picked "auto" or didn't specify, run the heuristic detector
  const detectionResult = (!industryOverride || industryOverride === "auto")
    ? detectIndustry(text)
    : null;

  const resolvedIndustryId = (industryOverride && industryOverride !== "auto")
    ? industryOverride
    : (detectionResult?.industry ?? "auto");

  const industryDef = INDUSTRY_MAP[resolvedIndustryId as keyof typeof INDUSTRY_MAP]
    ?? INDUSTRY_MAP["auto"];

  const industryMeta = {
    id: industryDef.id,
    label: industryDef.label,
    emoji: industryDef.emoji,
    detectionMethod: (industryOverride && industryOverride !== "auto") ? "user_selected" : "auto_detected",
    confidence: detectionResult?.confidence ?? "high", // user-selected = always "high"
  };

  const industryLensText = industryDef.lens ?? "";

  console.log(`[Industry] Resolved: ${industryMeta.id} (${industryMeta.detectionMethod}, confidence: ${industryMeta.confidence})`);

  if (!useLocal || !cfg) {
    return { ...base, industry: industryMeta };
  }

  const PIPELINE_THRESHOLD = 20_000;

  const localModel = text.length > PIPELINE_THRESHOLD
    ? await runPipelineAnalysis(
        text,
        {
          metrics: base.metrics,
          topTokens: base.topTokens,
          moon: base.moon,
          caption: base.caption,
        },
        cfg,
        industryLensText,
        onProgress
      )
    : await runSmallFileAnalysis(
        text,
        {
          metrics: base.metrics,
          topTokens: base.topTokens,
          moon: base.moon,
          caption: base.caption,
        },
        cfg,
        industryLensText,
        onProgress
      );

  return { ...base, localModel, industry: industryMeta };
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Expected JSON body." }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text : "";
  const persist = body.persist === true;
  const skipLocalModel = body.skipLocalModel === true;
  const modelOverride = trimModel(body.localLlmModel);
  const industryOverride = typeof body.industry === "string" ? body.industry : "auto";
  const workspaceId = typeof body.workspace_id === "string" ? body.workspace_id : null;

  // Rate Limiting & Tier Verification
  const { auth } = await import("@clerk/nextjs/server");
  const { userId } = await auth();

  const identifier = userId || request.headers.get("x-forwarded-for") || "anonymous_user";
  
  const { checkRateLimit, checkFreeTierLimit } = await import("../../../../lib/ratelimit");
  
  // 1. Global Daily Rate Limit (Spam Protection)
  const rateLimitState = await checkRateLimit(identifier);

  if (!rateLimitState.success) {
    return NextResponse.json({ 
      error: "Rate limit exceeded. You have exhausted your daily analysis quota.",
      isRateLimited: true,
    }, { status: 429 });
  }

  if (rateLimitState.isWarning) {
    const { getPostHogClient } = await import("../../../../lib/posthog-server");
    const ph = getPostHogClient();
    ph.capture({ distinctId: identifier, event: "rate_limit_warning_hit", properties: { limit: rateLimitState.limit } });
    await ph.shutdown();
  }

  // 2. Tier Limit Verification
  let requiresUpgrade = false;
  let requiresSignup = false;

  if (userId) {
    // Authenticated user: check Supabase
    const supabase = createSupabaseServer();
    const { data: userProfile } = await supabase
      .from('users')
      .select('tier, analyses_count, credits')
      .eq('id', userId)
      .single();
    
    // If they are on the free 'explorer' tier and hit 3 analyses, they must upgrade
    // UNLESS they have purchased add-on credits.
    if (userProfile && userProfile.tier === 'explorer' && userProfile.analyses_count >= 3) {
      if (!userProfile.credits || userProfile.credits <= 0) {
        requiresUpgrade = true;
      }
    }
  } else {
    // Unauthenticated user: check Redis fixed count
    const freeTierState = await checkFreeTierLimit(identifier);
    if (!freeTierState.success) {
      requiresSignup = true;
    }
  }

  if (requiresSignup) {
    return NextResponse.json({ 
      error: "You've reached your 3 free analyses. Please sign up for an account to continue.",
      requiresSignup: true,
    }, { status: 403 });
  }

  if (requiresUpgrade) {
    return NextResponse.json({ 
      error: "You've reached your free plan limits. Please upgrade to the Analyst tier to run more reports.",
      requiresUpgrade: true,
    }, { status: 403 });
  }

  const mode = typeof (body as any).mode === "string" ? (body as any).mode : "parallel_sampled";

  // Handle Background Processing Mode
  if (mode === "background") {
    let jobId: string | null = null;
    
    // Create initial pending record in Supabase
    if (persist) {
      try {
        const supabase = createSupabaseServer();
        const { data, error } = await supabase
          .from("analyses")
          .insert({
            result: { status: "processing", progress: "Started background job" },
            source: "api/analyse-background",
            input: text,
            user_id: userId,
            workspace_id: workspaceId,
          })
          .select("id")
          .single();
          
        if (error) {
          console.error("Failed to create pending analysis record:", error);
          return NextResponse.json({ error: "Failed to initialize analysis record: " + error.message }, { status: 500 });
        }
        jobId = data?.id ? String(data.id) : null;
      } catch (e) {
        console.error("Exception during pending analysis record creation:", e);
        return NextResponse.json({ error: "Database exception during initialization" }, { status: 500 });
      }
    }

    if (!jobId) {
      jobId = crypto.randomUUID();
    }

    // Publish to QStash (or fallback for local dev)
    if (process.env.QSTASH_TOKEN) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || (request.headers.get("origin") ?? "http://localhost:3000");
      try {
        await fetch(`https://qstash.upstash.io/v2/publish/${appUrl}/api/qstash/analyse`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.QSTASH_TOKEN}`,
            "Content-Type": "application/json",
            "Upstash-Delay": "0s"
          },
          body: JSON.stringify({
            jobId,
            text,
            skipLocalModel,
            localLlmModel: modelOverride,
            industry: industryOverride,
            workspace_id: workspaceId,
            userId,
            persist
          })
        });
      } catch (e) {
        console.error("Failed to publish to QStash", e);
      }
    } else {
      console.warn("No QSTASH_TOKEN found! Background job requires Upstash QStash in production.");
      // Fire and forget fallback for local dev
      import('./backgroundTask').then(({ runBackground }) => {
         runBackground({
            jobId, text, skipLocalModel, modelOverride, industryOverride, workspaceId, userId, persist
         });
      }).catch(e => console.error(e));
    }
    
    return NextResponse.json({ jobId, status: "accepted" }, { status: 202 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const sendEvent = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const onProgress = (stage: string) => {
          sendEvent({ type: "stage", stage });
        };

        const result = await buildAnalysis(text, skipLocalModel, modelOverride, industryOverride, onProgress);

        let finalResponseData: any = {
          ok: true,
          analysis: result,
          saved: null,
          id: null,
        };

        sendEvent({ type: "stage", stage: "design" }); // Generating Executive Report / Saving

        if (persist) {
          try {
            const supabase = createSupabaseServer();
            const { data, error } = await supabase
              .from("analyses")
              .insert({
                result,
                source: "api/analyse",
                input: text,
                user_id: userId,
                workspace_id: workspaceId,
              })
              .select("id")
              .single();

            if (error) {
              finalResponseData.saved = false;
              finalResponseData.persistError = error.message;
            } else {
              finalResponseData.saved = true;
              finalResponseData.id = data?.id ?? null;

              // Increment analyses_count and decrement credits if applicable
              if (userId) {
                try {
                  const { data: userDoc } = await supabase.from('users').select('analyses_count, credits, tier').eq('id', userId).single();
                  if (userDoc) {
                    const isCreditRun = userDoc.tier === 'explorer' && userDoc.analyses_count >= 3 && (userDoc.credits || 0) > 0;
                    
                    const updateData: any = { analyses_count: (userDoc.analyses_count || 0) + 1 };
                    if (isCreditRun) {
                      updateData.credits = userDoc.credits - 1;
                    }

                    await supabase.from('users').update(updateData).eq('id', userId);
                  }
                } catch (e) {
                  console.error("Failed to update user analyses count / credits:", e);
                }
              }

              if (process.env.RESEND_API_KEY && userId) {
                try {
                  const { clerkClient } = await import("@clerk/nextjs/server");
                  const client = await clerkClient();
                  const user = await client.users.getUser(userId);
                  const email = user.emailAddresses[0]?.emailAddress;
                  
                  if (email) {
                    const resend = new Resend(process.env.RESEND_API_KEY);
                    resend.emails.send({
                      from: "Prism Intelligence <hello@prismintel.co>", // NOTE: Ensure this domain is verified in Resend, otherwise use onboarding@resend.dev
                      to: email,
                      subject: "Your Prism Intelligence Report is Ready",
                      html: `
                        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #080810; color: #fff; padding: 40px; border-radius: 12px;">
                          <h1 style="font-size: 24px; font-weight: 300; margin-bottom: 24px; color: #fff;">Prism <span style="font-weight: 700;">Intelligence</span></h1>
                          <p style="font-size: 16px; color: #a1a1aa; line-height: 1.6; margin-bottom: 32px;">
                            Your analysis of <strong>${(result as any).localModel?.executive_summary?.split(" ")[0] || "your dataset"}</strong> has completed processing.
                          </p>
                          <div style="margin-bottom: 40px;">
                            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/report/${data.id}" 
                               style="display: inline-block; padding: 12px 24px; background: #34d399; color: #000; text-decoration: none; font-weight: 600; border-radius: 6px; letter-spacing: 0.05em;">
                              View Full Report →
                            </a>
                          </div>
                        </div>
                      `,
                    }).then(res => console.log("[Resend] Standard email sent:", res)).catch((err) => console.error("[Resend] error:", err));
                  }
                } catch (err) {
                  console.error("[Resend] Failed to fetch user or send email:", err);
                }
              }
            }
          } catch (e) {
            finalResponseData.saved = false;
            finalResponseData.persistError = e instanceof Error ? e.message : "Supabase unavailable.";
          }
        }

        sendEvent({ type: "result", data: finalResponseData });
      } catch (error: any) {
        sendEvent({ type: "error", message: error.message || "An error occurred during analysis" });
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
