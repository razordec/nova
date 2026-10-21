import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/product/product-card'
import { Gallery3D } from '@/components/product/gallery-3d'
import { ARViewer } from '@/components/product/ar-viewer'
import type { Product } from '@/types/domain'
import Image from 'next/image'

export async function generateStaticParams() {
  // Prerender popular products; dynamic fallback for others via `dynamic = 'force-dynamic'`
  return []
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: productRaw, error } = await supabase
    .from('products')
    .select(`
      *,
      variants (id, sku, title, options, price, stock_qty, image_url, is_active),
      vendors (id, name, slug, logo_url, rating_avg, rating_count, is_verified),
      reviews (id, rating, title, body, is_verified_purchase, created_at, user_id)
    `)
    .eq('slug', slug)
    .eq('status', 'active')
    .single()

  if (error || !productRaw) notFound()

  const product: Product = {
    ...productRaw,
    variants: productRaw.variants || [],
    vendor: productRaw.vendors || undefined,
    ratingAvg: productRaw.rating_avg,
    ratingCount: productRaw.rating_count,
  }

  return (
    <article className="mx-auto max-w-7xl px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Visual */}
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
            {product.images.length > 0 ? (
              <Image
                src={product.images[0].url}
                alt={product.images[0].alt || product.title}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                No image
              </div>
            )}
          </div>
          {product.model3dUrl && <Gallery3D modelUrl={product.model3dUrl} />}
          {product.arModelUrl && <ARViewer modelUrl={product.arModelUrl} />}
        </div>

        {/* Details */}
        <div className="space-y-6">
          <div>
            <p className="text-sm text-muted-foreground">{product.vendor?.name}</p>
            <h1 className="text-3xl font-bold">{product.title}</h1>
            {product.ratingCount > 0 && (
              <div className="mt-1 flex items-center gap-1 text-sm">
                <span className="text-yellow-500">{'★'.repeat(Math.round(product.ratingAvg))}</span>
                <span className="text-muted-foreground">
                  {product.ratingAvg.toFixed(1)} ({product.ratingCount})
                </span>
              </div>
            )}
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: product.currency }).format(
                product.basePrice / 100
              )}
            </span>
            {product.compareAtPrice && (
              <span className="text-lg text-muted-foreground line-through">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: product.currency }).format(
                  product.compareAtPrice / 100
                )}
              </span>
            )}
          </div>

          {product.description && (
            <p className="text-muted-foreground">{product.description}</p>
          )}

          {product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-muted px-3 py-1 text-xs">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {product.stockQty <= product.lowStockThreshold && product.stockQty > 0 && (
            <p className="text-sm text-amber-600 font-medium">
              ⚠️ Only {product.stockQty} left in stock
            </p>
          )}
          {product.stockQty === 0 && (
            <p className="text-sm text-destructive font-medium">Out of stock</p>
          )}
        </div>
      </div>
    </article>
  )
}