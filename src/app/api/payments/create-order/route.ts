import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { razorpay } from "../../../../../lib/razorpay";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress;

    const body = await req.json();
    const { planId, isAnnual } = body;

    // Map plan to price (in INR paise)
    let amount = 0;
    let tierName = "";
    let isCredit = false;

    if (planId === "credit") {
      amount = 249 * 100; // ₹249
      tierName = "credit";
      isCredit = true;
    } else if (planId === "starter") {
      amount = isAnnual ? 799 * 12 * 100 : 999 * 100;
      tierName = "starter";
    } else if (planId === "pro") {
      amount = isAnnual ? 2399 * 12 * 100 : 2999 * 100;
      tierName = "pro";
    } else if (planId === "agency") {
      amount = isAnnual ? 11999 * 12 * 100 : 14999 * 100;
      tierName = "agency";
    } else {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // Create Razorpay Order
    const options = {
      amount: amount,
      currency: "INR",
      receipt: `rcpt_${userId.substring(0,8)}_${Date.now()}`,
      notes: {
        userId: userId,
        planId: planId,
        tierName: tierName,
        isCredit: isCredit ? "true" : "false",
        isAnnual: isAnnual ? "true" : "false",
        email: email || "",
      },
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error: any) {
    console.error("Error creating Razorpay order:", error);
    return NextResponse.json(
      { error: "Failed to create order", details: error.message },
      { status: 500 }
    );
  }
}
