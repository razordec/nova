'use client'
import { useCart } from '@/hooks/use-cart'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { loadStripe } from '@stripe/stripe-js'
import { useState } from 'react'
import { formatPrice } from '@/lib/pricing'
import { useRouter } from 'next/navigation'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export default function CheckoutPage() {
  const { items, subtotal, clear } = useCart()
  const [processing, setProcessing] = useState(false)
  const router = useRouter()

  const handleCheckout = async () => {
    setProcessing(true)
    const stripe = await stripePromise!

    // Create a checkout session server-side
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, currency: items[0]?.product.currency ?? 'USD' }),
    })

    const { sessionId } = await res.json()
    const { error } = await stripe.redirectToCheckout({ sessionId })

    if (error) {
      console.error(error)
      setProcessing(false)
    }
  }

  if (items.length === 0) {
    router.push('/')
    return null
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Checkout</h1>

      <form className="space-y-4 rounded-lg border p-6">
        <h2 className="text-lg font-semibold">Shipping Information</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input placeholder="First name" required />
          <Input placeholder="Last name" required />
          <Input placeholder="Email" type="email" required className="sm:col-span-2" />
          <Input placeholder="Address line 1" required className="sm:col-span-2" />
          <Input placeholder="Address line 2" className="sm:col-span-2" />
          <Input placeholder="City" required />
          <Input placeholder="State / Region" />
          <Input placeholder="Postal code" required />
          <Input placeholder="Country (US)" required />
        </div>

        <div className="rounded-lg bg-muted p-4">
          <h2 className="text-lg font-semibold">Order Summary</h2>
          {items.map((item) => (
            <div key={item.productId} className="mt-2 flex justify-between text-sm">
              <span>
                {item.product.title} × {item.qty}
              </span>
              <span>{formatPrice(item.unitPrice * item.qty, item.product.currency)}</span>
            </div>
          ))}
          <div className="mt-2 border-t pt-2 flex justify-between font-bold">
            <span>Total</span>
            <span>{formatPrice(subtotal, items[0]?.product.currency)}</span>
          </div>
        </div>

        <Button
          type="button"
          onClick={handleCheckout}
          disabled={processing}
          className="w-full"
          size="lg"
        >
          {processing ? 'Processing...' : 'Pay with Stripe'}
        </Button>
      </form>
    </div>
  )
}