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

    // Handle subscription events
    if (event === 'subscription.charged') {
      const subscription = payload.payload.subscription.entity;
      const payment = payload.payload.payment.entity;
      const orderNotes = payment.notes || subscription.notes;

      if (!orderNotes || !orderNotes.userId) {
        return NextResponse.json({ error: 'Missing userId in notes' }, { status: 400 });
      }

      const { userId, tier, billingPeriod } = orderNotes;
      const supabase = createSupabaseServer();
      
      const currentEnd = subscription.current_end ? new Date(subscription.current_end * 1000) : new Date();

      await supabase
        .from('users')
        .update({
          tier: tier || 'pro',
          subscription_status: 'active',
          subscription_end_date: currentEnd.toISOString(),
          subscription_id: subscription.id,
          billing_cycle: billingPeriod || 'monthly',
        })
        .eq('id', userId);
    }
    
    if (event === 'subscription.halted' || event === 'subscription.cancelled') {
      const subscription = payload.payload.subscription.entity;
      const orderNotes = subscription.notes;
      const userId = orderNotes?.userId;
      
      if (userId) {
        const supabase = createSupabaseServer();
        await supabase
          .from('users')
          .update({
            subscription_status: 'canceled',
            tier: 'explorer' // Gracefully downgrade
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
