import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { checkRateLimit } from "../../../../lib/ratelimit";
import { generateUploadUrl } from "../../../../lib/storage";

const ALLOWED_MIME_TYPES = [
  "text/csv",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
  "text/plain",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // xlsx
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate Limiting Check
    // Defaulting to "free" tier, in a real app, you would fetch user's tier from the DB
    const { success } = await checkRateLimit(userId, "free", "upload");
    if (!success) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const body = await request.json();
    const { filename, contentType, size } = body;

    // 1. Validate File Size
    if (size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds the 10MB limit." },
        { status: 400 }
      );
    }

    // 2. Validate MIME Type
    if (!ALLOWED_MIME_TYPES.includes(contentType)) {
      return NextResponse.json(
        { error: "Invalid file type. Only CSV, PDF, DOCX, TXT, and XLSX are allowed." },
        { status: 400 }
      );
    }

    // Generate unique file key: userId/timestamp_filename
    const fileKey = `${userId}/${Date.now()}_${filename.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;

    // 3. Generate Signed URL for direct upload to R2
    const uploadUrl = await generateUploadUrl(fileKey, contentType);

    return NextResponse.json({
      uploadUrl,
      fileKey,
      url: `https://${process.env.R2_PUBLIC_DOMAIN}/${fileKey}`, // Adjust based on R2 public access or custom domain
    });

  } catch (error) {
    console.error("Upload Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
