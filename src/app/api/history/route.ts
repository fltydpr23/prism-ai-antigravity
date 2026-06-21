import { NextResponse } from "next/server";
import { createSupabaseServer } from "../../../../lib/supabase-server.js";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { auth } = await import("@clerk/nextjs/server");
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized. Please sign in to view your archive." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspace_id");

    const supabase = createSupabaseServer();
    let query = supabase
      .from("analyses")
      .select("id, created_at, result")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
      
    if (workspaceId && workspaceId !== "null") {
      query = query.eq("workspace_id", workspaceId);
    } else {
      query = query.is("workspace_id", null);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    // Extract just the fields we need for the archive list
    const items = (data ?? []).map((row: any) => {
      const result = row.result ?? {};
      const localModel = result.localModel?.parsed ?? {};
      const industry = result.industry ?? null;
      const metrics = result.metrics ?? {};

      return {
        id: row.id,
        createdAt: row.created_at,
        execSummary: localModel.executive_summary ?? "No summary available.",
        industry,
        wordCount: metrics.wordCount ?? 0,
        // We'll compute score from the raw data client-side if needed
        // but pass the band label if it's cached in the result
        prismBand: null,
      };
    });

    return NextResponse.json({ ok: true, items });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Supabase unavailable.";
    return NextResponse.json({ ok: false, error: message }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const { auth } = await import("@clerk/nextjs/server");
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized. Please sign in to sync your local archive." }, { status: 401 });
    }

    const body = await request.json() as {
      items?: Array<{
        result: any;
        input: string;
        createdAt: string;
        workspace_id?: string;
      }>;
    };
    const items = body.items || [];

    if (items.length === 0) {
      return NextResponse.json({ ok: true, synced: 0 });
    }

    const supabase = createSupabaseServer();
    
    // Prepare the insert structures
    const inserts = items.map((item) => ({
      result: item.result,
      input: item.input,
      user_id: userId,
      workspace_id: item.workspace_id || null,
      created_at: item.createdAt || new Date().toISOString(),
      source: "api/history/sync",
    }));

    const { error } = await supabase
      .from("analyses")
      .insert(inserts);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, synced: inserts.length });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Sync failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
