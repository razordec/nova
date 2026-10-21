'use client'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const signIn = async (provider: 'google' | 'apple' | 'microsoft') => {
    setLoading(true)
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    })
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-6 rounded-xl border p-8">
        <h1 className="text-2xl font-bold">Sign in to ShopVerse</h1>
        <div className="flex flex-col gap-3">
          <Button onClick={() => signIn('google')} variant="outline">
            Continue with Google
          </Button>
          <Button onClick={() => signIn('apple')} variant="outline">
            Continue with Apple
          </Button>
          <Button onClick={() => signIn('microsoft')} variant="outline">
            Continue with Microsoft
          </Button>
        </div>
        {loading && <p className="text-center text-sm text-muted-foreground">Redirecting...</p>}
      </div>
    </div>
  )
}