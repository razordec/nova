import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/product/product-card'

export default async function HomePage() {
  const supabase = await createClient()

  const { data: featuredProducts } = await supabase
    .from('products')
    .select(`
      *,
      vendors (id, name, slug, logo_url)
    `)
    .eq('status', 'active')
    .order('view_count', { ascending: false })
    .limit(8)

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      {/* Hero */}
      <section className="mb-12 rounded-2xl bg-gradient-to-r from-primary to-primary/80 p-8 text-primary-foreground">
        <h1 className="text-4xl font-bold">Shop Smarter with AI</h1>
        <p className="mt-2 text-lg opacity-90">
          Personalized recommendations, 3D previews, and real-time price tracking.
        </p>
      </section>

      {/* Featured Products */}
      <section>
        <h2 className="mb-6 text-2xl font-bold">Featured Products</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featuredProducts?.map((product: any) => (
            <ProductCard
              key={product.id}
              product={{
                ...product,
                variants: [],
                vendor: product.vendors || undefined,
              }}
            />
          ))}
        </div>
      </section>
    </main>
  )
}