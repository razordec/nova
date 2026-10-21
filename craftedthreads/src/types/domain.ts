import type { Database } from './database.types'

/* ---------- Primitives ---------- */
/** Money is ALWAYS integer minor units (cents). Never float. */
export type MinorUnits = number & { readonly __brand: 'MinorUnits' }

export type ISODate = string
export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD' | 'PGK'

export type ProductStatus = 'draft' | 'active' | 'archived'
export type OrderStatus =
  | 'pending' | 'paid' | 'fulfilled' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded' | 'disputed'
export type UserRole = 'customer' | 'vendor' | 'admin'

/* ---------- Entities ---------- */
export interface Profile {
  id: string
  email: string
  fullName: string | null
  avatarUrl: string | null
  role: UserRole
  locale: string
  theme: 'light' | 'dark' | 'system'
  createdAt: ISODate
}

export interface Vendor {
  id: string
  ownerId: string
  name: string
  slug: string
  description: string | null
  logoUrl: string | null
  bannerUrl: string | null
  payoutsEnabled: boolean
  isVerified: boolean
  ratingAvg: number
  ratingCount: number
}

export interface ProductImage { url: string; alt: string }

export interface ProductVariant {
  id: string
  sku: string | null
  title: string
  options: Record<string, string>   // { color: 'black', size: 'XL' }
  price: MinorUnits
  stockQty: number
  imageUrl: string | null
  isActive: boolean
}

export interface Product {
  id: string
  vendorId: string
  categoryId: number | null
  title: string
  slug: string
  description: string | null
  status: ProductStatus
  basePrice: MinorUnits
  compareAtPrice: MinorUnits | null
  currency: CurrencyCode
  sku: string | null
  stockQty: number
  lowStockThreshold: number
  weightGrams: number | null
  tags: string[]
  images: ProductImage[]
  model3dUrl: string | null
  arModelUrl: string | null
  ratingAvg: number
  ratingCount: number
  viewCount: number
  variants: ProductVariant[]
  vendor?: Vendor       // optional join
  category?: { id: number; name: string; slug: string }
  createdAt: ISODate
  updatedAt: ISODate
}

export interface CartItem {
  id: string
  productId: string
  variantId: string | null
  qty: number
  unitPrice: MinorUnits
  product: Product      // eager-loaded
}

export interface Cart {
  id: string
  userId: string | null
  sessionId: string | null
  currency: CurrencyCode
  items: CartItem[]
  subtotal: MinorUnits
  updatedAt: ISODate
}

export interface Address {
  id: string
  userId: string
  label: string | null
  line1: string
  line2: string | null
  city: string
  region: string | null
  postal: string
  country: string
  phone: string | null
  isDefault: boolean
}

export interface OrderItem {
  id: string
  orderId: string
  productId: string
  variantId: string | null
  titleSnap: string
  imageSnap: string | null
  unitPrice: MinorUnits
  qty: number
}

export interface Order {
  id: string
  number: number
  userId: string
  vendorId: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  currency: CurrencyCode
  subtotal: MinorUnits
  shippingTotal: MinorUnits
  taxTotal: MinorUnits
  discountTotal: MinorUnits
  total: MinorUnits
  platformFee: MinorUnits
  shippingAddress: Address | null
  trackingNumber: string | null
  carrier: string | null
  placedAt: ISODate
  updatedAt: ISODate
  items: OrderItem[]
  vendor?: Vendor
}

export interface Review {
  id: string
  productId: string
  userId: string
  rating: number
  title: string | null
  body: string | null
  isVerifiedPurchase: boolean
  createdAt: ISODate
}

export interface WishlistItem {
  productId: string
  addedAt: ISODate
  product: Product
}

export interface Wishlist {
  id: string
  userId: string
  name: string
  isPublic: boolean
  items: WishlistItem[]
}

export interface Notification {
  id: string
  userId: string
  channel: 'in_app' | 'email' | 'push'
  type: string
  title: string
  body: string | null
  data: Record<string, unknown>
  readAt: ISODate | null
  createdAt: ISODate
}