import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  const stripeKey    = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!stripeKey || !webhookSecret) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  const body      = await req.text()
  const signature = req.headers.get('stripe-signature') ?? ''

  let event: Stripe.Event
  try {
    const stripe = new Stripe(stripeKey)
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('[stripe/webhook] signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const userId  = session.metadata?.user_id
    const plan    = session.metadata?.plan ?? 'solo'

    if (userId) {
      const service = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      await service.from('user_profiles').update({
        plan,
        stripe_customer_id:    session.customer as string,
        stripe_subscription_id: session.subscription as string,
        subscription_status:   'active',
      }).eq('user_id', userId)

      console.log(`[stripe/webhook] Activated ${plan} plan for user ${userId}`)
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub    = event.data.object as Stripe.Subscription
    const userId = sub.metadata?.user_id
    if (userId) {
      const service = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      await service.from('user_profiles').update({
        subscription_status: 'cancelled',
      }).eq('user_id', userId)
    }
  }

  return NextResponse.json({ received: true })
}
