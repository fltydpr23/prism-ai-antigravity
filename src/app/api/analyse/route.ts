import { NextResponse } from "next/server";
import { Resend } from "resend";

import { analyse } from "../../../../lib/analyse.js";
import { localLlmConfig } from "../../../../lib/local-llm.js";
import { createSupabaseServer } from "../../../../lib/supabase-server.js";
import { runPipelineAnalysis, runSmallFileAnalysis } from "../../../../lib/pipeline-local.js";
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
) {
  const base = analyse(text);
  const cfg = localLlmConfig(
    modelOverride ? { model: modelOverride } : {},
  );
  const useLocal = cfg && !skipLocalModel && !base.empty;

  console.log(`[API] useLocal: ${useLocal}, cfg: ${!!cfg}, skipLocalModel: ${skipLocalModel}, base.empty: ${base.empty}`);

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

  // Rate Limiting
  const { auth } = await import("@clerk/nextjs/server");
  const { userId } = await auth();

  // If we are persisting, we enforce rate limiting based on the user ID or IP (fallback to IP for anon)
  const identifier = userId || request.headers.get("x-forwarded-for") || "anonymous_user";
  
  const { checkRateLimit } = await import("../../../../lib/ratelimit");
  const rateLimitState = await checkRateLimit(identifier);

  if (!rateLimitState.success) {
    return NextResponse.json({ 
      error: "Rate limit exceeded. You have exhausted your daily analysis quota.",
      isRateLimited: true,
    }, { status: 429 });
  }

  // Soft limit warning (optional telemetry)
  if (rateLimitState.isWarning) {
    const { getPostHogClient } = await import("../../../../lib/posthog-server");
    const ph = getPostHogClient();
    ph.capture({ distinctId: identifier, event: "rate_limit_warning_hit", properties: { limit: rateLimitState.limit } });
    await ph.shutdown();
  }

  const result = await buildAnalysis(text, skipLocalModel, modelOverride, industryOverride);

  if (!persist) {
    return NextResponse.json({
      ok: true,
      analysis: result,
      saved: null,
    });
  }

  try {
    const { auth } = await import("@clerk/nextjs/server");
    const { userId } = await auth();

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
      const hint =
        typeof error.message === "string" &&
        /result|schema cache|column/i.test(error.message)
          ? ' Add the missing columns (see supabase/repair_analyses.sql in the repo) in the Supabase SQL editor, then save again.'
          : "";
      const posthog = getPostHogClient();
      posthog.capture({
        distinctId: "server",
        event: "analysis_save_failed",
        properties: { error: error.message, industry: result.industry?.id, text_length: text.length },
      });
      await posthog.shutdown();
      return NextResponse.json(
        {
          ok: true,
          analysis: result,
          saved: false,
          persistError: `${error.message}${hint}`,
        },
        { status: 200 },
      );
    }

    const posthog = getPostHogClient();
    posthog.capture({
      distinctId: "server",
      event: "analysis_saved",
      properties: {
        report_id: data?.id ?? null,
        industry: result.industry?.id,
        industry_detection_method: result.industry?.detectionMethod,
        text_length: text.length,
        model: modelOverride ?? "default",
      },
    });
    await posthog.shutdown();

    // Trigger Email Notification if RESEND_API_KEY is present
    if (process.env.RESEND_API_KEY && userId) {
      try {
        const { clerkClient } = await import("@clerk/nextjs/server");
        const client = await clerkClient();
        const user = await client.users.getUser(userId);
        const email = user.emailAddresses[0]?.emailAddress;
        
        if (email) {
          const resend = new Resend(process.env.RESEND_API_KEY);
          
          // Fire and forget so we don't block the request
          resend.emails.send({
            from: "Prism Intelligence <hello@prism.ai>",
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
                <hr style="border: none; border-top: 1px solid #1e1e32; margin-bottom: 24px;" />
                <p style="font-size: 12px; color: #52525b;">
                  This is an automated notification from Prism. Please do not reply directly to this email.
                </p>
              </div>
            `,
          }).catch((err) => console.error("Resend error:", err));
        }
      } catch (err) {
        console.error("Failed to fetch user or send email:", err);
      }
    }

    return NextResponse.json({
      ok: true,
      analysis: result,
      saved: true,
      id: data?.id ?? null,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Supabase unavailable.";
    const posthog = getPostHogClient();
    posthog.capture({
      distinctId: "server",
      event: "analysis_save_failed",
      properties: { error: message, industry: result.industry?.id, text_length: text.length },
    });
    await posthog.shutdown();
    return NextResponse.json(
      {
        ok: true,
        analysis: result,
        saved: false,
        persistError: message,
      },
      { status: 200 },
    );
  }
}
