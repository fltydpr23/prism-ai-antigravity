import { NextResponse } from "next/server";

import { analyse } from "../../../../lib/analyse.js";
import { localLlmConfig, runLocalLlmAnalysis } from "../../../../lib/local-llm.js";
import { createSupabaseServer } from "../../../../lib/supabase-server.js";

export const runtime = "nodejs";

type Body = {
  text?: unknown;
  persist?: unknown;
  skipLocalModel?: unknown;
  localLlmModel?: unknown;
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
) {
  const base = analyse(text);
  const cfg = localLlmConfig(
    modelOverride ? { model: modelOverride } : {},
  );
  const useLocal = cfg && !skipLocalModel && !base.empty;

  if (!useLocal || !cfg) {
    return base;
  }

  const localModel = await runLocalLlmAnalysis(
    text,
    {
      metrics: base.metrics,
      topTokens: base.topTokens,
      moon: base.moon,
      caption: base.caption,
    },
    cfg,
  );

  return { ...base, localModel };
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

  const result = await buildAnalysis(text, skipLocalModel, modelOverride);

  if (!persist) {
    return NextResponse.json({
      ok: true,
      analysis: result,
      saved: null,
    });
  }

  try {
    const supabase = createSupabaseServer();
    const { data, error } = await supabase
      .from("analyses")
      .insert({
        result,
        source: "api/analyse",
        input: text,
      })
      .select("id")
      .single();

    if (error) {
      const hint =
        typeof error.message === "string" &&
        /result|schema cache|column/i.test(error.message)
          ? ' Add the missing columns (see supabase/repair_analyses.sql in the repo) in the Supabase SQL editor, then save again.'
          : "";
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

    return NextResponse.json({
      ok: true,
      analysis: result,
      saved: true,
      id: data?.id ?? null,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Supabase unavailable.";
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
