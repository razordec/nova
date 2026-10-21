import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-01-27.acacia' })

export async function POST(req: Request) {
  const { items, currency } = await req.json()

  if (!items?.length) {
    return NextResponse.json({ error: 'Empty cart' }, { status: 400 })
  }

  // Build Stripe line items from cart
  const lineItems = items.map((item: any) => ({
    price_data: {
      currency: currency?.toLowerCase() ?? 'usd',
      product_data: {
        name: item.product.title,
        images: item.product.images.map((img: any) => img.url),
      },
      unit_amount: item.unitPrice,
    },
    quantity: item.qty,
  }))

  // Create Stripe session
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: lineItems,
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/cart`,
    metadata: {
      cartIds: items.map((i: any) => i.productId).join(','),
    },
  })

  return NextResponse.json({ sessionId: session.id })
}