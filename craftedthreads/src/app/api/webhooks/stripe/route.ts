import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-01-27.acacia' })
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch {
    return NextResponse.json({ error: 'Webhook signature mismatch' }, { status: 400 })
  }

  const supabase = createAdminClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id)

      // Parse product IDs from metadata
      const productIds = (session.metadata?.cartIds ?? '').split(',').filter(Boolean)

      // Create order rows in Supabase
      for (const productId of productIds) {
        const { data: product } = await supabase
          .from('products')
          .select('vendor_id, base_price')
          .eq('id', productId)
          .single()

        if (!product) continue

        const lineItem = lineItems.data.find(
          (li) => li.description?.includes(product.title)
        )

        if (!lineItem) continue

        // Create order + order_items
        await supabase.from('orders').insert({
          user_id: session.customer_id as string,
          vendor_id: product.vendor_id,
          status: 'paid',
          payment_status: 'paid',
          currency: session.currency?.toUpperCase() ?? 'USD',
          subtotal: lineItem.amount_total ?? 0,
          total: session.amount_total ?? 0,
          shipping_address: null, // TODO: extract from session.shipping details
          stripe_payment_intent_id: session.payment_intent as string,
          stripe_transfer_group: `order_${session.id}`,
        })
      }

      // Notify user
      await supabase.from('notifications').insert({
        user_id: session.customer_id as string,
        channel: 'in_app',
        type: 'order_placed',
        title: 'Order Confirmed',
        body: 'Your order has been placed successfully.',
        data: { sessionId: session.id },
      })
      break
    }

    case 'payment_intent.succeeded': {
      const pi = event.data.object as Stripe.PaymentIntent
      // Update loyalty points (Phase 2: reward 1 point per $1)
      const pointsEarned = Math.floor((pi.amount ?? 0) / 100)
      if (pointsEarned > 0 && pi.customer) {
        await supabase.from('loyalty_ledger').insert({
          user_id: pi.customer as string,
          delta: pointsEarned,
          reason: 'purchase',
          ref_id: pi.id,
        })
      }
      break
    }

    case 'transfer.paid': {
      // Vendor payout completed
      const transfer = event.data.object as Stripe.Transfer
      console.log(`Vendor payout transferred: ${transfer.id}`)
      break
    }

    default:
      console.log(`Unhandled event type: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}