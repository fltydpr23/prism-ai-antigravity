import { analyse } from "../../../../lib/analyse.js";
import { localLlmConfig } from "../../../../lib/local-llm.js";
import { createSupabaseServer } from "../../../../lib/supabase-server.js";
import { runPipelineAnalysis, runSmallFileAnalysis, detectModality } from "../../../../lib/pipeline-local.js";
import { detectIndustry } from "../../../../lib/industryDetector";
import { INDUSTRY_MAP } from "../../../../lib/industryConfig";
import { Resend } from "resend";

export async function runBackground({ jobId, text, skipLocalModel, modelOverride, industryOverride, workspaceId, userId, persist }: any) {
  try {
    const base = analyse(text);
    const modality = detectModality(text);
    const cfg = localLlmConfig(modelOverride ? { model: modelOverride, modality } : { modality });
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
            
            const execSummary = (result.localModel?.parsed as any)?.executive_summary || "";
            const summaryExcerpt = execSummary ? execSummary.split(". ").slice(0, 2).join(". ") + "." : null;
            const industryLabel = result.industry?.label || "Unknown";
            const industryEmoji = result.industry?.emoji || "📊";
            const prismScore = result.localModel?.prism_score ?? null;
            const reportUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://prismintel.co'}/report/${jobId}`;
            
            const resendResponse = await resend.emails.send({
              from: "Prism Intelligence <hello@prismintel.co>",
              to: email,
              subject: `Your Prism Pro Report is Ready — ${industryEmoji} ${industryLabel} Analysis`,
              html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#09090C;font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;">
  <div style="max-width:580px;margin:0 auto;padding:48px 24px;">
    
    <!-- Header -->
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:40px;">
      <div style="width:24px;height:24px;border-radius:50%;background:linear-gradient(135deg,#34d399,#22d3ee);flex-shrink:0;"></div>
      <span style="font-size:14px;font-weight:600;letter-spacing:0.05em;color:rgba(255,255,255,0.9);">PRISM INTELLIGENCE</span>
    </div>
    
    <!-- Status Badge -->
    <div style="display:inline-flex;align-items:center;gap:6px;background:rgba(52,211,153,0.1);border:1px solid rgba(52,211,153,0.2);border-radius:100px;padding:4px 12px;margin-bottom:28px;">
      <div style="width:6px;height:6px;border-radius:50%;background:#34d399;"></div>
      <span style="font-size:11px;font-weight:600;letter-spacing:0.08em;color:#34d399;text-transform:uppercase;">Comprehensive Analysis Complete</span>
    </div>
    
    <!-- Headline -->
    <h1 style="font-size:28px;font-weight:700;line-height:1.2;letter-spacing:-0.03em;color:#ffffff;margin:0 0 16px 0;">
      Your full intelligence report is ready.
    </h1>
    
    ${summaryExcerpt ? `
    <!-- Executive Summary Excerpt -->
    <div style="border-left:2px solid rgba(52,211,153,0.4);padding-left:16px;margin:24px 0 32px 0;">
      <p style="font-size:13px;color:rgba(255,255,255,0.55);line-height:1.7;margin:0;font-style:italic;">
        "${summaryExcerpt}"
      </p>
    </div>` : ""}
    
    <!-- Metadata Row -->
    <div style="display:flex;gap:20px;flex-wrap:wrap;margin-bottom:36px;">
      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:12px 16px;flex:1;min-width:120px;">
        <p style="font-size:10px;font-weight:600;letter-spacing:0.08em;color:rgba(255,255,255,0.35);text-transform:uppercase;margin:0 0 4px 0;">Industry</p>
        <p style="font-size:14px;font-weight:600;color:#fff;margin:0;">${industryEmoji} ${industryLabel}</p>
      </div>
      ${prismScore !== null ? `
      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:12px 16px;flex:1;min-width:120px;">
        <p style="font-size:10px;font-weight:600;letter-spacing:0.08em;color:rgba(255,255,255,0.35);text-transform:uppercase;margin:0 0 4px 0;">Prism Score</p>
        <p style="font-size:14px;font-weight:600;color:#34d399;margin:0;font-variant-numeric:tabular-nums;">${prismScore} / 100</p>
      </div>` : ""}
      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:12px 16px;flex:1;min-width:120px;">
        <p style="font-size:10px;font-weight:600;letter-spacing:0.08em;color:rgba(255,255,255,0.35);text-transform:uppercase;margin:0 0 4px 0;">Mode</p>
        <p style="font-size:14px;font-weight:600;color:#22d3ee;margin:0;">100% Complete</p>
      </div>
    </div>
    
    <!-- CTA Button -->
    <a href="${reportUrl}" style="display:inline-block;padding:14px 28px;background:linear-gradient(135deg,#34d399,#22d3ee);color:#000;text-decoration:none;font-weight:700;font-size:14px;border-radius:10px;letter-spacing:0.02em;">
      View Full Report →
    </a>
    
    <!-- Divider -->
    <div style="height:1px;background:rgba(255,255,255,0.07);margin:48px 0 32px 0;"></div>
    
    <!-- Footer -->
    <p style="font-size:11px;color:rgba(255,255,255,0.2);line-height:1.6;margin:0;">
      This report was generated by Prism Intelligence on behalf of your Analyst subscription.<br>
      <a href="https://prismintel.co" style="color:rgba(255,255,255,0.3);text-decoration:none;">prismintel.co</a>
    </p>
    
  </div>
</body>
</html>`,
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
