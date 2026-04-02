import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient as createServerClient } from '@/lib/supabase/server'

// Price IDs — set these in .env.local after creating products in Stripe dashboard
// STRIPE_PRICE_SOLO_MONTHLY, STRIPE_PRICE_SOLO_YEARLY
// STRIPE_PRICE_TEAM_MONTHLY, STRIPE_PRICE_TEAM_YEARLY
const PRICE_MAP: Record<string, string | undefined> = {
  'solo-monthly': process.env.STRIPE_PRICE_SOLO_MONTHLY,
  'solo-yearly':  process.env.STRIPE_PRICE_SOLO_YEARLY,
  'team-monthly': process.env.STRIPE_PRICE_TEAM_MONTHLY,
  'team-yearly':  process.env.STRIPE_PRICE_TEAM_YEARLY,
}

export async function POST(req: Request) {
  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { plan, billing } = await req.json()
  const priceKey = `${plan}-${billing}`
  const priceId  = PRICE_MAP[priceKey]

  if (!priceId) {
    return NextResponse.json({ error: `No price configured for ${priceKey}` }, { status: 400 })
  }

  const stripe   = new Stripe(stripeKey)
  const appUrl   = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/onboarding?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${appUrl}/login`,
    metadata: {
      user_id: user.id,
      plan,
      billing,
    },
    customer_email: user.email,
    subscription_data: {
      metadata: { user_id: user.id, plan },
    },
  })

  return NextResponse.json({ url: session.url })
}
