'use client'

import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Scale, Mail, Lock, ArrowRight, Eye, EyeOff, AlertCircle } from 'lucide-react'

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const callbackUrl = params.get('callbackUrl') ?? '/dashboard'
  const isDemoMode  = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

  const [email,    setEmail]    = useState(isDemoMode ? 'demo@immigai.com' : '')
  const [password, setPassword] = useState(isDemoMode ? 'demo1234' : '')
  const [showPass, setShowPass] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await signIn('credentials', { email, password, redirect: false, callbackUrl })
    setLoading(false)
    if (result?.error) {
      setError('Invalid email or password. Please try again.')
    } else {
      router.push(callbackUrl)
      router.refresh()
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--bg)', fontFamily: 'var(--font-body)' }}
    >
      {/* Background blob */}
      <div
        className="fixed pointer-events-none"
        style={{
          width: '600px', height: '600px',
          background: 'radial-gradient(circle, rgba(10,145,97,0.08) 0%, transparent 65%)',
          top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          borderRadius: '50%', filter: 'blur(60px)',
        }}
      />

      <div className="w-full max-w-[400px] relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-2.5 mb-6">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--brand)', boxShadow: 'var(--shadow-brand)' }}
            >
              <Scale className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl" style={{ color: 'var(--text-1)', letterSpacing: '-0.04em' }}>
              ImmigAI
            </span>
          </Link>
          <h1 className="font-display font-bold text-2xl text-center" style={{ color: 'var(--text-1)', letterSpacing: '-0.04em' }}>
            Welcome back
          </h1>
          <p className="text-sm mt-1 text-center" style={{ color: 'var(--text-3)' }}>
            Sign in to your account to continue
          </p>
        </div>

        {/* Card */}
        <div className="card p-7" style={{ boxShadow: 'var(--shadow-lg)' }}>

          {/* Demo banner */}
          {isDemoMode && (
            <div
              className="flex items-start gap-2.5 p-3.5 rounded-xl mb-6"
              style={{ background: 'var(--brand-dim)', border: '1px solid var(--brand-glow)' }}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--brand)' }} />
              <div>
                <p className="text-xs font-bold mb-0.5" style={{ color: 'var(--brand)' }}>Demo credentials pre-filled</p>
                <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                  email: demo@immigai.com &nbsp;·&nbsp; password: demo1234
                </p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              className="flex items-center gap-2.5 p-3.5 rounded-xl mb-5"
              style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)' }}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--danger)' }} />
              <p className="text-sm font-medium" style={{ color: 'var(--danger)' }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--text-2)' }}>
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--text-4)' }} />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="input pl-10"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--text-2)' }}>
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--text-4)' }} />
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="Your password"
                  className="input pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-4)' }}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 text-sm mt-2"
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : (
                <>Sign In <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'var(--text-4)' }}>
          © {new Date().getFullYear()} ImmigAI, Inc. · All rights reserved.
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>
}
