import { NextResponse } from "next/server";
import { createSupabaseServer } from "../../../../../lib/supabase-server.js";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ ok: false, error: "Missing report ID." }, { status: 400 });
  }

  try {
    const supabase = createSupabaseServer();
    const { data, error } = await supabase
      .from("analyses")
      .select("id, created_at, result, workspace_id, workspaces(id, name, logo_url, brand_color)")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json({ ok: false, error: "Report not found." }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      id: data.id,
      createdAt: data.created_at,
      analysis: data.result,
      workspace: data.workspaces,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Supabase unavailable.";
    return NextResponse.json({ ok: false, error: message }, { status: 503 });
  }
}
