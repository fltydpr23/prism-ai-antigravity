import { analyse } from "../../../../lib/analyse.js";
import { localLlmConfig } from "../../../../lib/local-llm.js";
import { createSupabaseServer } from "../../../../lib/supabase-server.js";
import { runPipelineAnalysis, runSmallFileAnalysis } from "../../../../lib/pipeline-local.js";
import { detectIndustry } from "../../../../lib/industryDetector";
import { INDUSTRY_MAP } from "../../../../lib/industryConfig";
import { Resend } from "resend";

export async function runBackground({ jobId, text, skipLocalModel, modelOverride, industryOverride, workspaceId, userId, persist }: any) {
  try {
    const base = analyse(text);
    const cfg = localLlmConfig(modelOverride ? { model: modelOverride } : {});
    if (cfg) {
      (cfg as any).mode = "background";
    }
    const useLocal = cfg && !skipLocalModel && !base.empty;

    const detectionResult = (!industryOverride || industryOverride === "auto") ? detectIndustry(text) : null;
    const resolvedIndustryId = (industryOverride && industryOverride !== "auto") ? industryOverride : (detectionResult?.industry ?? "auto");
    const industryDef = INDUSTRY_MAP[resolvedIndustryId as keyof typeof INDUSTRY_MAP] ?? INDUSTRY_MAP["auto"];

    const industryMeta = {
      id: industryDef.id,
      label: industryDef.label,
      emoji: industryDef.emoji,
      detectionMethod: (industryOverride && industryOverride !== "auto") ? "user_selected" : "auto_detected",
      confidence: detectionResult?.confidence ?? "high",
    };

    let result = { ...base, industry: industryMeta } as any;

    if (useLocal && cfg) {
      const industryLensText = industryDef.lens ?? "";
      const PIPELINE_THRESHOLD = 20_000;
      const localModel = text.length > PIPELINE_THRESHOLD
        ? await runPipelineAnalysis(text, { metrics: base.metrics, topTokens: base.topTokens, moon: base.moon, caption: base.caption }, cfg, industryLensText, () => {})
        : await runSmallFileAnalysis(text, { metrics: base.metrics, topTokens: base.topTokens, moon: base.moon, caption: base.caption }, cfg, industryLensText, () => {});
      result.localModel = localModel;
    }

    if (persist) {
      const supabase = createSupabaseServer();
      await supabase.from("analyses").update({ result }).eq("id", jobId);

      if (userId) {
         try {
           const { data: userDoc } = await supabase.from('users').select('analyses_count').eq('id', userId).single();
           if (userDoc) {
             await supabase.from('users').update({ analyses_count: (userDoc.analyses_count || 0) + 1 }).eq('id', userId);
           }
         } catch (e) { console.error("Failed to increment user analyses count:", e); }
      }

      if (process.env.RESEND_API_KEY && userId) {
        try {
          const { clerkClient } = await import("@clerk/nextjs/server");
          const client = await clerkClient();
          const user = await client.users.getUser(userId);
          const email = user.emailAddresses[0]?.emailAddress;
          
          if (email) {
            const resend = new Resend(process.env.RESEND_API_KEY);
            const resendResponse = await resend.emails.send({
              from: "Prism Intelligence <hello@prismintel.co>", // NOTE: Ensure this domain is verified in Resend, otherwise use onboarding@resend.dev
              to: email,
              subject: "Your Prism Intelligence Background Report is Ready",
              html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #080810; color: #fff; padding: 40px; border-radius: 12px;">
                  <h1 style="font-size: 24px; font-weight: 300; margin-bottom: 24px; color: #fff;">Prism <span style="font-weight: 700;">Intelligence</span></h1>
                  <p style="font-size: 16px; color: #a1a1aa; line-height: 1.6; margin-bottom: 32px;">
                    Your comprehensive background analysis of <strong>${result.localModel?.executive_summary?.split(" ")[0] || "your dataset"}</strong> has completed processing.
                  </p>
                  <div style="margin-bottom: 40px;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/report/${jobId}" 
                       style="display: inline-block; padding: 12px 24px; background: #34d399; color: #000; text-decoration: none; font-weight: 600; border-radius: 6px; letter-spacing: 0.05em;">
                       View Full Report →
                    </a>
                  </div>
                </div>
              `,
            });
            console.log("[Resend] Background email sent:", resendResponse);
          }
        } catch (err) { console.error("[Resend] Failed to send email:", err); }
      }
    }
  } catch (error) {
    console.error("Background job failed:", error);
    if (persist) {
      const supabase = createSupabaseServer();
      await supabase.from("analyses").update({ result: { status: "failed", error: String(error) } }).eq("id", jobId);
    }
  }
}
