import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createSupabaseServer } from '../../../../../lib/supabase-server.js';

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!signature || !secret) {
      return NextResponse.json({ error: 'Missing signature or secret' }, { status: 400 });
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;

    // Handle payment.captured event
    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = payload.payload.payment.entity;
      const orderNotes = paymentEntity.notes;

      if (!orderNotes || !orderNotes.userId) {
        return NextResponse.json({ error: 'Missing userId in notes' }, { status: 400 });
      }

      const { userId, tierName, isCredit, isAnnual } = orderNotes;
      const supabase = createSupabaseServer();

      if (isCredit === 'true') {
        // Fetch current user
        const { data: userDoc, error: fetchError } = await supabase
          .from('users')
          .select('credits')
          .eq('id', userId)
          .single();

        if (!fetchError) {
          const currentCredits = userDoc?.credits || 0;
          await supabase
            .from('users')
            .update({ credits: currentCredits + 1 })
            .eq('id', userId);
        }
      } else {
        // Subscription payment
        const daysToAdd = isAnnual === 'true' ? 365 : 30;
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + daysToAdd);

        await supabase
          .from('users')
          .update({
            tier: tierName,
            subscription_status: 'active',
            subscription_end_date: endDate.toISOString(),
          })
          .eq('id', userId);
      }
    }

    return NextResponse.json({ status: 'success' });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
