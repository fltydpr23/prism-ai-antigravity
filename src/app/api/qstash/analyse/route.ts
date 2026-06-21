import { NextResponse } from "next/server";
import { runBackground } from "../../analyse/backgroundTask";

// Verify QStash signature in production
import { verifySignatureAppRouter } from "@upstash/qstash/dist/nextjs";

async function handler(req: Request) {
  try {
    const body = await req.json();
    
    // runBackground handles the entire pipeline, saving to DB, and sending the email.
    await runBackground(body);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("QStash Webhook Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// In Next.js App Router, we wrap the handler with verifySignatureAppRouter
// This ensures that only Upstash QStash can trigger this endpoint.
// We apply it conditionally so the build doesn't fail if the env variables are missing locally.
export const POST = process.env.QSTASH_CURRENT_SIGNING_KEY 
  ? verifySignatureAppRouter(handler) 
  : handler;
