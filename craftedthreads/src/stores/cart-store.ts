import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { CartItem, MinorUnits } from '@/types/domain'

interface CartState {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'id'>) => void
  removeItem: (productId: string, variantId: string | null) => void
  updateQty: (productId: string, variantId: string | null, qty: number) => void
  clear: () => void
  subtotal: MinorUnits
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          const idx = state.items.findIndex(
            (i) => i.productId === item.productId && i.variantId === item.variantId
          )
          if (idx >= 0) {
            const updated = [...state.items]
            updated[idx] = { ...updated[idx], qty: updated[idx].qty + item.qty }
            return { items: updated }
          }
          return { items: [...state.items, item] }
        }),
      removeItem: (productId, variantId) =>
        set((s) => ({
          items: s.items.filter(
            (i) => !(i.productId === productId && i.variantId === variantId)
          ),
        })),
      updateQty: (productId, variantId, qty) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.productId === productId && i.variantId === variantId
              ? { ...i, qty: Math.max(1, qty) }
              : i
          ),
        })),
      clear: () => set({ items: [] }),
      get subtotal() {
        return get().items.reduce(
          (sum, i) => sum + i.unitPrice * i.qty,
          0
        ) as MinorUnits
      },
    }),
    { name: 'craftedthreads-cart', storage: createJSONStorage(() => localStorage) }
  )
)