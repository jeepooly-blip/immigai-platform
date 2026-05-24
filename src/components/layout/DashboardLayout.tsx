'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { useState } from 'react'
import {
  LayoutDashboard, FolderOpen, FileText, BarChart3, Shield,
  Users, Settings, LogOut, FileCheck, MessageSquare, Menu, X,
  Sun, Moon, Plus, Scale, Bell, Mic, ShieldAlert
} from 'lucide-react'

type NavItem = { label: string; href: string; icon: any; roles?: string[]; adminOnly?: boolean }

const NAV: NavItem[] = [
  { label: 'Dashboard',      href: '/dashboard',      icon: LayoutDashboard },
  { label: 'Cases',          href: '/cases',          icon: FolderOpen      },
  { label: 'Forms',          href: '/forms',          icon: FileCheck       },
  { label: 'Assistant',      href: '/assistant',      icon: MessageSquare   },
  { label: 'Documents',      href: '/documents',      icon: FileText        },
  { label: 'Interview Prep', href: '/interview-prep', icon: Mic             },
  { label: 'Analytics',      href: '/analytics',      icon: BarChart3       },
  { label: 'Compliance',     href: '/compliance',     icon: Shield          },
  { label: 'Alerts',         href: '/alerts',         icon: Bell            },
  { label: 'Clients',        href: '/clients',        icon: Users,          roles: ['attorney', 'admin', 'partner'] },
]

const ADMIN_NAV: NavItem[] = [
  { label: 'Admin Panel', href: '/admin', icon: ShieldAlert, adminOnly: true },
]

function NavLink({ item, onClick }: { item: NavItem; onClick?: () => void }) {
  const pathname = usePathname()
  const active   = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
  const Icon     = item.icon
  return (
    <Link href={item.href} onClick={onClick}
      style={active ? { background: 'var(--brand-dim)', color: 'var(--brand)', border: '1px solid var(--brand-glow)', borderRadius: '10px' }
                     : { borderRadius: '10px', border: '1px solid transparent' }}
      className={`flex items-center gap-3 px-3 py-2.5 text-sm font-semibold transition-all duration-150
        ${active ? '' : 'text-[var(--text-3)] hover:text-[var(--text-1)] hover:bg-[var(--bg-subtle)]'}`}>
      <Icon className="w-4 h-4 flex-shrink-0 transition-colors" style={{ color: active ? 'var(--brand)' : undefined }} />
      {item.label}
    </Link>
  )
}

function Sidebar({ onNavClick }: { onNavClick?: () => void }) {
  const { data: session } = useSession()
  const [dark, setDark]   = useState(false)
  const name     = session?.user?.name ?? 'User'
  const email    = session?.user?.email ?? ''
  const role     = (session?.user as any)?.role ?? 'attorney'
  const isAdmin  = (session?.user as any)?.isAdmin ?? false
  const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
  const subStatus = (session?.user as any)?.subscriptionStatus ?? 'inactive'
  const isPro    = ['active', 'trialing'].includes(subStatus)

  const visibleNav = NAV.filter(item => !item.roles || item.roles.includes(role))

  function toggleDark() {
    setDark(d => !d)
    document.documentElement.classList.toggle('dark')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="h-14 flex items-center px-5" style={{ borderBottom: '1px solid var(--border)' }}>
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--brand)' }}>
            <Scale className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-display font-bold text-base" style={{ color: 'var(--text-1)' }}>ImmigAI</span>
        </Link>
        <button onClick={toggleDark} className="ml-auto p-1.5 rounded-lg hover:bg-[var(--bg-subtle)] transition-colors">
          {dark ? <Sun className="w-3.5 h-3.5 text-[var(--text-3)]" /> : <Moon className="w-3.5 h-3.5 text-[var(--text-3)]" />}
        </button>
      </div>

      {/* New Case CTA */}
      <div className="px-3 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <Link href="/case/create" onClick={onNavClick}
          className="btn-primary w-full justify-center text-xs py-2 flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" /> New Case
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {visibleNav.map(item => <NavLink key={item.href} item={item} onClick={onNavClick} />)}

        {/* Admin section */}
        {isAdmin && (
          <div className="pt-3 mt-3 space-y-0.5" style={{ borderTop: '1px solid var(--border)' }}>
            {ADMIN_NAV.map(item => <NavLink key={item.href} item={item} onClick={onNavClick} />)}
          </div>
        )}

        <div className="pt-3 mt-3 space-y-0.5" style={{ borderTop: '1px solid var(--border)' }}>
          <NavLink item={{ label: 'Settings', href: '/settings', icon: Settings }} onClick={onNavClick} />
        </div>
      </nav>

      {/* Subscription badge */}
      {!isPro && (
        <div className="px-3 pb-2">
          <Link href="/settings#billing"
            className="block w-full text-center text-xs py-2 rounded-lg bg-gradient-to-r from-brand-500 to-violet-500 text-white font-medium hover:opacity-90 transition-opacity">
            Upgrade to Pro ✦
          </Link>
        </div>
      )}

      {/* User footer */}
      <div className="p-3" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ background: 'var(--brand)' }}>{initials}</div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold truncate" style={{ color: 'var(--text-1)' }}>{name}</div>
            <div className="text-[10px] truncate" style={{ color: 'var(--text-3)' }}>{email}</div>
          </div>
        </div>
        <button onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-[var(--text-3)] hover:text-[var(--text-1)] hover:bg-[var(--bg-subtle)]">
          <LogOut className="w-3.5 h-3.5" /> Sign out
        </button>
      </div>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-page)' }}>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 xl:w-60 flex-shrink-0 h-screen overflow-y-auto"
        style={{ borderRight: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
        <Sidebar />
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="relative z-50 flex flex-col w-64 h-full shadow-xl"
            style={{ background: 'var(--bg-surface)', borderRight: '1px solid var(--border)' }}>
            <Sidebar onNavClick={() => setOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center h-12 px-4 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
          <button onClick={() => setOpen(true)} className="p-1.5 rounded-lg hover:bg-[var(--bg-subtle)] transition-colors">
            <Menu className="w-5 h-5 text-[var(--text-2)]" />
          </button>
          <span className="ml-3 font-display font-bold text-sm" style={{ color: 'var(--text-1)' }}>ImmigAI</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
