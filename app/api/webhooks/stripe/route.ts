import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Map Stripe price IDs to your plan names
// Update these with your actual Stripe price IDs
const PRICE_TO_PLAN: Record<string, string> = {
  [process.env.STRIPE_PRICE_SOLO_MONTHLY  ?? 'price_solo_monthly']:  'solo',
  [process.env.STRIPE_PRICE_SOLO_ANNUAL   ?? 'price_solo_annual']:   'solo',
  [process.env.STRIPE_PRICE_TEAM_MONTHLY  ?? 'price_team_monthly']:  'team',
  [process.env.STRIPE_PRICE_TEAM_ANNUAL   ?? 'price_team_annual']:   'team',
}

export async function POST(request: Request) {
  const body = await request.text()
  const sig  = request.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!sig || !webhookSecret) {
    console.error('[stripe-webhook] Missing signature or secret')
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  // Verify the event came from Stripe
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    console.error('[stripe-webhook] Signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Idempotency — skip if we've already processed this event
  const { data: existing } = await supabase
    .from('stripe_events')
    .select('id')
    .eq('id', event.id)
    .single()

  if (existing) {
    console.log('[stripe-webhook] Already processed:', event.id)
    return NextResponse.json({ received: true, status: 'duplicate' })
  }

  // Log the event immediately
  await supabase.from('stripe_events').insert({
    id: event.id,
    type: event.type,
    payload: event as unknown as Record<string, unknown>,
  })

  console.log('[stripe-webhook] Processing event:', event.type, event.id)

  try {
    switch (event.type) {

      // ── New subscription / payment ────────────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== 'subscription') break

        const customerId     = session.customer as string
        const subscriptionId = session.subscription as string
        const customerEmail  = session.customer_email ?? session.customer_details?.email

        if (!customerEmail) {
          console.error('[stripe-webhook] No email on checkout session:', session.id)
          break
        }

        // Get the price ID to determine plan
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const priceId = subscription.items.data[0]?.price.id ?? ''
        const plan = PRICE_TO_PLAN[priceId] ?? 'solo'

        await supabase
          .from('user_profiles')
          .update({
            subscription_status:    'active',
            subscription_plan:      plan,
            stripe_customer_id:     customerId,
            stripe_subscription_id: subscriptionId,
            trial_ends_at:          null,
          })
          .eq('email', customerEmail)

        console.log('[stripe-webhook] Activated:', customerEmail, plan)
        break
      }

      // ── Subscription renewed ──────────────────────────────────────
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        if (invoice.billing_reason !== 'subscription_cycle') break

        const customerId = invoice.customer as string

        await supabase
          .from('user_profiles')
          .update({ subscription_status: 'active' })
          .eq('stripe_customer_id', customerId)

        console.log('[stripe-webhook] Renewed for customer:', customerId)
        break
      }

      // ── Payment failed ────────────────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        await supabase
          .from('user_profiles')
          .update({ subscription_status: 'past_due' })
          .eq('stripe_customer_id', customerId)

        console.log('[stripe-webhook] Payment failed for customer:', customerId)
        break
      }

      // ── Subscription cancelled ────────────────────────────────────
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId   = subscription.customer as string

        await supabase
          .from('user_profiles')
          .update({
            subscription_status:    'cancelled',
            stripe_subscription_id: null,
          })
          .eq('stripe_customer_id', customerId)

        console.log('[stripe-webhook] Cancelled for customer:', customerId)
        break
      }

      // ── Subscription paused / updated ─────────────────────────────
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId   = subscription.customer as string
        const status       = subscription.status

        const statusMap: Record<string, string> = {
          active:   'active',
          past_due: 'past_due',
          paused:   'paused',
          canceled: 'cancelled',
        }

        const newStatus = statusMap[status]
        if (newStatus) {
          await supabase
            .from('user_profiles')
            .update({ subscription_status: newStatus })
            .eq('stripe_customer_id', customerId)

          console.log('[stripe-webhook] Updated status:', customerId, newStatus)
        }
        break
      }

      default:
        console.log('[stripe-webhook] Unhandled event type:', event.type)
    }
  } catch (err) {
    console.error('[stripe-webhook] Handler error for event', event.type, ':', err)
    // Return 200 anyway — Stripe will retry on 4xx/5xx, causing duplicate processing
    return NextResponse.json({ received: true, error: 'Handler failed' })
  }

  return NextResponse.json({ received: true })
}
