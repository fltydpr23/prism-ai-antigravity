import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { razorpay } from "../../../../../lib/razorpay";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress;

    if (!email) {
      return NextResponse.json({ items: [] });
    }

    // Fetch recent payments. Razorpay API returns up to 100 items by default if count is specified.
    const paymentsResponse = await razorpay.payments.all({
      count: 100,
    } as any);

    const payments = paymentsResponse.items || [];
    
    // Filter payments manually to ensure they belong to this user 
    // (either matching email or matching userId in notes)
    // And only return captured/successful payments.
    const userPayments = payments.filter((p: any) => 
      (p.email === email || p.notes?.userId === userId) && 
      (p.status === "captured" || p.status === "authorized")
    );

    // Map to a clean format for the frontend
    const items = userPayments.map((p: any) => ({
      id: p.id,
      amount: p.amount / 100, // convert paise to INR
      currency: p.currency,
      status: p.status,
      method: p.method,
      description: p.notes?.tierName ? `Prism ${p.notes.tierName}` : "Prism Intelligence",
      createdAt: new Date(p.created_at * 1000).toISOString(),
    }));

    return NextResponse.json({ items });
  } catch (error: any) {
    console.error("[billing history error]:", error);
    return NextResponse.json({ error: "Failed to fetch billing history" }, { status: 500 });
  }
}
