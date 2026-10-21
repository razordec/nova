import { useCartStore } from '@/stores/cart-store'
import type { Product } from '@/types/domain'
import type { ProductVariant } from '@/types/domain'

export function useCart() {
  const addItem = useCartStore((s) => s.addItem)
  const removeItem = useCartStore((s) => s.removeItem)
  const updateQty = useCartStore((s) => s.updateQty)
  const clear = useCartStore((s) => s.clear)
  const subtotal = useCartStore((s) => s.subtotal)
  const items = useCartStore((s) => s.items)

  const addToCart = (
    product: Product,
    variant: ProductVariant | null = null,
    qty = 1
  ) => {
    addItem({
      productId: product.id,
      variantId: variant?.id ?? null,
      qty,
      unitPrice: variant?.price ?? product.basePrice,
      product,
    })
  }

  return { items, subtotal, addToCart, removeItem, updateQty, clear }
}