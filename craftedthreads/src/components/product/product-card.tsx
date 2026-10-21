'use client'
import { Product } from '@/types/domain'
import Image from 'next/image'
import Link from 'next/link'
import { formatPrice } from '@/lib/pricing'
import { Button } from '@/components/ui/button'
import { useCart } from '@/hooks/use-cart'
import { AnimatePresence, motion } from 'framer-motion'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group relative overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-lg"
    >
      <Link href={`/products/${product.slug}`}>
        <div className="relative aspect-square overflow-hidden">
          {product.images.length > 0 ? (
            <Image
              src={product.images[0].url}
              alt={product.images[0].alt || product.title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-muted text-muted-foreground">
              No image
            </div>
          )}
          {product.model3dUrl && (
            <span className="absolute right-2 top-2 rounded bg-black/60 px-2 py-1 text-xs text-white">
              3D
            </span>
          )}
        </div>
      </Link>

      <div className="p-4">
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-medium line-clamp-2">{product.title}</h3>
        </Link>
        <p className="mt-1 text-sm text-muted-foreground">{product.vendor?.name}</p>

        <div className="mt-2 flex items-center justify-between">
          <span className="font-bold">
            {formatPrice(product.basePrice, product.currency)}
          </span>
          <AnimatePresence>
            {product.stockQty > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addToCart(product)}
                >
                  Add to Cart
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}