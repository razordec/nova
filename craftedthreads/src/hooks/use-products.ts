import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Product } from '@/types/domain'

export function useProducts(params?: Record<string, string>) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    let query = supabase
      .from('products')
      .select(`
        *,
        variants (id, sku, title, options, price, stock_qty, image_url, is_active),
        vendors (id, name, slug, logo_url, rating_avg, rating_count, is_verified)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (params?.category) query = query.eq('category_id', params.category)
    if (params?.search) {
      query = query.textSearch('search_vector', params.search, { type: 'websearch' })
    }
    if (params?.minPrice) query = query.gte('base_price', Number(params.minPrice))
    if (params?.maxPrice) query = query.lte('base_price', Number(params.maxPrice))
    if (params?.vendor) query = eq('vendor.slug', params.vendor) // needs join support

    query
      .then(({ data, error }) => {
        if (error) return setError(error.message)
        // Attach variants + vendor to each product
        if (data) {
          const mapped = data.map((p: any) => ({
            ...p,
            variants: p.variants || [],
            vendor: p.vendors || null,
          })) as Product[]
          setProducts(mapped)
        }
      })
      .finally(() => setLoading(false))
  }, [params])

  return { products, loading, error }
}