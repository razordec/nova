'use client'
import { useCart } from '@/hooks/use-cart'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { formatPrice } from '@/lib/pricing'
import Link from 'next/link'

export default function CartPage() {
  const { items, updateQty, removeItem, subtotal } = useCart()

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <h2 className="text-2xl font-bold">Your cart is empty</h2>
        <p className="mt-2 text-muted-foreground">Browse products and add items to get started.</p>
        <Button asChild className="mt-6">
          <Link href="/products">Continue Shopping</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Shopping Cart</h1>
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          {items.map((item) => (
            <div key={`${item.productId}-${item.variantId}`} className="flex gap-4 rounded-lg border p-4">
              <Image
                src={item.product.images[0]?.url ?? '/placeholder.png'}
                alt={item.product.title}
                width={80}
                height={80}
                className="h-20 w-20 rounded-md object-cover"
              />
              <div className="flex-1">
                <h3 className="font-medium">{item.product.title}</h3>
                {item.variantId && (
                  <p className="text-sm text-muted-foreground">
                    {Object.values(item.product.variants.find(v => v.id === item.variantId)?.options ?? {}).join(' / ')}
                  </p>
                )}
                <p className="mt-1 font-medium">{formatPrice(item.unitPrice, item.product.currency)}</p>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={item.qty}
                    onChange={(e) => updateQty(item.productId, item.variantId, Number(e.target.value))}
                    className="h-8 w-16 rounded border text-center text-sm"
                  />
                  <Button variant="ghost" size="sm" onClick={() => removeItem(item.productId, item.variantId)}>
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="rounded-lg border p-6 h-fit sticky top-4">
          <h2 className="text-lg font-bold">Order Summary</h2>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal, items[0]?.product.currency)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Shipping</span>
              <span>Calculated at checkout</span>
            </div>
            <div className="border-t pt-2 text-base font-bold flex justify-between">
              <span>Total</span>
              <span>{formatPrice(subtotal, items[0]?.product.currency)}</span>
            </div>
          </div>
          <Button asChild className="mt-6 w-full">
            <Link href="/checkout">Proceed to Checkout</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}