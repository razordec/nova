'use client'
import { useCart } from '@/hooks/use-cart'

export function CartProvider({ children }: { children: React.ReactNode }) {
  const _cart = useCart() // hydrates Zustand store from localStorage
  return <>{children}</>
}