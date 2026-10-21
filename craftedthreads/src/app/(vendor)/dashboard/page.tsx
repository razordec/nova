import { createClient } from '@/lib/supabase/server'

export default async function VendorDashboard() {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <div>Not authenticated</div>

  // Get vendor profile
  const { data: vendor } = await supabase
    .from('vendors')
    .select('*')
    .eq('owner_id', user.id)
    .single()

  if (!vendor) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <h2 className="text-2xl font-bold">Become a Vendor</h2>
        <p className="mt-2 text-muted-foreground">
          Apply to start selling on CraftedThreads.
        </p>
      </div>
    )
  }

  // Get vendor's products
  const { data: products } = await supabase
    .from('products')
    .select('id, title, status, base_price, stock_qty, rating_avg, rating_count, view_count')
    .eq('vendor_id', vendor.id)
    .order('created_at', { ascending: false })

  // Get recent orders
  const { data: orders } = await supabase
    .from('orders')
    .select('id, status, total, placed_at, tracking_number')
    .eq('vendor_id', vendor.id)
    .order('placed_at', { ascending: false })
    .limit(10)

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{vendor.name}</h1>
          <p className="text-muted-foreground">
            Rating: {vendor.rating_avg.toFixed(1)} ({vendor.ratingCount} reviews)
            {vendor.isVerified && <span className="ml-2 text-green-600">✓ Verified</span>}
          </p>
        </div>
        <a
          href={`https://dashboard.stripe.com/${vendor.stripe_account_id ? 'accounts/' + vendor.stripe_account_id : ''}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary underline"
        >
          Stripe Dashboard
        </a>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Products" value={products?.length ?? 0} />
        <StatCard label="Active Orders" value={orders?.filter(o => o.status === 'paid').length ?? 0} />
        <StatCard label="Total Views" value={products?.reduce((sum, p) => sum + (p.view_count ?? 0), 0) ?? 0} />
        <StatCard label="Avg Rating" value={vendor.rating_avg.toFixed(1)} />
      </div>

      {/* Products Table */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-bold">Products</h2>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left">Title</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-right">Stock</th>
                <th className="px-4 py-3 text-center">Rating</th>
                <th className="px-4 py-3 text-center">Views</th>
              </tr>
            </thead>
            <tbody>
              {products?.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="px-4 py-3">{p.title}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs ${
                      p.status === 'active' ? 'bg-green-100 text-green-800' :
                      p.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">${(p.base_price / 100).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">{p.stock_qty}</td>
                  <td className="px-4 py-3 text-center">
                    {p.rating_count > 0 ? `${p.rating_avg.toFixed(1)} (${p.rating_count})` : 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-center">{p.view_count}</td>
                </tr>
              ))}
              {products?.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No products yet. <a href="#" className="text-primary underline">Add your first product</a>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Orders Table */}
      <div>
        <h2 className="mb-4 text-xl font-bold">Recent Orders</h2>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left">Order ID</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-left">Placed</th>
                <th className="px-4 py-3 text-left">Tracking</th>
              </tr>
            </thead>
            <tbody>
              {orders?.map((o) => (
                <tr key={o.id} className="border-t">
                  <td className="px-4 py-3 font-mono text-xs">{o.id.slice(0, 8)}...</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs ${
                      o.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                      o.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">${(o.total / 100).toFixed(2)}</td>
                  <td className="px-4 py-3">{new Date(o.placed_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{o.tracking_number || '—'}</td>
                </tr>
              ))}
              {orders?.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No orders yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  )
}