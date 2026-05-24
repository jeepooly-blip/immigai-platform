'use client'
import Link from 'next/link'
import { useState } from 'react'
import {
  ArrowRight, Brain, FileText, BarChart3, Shield, Users,
  CheckCircle2, Zap, Clock, Star, Scale, Workflow,
  ChevronRight, Play, Menu, X, Globe, Bell, Lock,
  Building2, TrendingUp, MessageSquare,
} from 'lucide-react'

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Platform', href: '#platform' },
  { label: 'Pricing',  href: '#pricing'  },
]

const STATS = [
  { value: '94%', label: 'Approval Rate',    sub: 'vs 78% industry avg' },
  { value: '10×', label: 'Faster Filing',    sub: 'than manual process'  },
  { value: '60%', label: 'Cost Reduction',   sub: 'in admin overhead'    },
  { value: '50+', label: 'Visa Types',       sub: 'fully supported'      },
]

const FEATURES = [
  {
    icon: FileText, color: '#2563EB',
    title: 'Document & Form Automation',
    desc: 'Auto-populate complex visa applications and draft RFE responses in minutes. AI verification catches errors before filing.',
    tags: ['Auto-populate', 'RFE Drafting', 'AI Verification'],
  },
  {
    icon: BarChart3, color: '#7C3AED',
    title: 'Predictive Analytics',
    desc: 'Forecast visa approval probabilities and processing times using real USCIS data. Make evidence-based strategic decisions.',
    tags: ['Approval Forecast', 'Timeline Predictions', 'Strategy Insights'],
  },
  {
    icon: Users, color: '#0a9161',
    title: 'Client Management',
    desc: 'Secure client portals for document upload and real-time progress tracking. AI chatbot handles routine queries 24/7.',
    tags: ['Client Portal', 'AI Chatbot', 'Multilingual'],
  },
  {
    icon: Shield, color: '#D97706',
    title: 'Compliance & Risk',
    desc: 'Real-time regulatory change monitoring with NLP-powered analysis. Automated EB-5 checks and deadline management.',
    tags: ['Reg Tracking', 'EB-5 Checks', 'Deadlines'],
  },
  {
    icon: Workflow, color: '#0891B2',
    title: 'Workflow Automation',
    desc: 'End-to-end case lifecycle management from intake to filing. Integrates with Word, Slack, Google Drive and more.',
    tags: ['Case Lifecycle', 'Integrations', 'Collaboration'],
  },
  {
    icon: Globe, color: '#DC2626',
    title: 'Global Business Immigration',
    desc: 'Handle complex corporate visa categories — H-1B, L-1, O-1 — scaled for high-volume corporate mobility teams.',
    tags: ['H-1B/L-1', 'Corporate', 'Global Mobility'],
  },
]

const PRICING = [
  {
    name: 'Starter',    price: '$299', period: '/mo',
    desc: 'For solo practitioners',
    features: ['Up to 50 active cases', 'Form auto-population', 'Client portal (10 clients)', 'Basic analytics', 'Email support'],
    cta: 'Start Free Trial', highlight: false,
  },
  {
    name: 'Professional', price: '$799', period: '/mo',
    desc: 'For growing firms',
    features: ['Up to 300 active cases', 'Full AI automation', 'Unlimited client portals', 'Predictive analytics', 'Compliance monitoring', 'Multilingual (12 languages)', 'Priority support'],
    cta: 'Start Free Trial', highlight: true,
  },
  {
    name: 'Enterprise',  price: 'Custom', period: '',
    desc: 'For large firms & corporates',
    features: ['Unlimited cases', 'Custom AI model training', 'API access', 'Dedicated account manager', 'SLA guarantees', 'On-premise option', 'Custom compliance rules'],
    cta: 'Contact Sales', highlight: false,
  },
]

const TESTIMONIALS = [
  {
    quote: "ImmigAI reduced our RFE response time from 3 weeks to 2 days. The predictive analytics completely changed how we advise clients.",
    name: 'Sarah Chen', role: 'Managing Partner', firm: 'Chen & Associates Immigration',
  },
  {
    quote: "We handle 400+ H-1B cases per year. Before ImmigAI, we needed 8 paralegals. Now 3 can handle the same volume with fewer errors.",
    name: 'Michael Torres', role: 'Head of Immigration', firm: 'Global Tech Corp',
  },
  {
    quote: "The compliance monitoring caught a critical regulatory change that could have derailed 20 pending cases. Worth every penny.",
    name: 'Amanda Patel', role: 'Immigration Attorney', firm: 'Patel Immigration Group',
  },
]

export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text-1)', fontFamily: 'var(--font-body)' }} className="min-h-screen overflow-x-hidden">

      {/* ── Nav ─────────────────────────────────────────────── */}
      <nav
        className="fixed top-0 w-full z-50 backdrop-blur-xl"
        style={{ background: 'var(--bg-overlay)', borderBottom: '1px solid var(--border)' }}
      >
        <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--brand)' }}>
              <Scale className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-lg" style={{ color: 'var(--text-1)', letterSpacing: '-0.03em' }}>
              ImmigAI
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(l => (
              <a key={l.label} href={l.href} className="nav-link">{l.label}</a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="btn-ghost" style={{ color: 'var(--text-2)' }}>Sign In</Link>
            <Link href="/dashboard" className="btn-primary">
              Get Started <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)} style={{ color: 'var(--text-2)' }}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden px-5 pb-5 space-y-2" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-card)' }}>
            {NAV_LINKS.map(l => (
              <a key={l.label} href={l.href} className="block py-2.5 nav-link" onClick={() => setMobileOpen(false)}>{l.label}</a>
            ))}
            <div className="pt-3 flex flex-col gap-2" style={{ borderTop: '1px solid var(--border)' }}>
              <Link href="/login" className="btn-secondary text-center">Sign In</Link>
              <Link href="/dashboard" className="btn-primary justify-center">Get Started</Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="relative pt-36 pb-28 px-5 overflow-hidden grid-texture">
        {/* Blobs */}
        <div className="hero-blob w-[700px] h-[700px]" style={{ background: 'radial-gradient(circle, rgba(10,145,97,0.15) 0%, transparent 65%)', top: '-100px', left: '60%', transform: 'translateX(-30%)' }} />
        <div className="hero-blob w-[500px] h-[500px]" style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.1) 0%, transparent 65%)', top: '50px', left: '-150px' }} />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-8 animate-fade-in"
            style={{ background: 'var(--brand-dim)', border: '1px solid var(--brand-glow)', color: 'var(--brand)' }}
          >
            <Zap className="w-3 h-3" />
            Powered by Claude AI · Now with real-time USCIS data
          </div>

          {/* Headline */}
          <h1
            className="font-display font-bold mb-6 animate-fade-up"
            style={{ fontSize: 'clamp(2.8rem, 7vw, 5.5rem)', letterSpacing: '-0.04em', lineHeight: '1.05', color: 'var(--text-1)' }}
          >
            Immigration Law,{' '}
            <span className="gradient-text">Intelligently<br />Automated.</span>
          </h1>

          <p
            className="text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-10 animate-fade-up delay-100"
            style={{ color: 'var(--text-2)' }}
          >
            The end-to-end platform for immigration law firms and corporate teams.
            AI-driven document automation, predictive analytics, compliance monitoring,
            and client management — all unified.
          </p>

          {/* CTA row */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6 animate-fade-up delay-200">
            <Link href="/dashboard" className="btn-primary py-3 px-7 text-base">
              Start Free 14-Day Trial
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              className="flex items-center gap-3 text-sm font-semibold transition-all hover:gap-4"
              style={{ color: 'var(--text-2)' }}
              onClick={() => window.open('https://www.youtube.com', '_blank')}
            >
              <span
                className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                style={{ background: 'var(--bg-card)', border: '1.5px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
              >
                <Play className="w-3.5 h-3.5 ml-0.5" style={{ color: 'var(--brand)' }} />
              </span>
              Watch Demo
            </button>
          </div>

          <p className="text-xs animate-fade-up delay-300" style={{ color: 'var(--text-4)' }}>
            No credit card required · GDPR & SOC 2 compliant · Cancel anytime
          </p>

          {/* Dashboard mockup */}
          <div className="mt-16 relative animate-fade-up delay-400">
            <div
              className="rounded-2xl overflow-hidden mx-auto max-w-4xl"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-lg), 0 0 80px rgba(10,145,97,0.06)',
              }}
            >
              {/* Browser chrome */}
              <div
                className="flex items-center gap-2 px-4 py-3"
                style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}
              >
                <div className="flex gap-1.5">
                  {['#ef4444','#f59e0b','#22c55e'].map((c,i) => (
                    <div key={i} className="w-3 h-3 rounded-full" style={{ background: c, opacity: 0.7 }} />
                  ))}
                </div>
                <div
                  className="flex-1 h-6 rounded mx-4 flex items-center px-3"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                >
                  <span className="text-[10px]" style={{ color: 'var(--text-4)' }}>app.immigai.com/dashboard</span>
                </div>
              </div>

              {/* Stats row */}
              <div className="p-4 grid grid-cols-4 gap-3">
                {[
                  { label: 'Active Cases',     value: '248', color: '#0a9161', bg: 'rgba(10,145,97,0.08)'  },
                  { label: 'Pending Review',   value: '14',  color: '#D97706', bg: 'rgba(217,119,6,0.08)'  },
                  { label: 'Filed This Month', value: '67',  color: '#2563EB', bg: 'rgba(37,99,235,0.08)'  },
                  { label: 'Approval Rate',    value: '94%', color: '#7C3AED', bg: 'rgba(124,58,237,0.08)' },
                ].map(s => (
                  <div
                    key={s.label}
                    className="rounded-xl p-3"
                    style={{ background: s.bg, border: `1px solid ${s.color}22` }}
                  >
                    <div className="font-display font-bold text-xl mb-0.5" style={{ color: s.color, letterSpacing: '-0.04em' }}>{s.value}</div>
                    <div className="text-xs font-medium" style={{ color: 'var(--text-3)' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Cases list */}
              <div className="px-4 pb-4">
                <div
                  className="rounded-xl overflow-hidden"
                  style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}
                >
                  <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>Recent Cases</span>
                    <span className="text-xs font-semibold" style={{ color: 'var(--brand)' }}>View All →</span>
                  </div>
                  {[
                    { name: 'Zhang, Wei — H-1B Cap',     status: 'Approved',   color: '#059669', bg: 'rgba(5,150,105,0.1)'  },
                    { name: 'Patel, Raj — L-1A Petition',status: 'In Review',  color: '#2563EB', bg: 'rgba(37,99,235,0.1)'  },
                    { name: 'Garcia, Ana — EB-2 NIW',    status: 'RFE Received',color:'#D97706', bg: 'rgba(217,119,6,0.1)'  },
                    { name: 'Kim, Ji-Yeon — O-1A',       status: 'Filed',      color: '#7C3AED', bg: 'rgba(124,58,237,0.1)' },
                  ].map(c => (
                    <div
                      key={c.name}
                      className="px-4 py-3 flex items-center justify-between"
                      style={{ borderBottom: '1px solid var(--border)' }}
                    >
                      <span className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>{c.name}</span>
                      <span
                        className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                        style={{ background: c.bg, color: c.color }}
                      >
                        {c.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Fade out bottom */}
            <div className="absolute inset-x-0 bottom-0 h-24 pointer-events-none" style={{ background: 'linear-gradient(to top, var(--bg), transparent)' }} />
          </div>
        </div>
      </section>

      {/* ── Stats ───────────────────────────────────────────── */}
      <section className="py-16 px-5" style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map(s => (
            <div key={s.value}>
              <div className="font-display font-bold text-4xl mb-1" style={{ color: 'var(--text-1)', letterSpacing: '-0.04em' }}>{s.value}</div>
              <div className="text-sm font-semibold mb-0.5" style={{ color: 'var(--text-1)' }}>{s.label}</div>
              <div className="text-xs" style={{ color: 'var(--text-4)' }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────── */}
      <section id="features" className="py-24 px-5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--brand)' }}>Platform Features</div>
            <h2 className="font-display font-bold text-4xl sm:text-5xl mb-4" style={{ letterSpacing: '-0.04em', color: 'var(--text-1)' }}>
              Everything your firm needs
            </h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: 'var(--text-2)' }}>
              Built for practitioners dealing with high volumes, complex compliance, and demanding clients.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(f => {
              const Icon = f.icon
              return (
                <div
                  key={f.title}
                  className="card card-hover p-6 group cursor-pointer"
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 transition-transform duration-200 group-hover:scale-110"
                    style={{ background: `${f.color}14` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: f.color }} />
                  </div>
                  <h3 className="font-display font-semibold text-lg mb-2" style={{ color: 'var(--text-1)', letterSpacing: '-0.03em' }}>
                    {f.title}
                  </h3>
                  <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-3)' }}>{f.desc}</p>
                  <div className="flex flex-wrap gap-2">
                    {f.tags.map(tag => (
                      <span
                        key={tag}
                        className="text-xs px-2.5 py-1 rounded-full font-medium"
                        style={{ background: 'var(--bg-subtle)', color: 'var(--text-3)', border: '1px solid var(--border)' }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Platform ─────────────────────────────────────────── */}
      <section id="platform" className="py-24 px-5" style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--brand)' }}>AI-Powered Core</div>
              <h2 className="font-display font-bold text-4xl sm:text-5xl mb-6 leading-tight" style={{ letterSpacing: '-0.04em', color: 'var(--text-1)' }}>
                From intake to approval,{' '}
                <span className="gradient-text">fully automated</span>
              </h2>
              <p className="leading-relaxed mb-8" style={{ color: 'var(--text-2)' }}>
                Our platform handles the entire case lifecycle. From the moment a client submits their information, AI immediately begins analyzing eligibility, pre-populating forms, flagging compliance risks, and tracking deadlines.
              </p>
              <div className="space-y-4 mb-8">
                {[
                  { icon: Brain,      label: 'AI reads and extracts data from any client document automatically' },
                  { icon: FileText,   label: 'Forms pre-filled in seconds, reviewed by AI before attorney sign-off' },
                  { icon: Bell,       label: 'Automated deadline alerts sent to case managers and clients' },
                  { icon: TrendingUp, label: 'Approval predictions updated in real-time as case develops' },
                  { icon: Lock,       label: 'End-to-end encrypted, HIPAA & GDPR compliant data handling' },
                ].map(item => {
                  const Icon = item.icon
                  return (
                    <div key={item.label} className="flex items-start gap-3">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: 'var(--brand-dim)' }}
                      >
                        <Icon className="w-3.5 h-3.5" style={{ color: 'var(--brand)' }} />
                      </div>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>{item.label}</p>
                    </div>
                  )
                })}
              </div>
              <Link href="/dashboard" className="btn-primary py-3 px-6 text-sm">
                Explore the Platform <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Workflow steps */}
            <div className="space-y-4">
              {[
                { step: '01', title: 'Client Intake',        desc: 'AI chatbot screens eligibility, collects documents via secure portal', color: 'var(--brand)' },
                { step: '02', title: 'Document Processing',  desc: 'OCR + NLP extracts and validates all supporting materials automatically', color: '#2563EB' },
                { step: '03', title: 'Form Generation',      desc: 'Applications auto-populated, compliance checks run, attorney reviews', color: '#7C3AED' },
                { step: '04', title: 'Filing & Monitoring',  desc: 'USCIS submission tracked with real-time status updates and alerts', color: '#D97706' },
              ].map(s => (
                <div
                  key={s.step}
                  className="card card-hover p-5 flex gap-4"
                  style={{ borderLeft: `3px solid ${s.color}` }}
                >
                  <div>
                    <div className="flex items-center gap-3 mb-1.5">
                      <span className="font-mono text-xs font-bold" style={{ color: s.color }}>{s.step}</span>
                      <span className="font-display font-semibold text-sm" style={{ color: 'var(--text-1)', letterSpacing: '-0.02em' }}>{s.title}</span>
                    </div>
                    <p className="text-sm" style={{ color: 'var(--text-3)' }}>{s.desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 flex-shrink-0 self-center ml-auto" style={{ color: 'var(--text-4)' }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Integrations ─────────────────────────────────────── */}
      <section className="py-16 px-5" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-bold uppercase tracking-widest mb-8" style={{ color: 'var(--text-4)' }}>
            Integrates with the tools you already use
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {['Microsoft Word','Google Drive','Slack','Outlook','DocuSign','Salesforce','Clio','MyCase'].map(tool => (
              <div
                key={tool}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-2)', boxShadow: 'var(--shadow-sm)' }}
              >
                {tool}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────── */}
      <section className="py-24 px-5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display font-bold text-4xl mb-3" style={{ letterSpacing: '-0.04em', color: 'var(--text-1)' }}>
              Trusted by immigration professionals
            </h2>
            <p style={{ color: 'var(--text-3)' }}>See how firms are transforming their practices with ImmigAI</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="card card-hover p-6 flex flex-col">
                <div className="flex mb-4">
                  {Array(5).fill(0).map((_,i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed mb-6 flex-1 italic" style={{ color: 'var(--text-2)' }}>
                  "{t.quote}"
                </p>
                <div className="flex items-center gap-3 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, var(--brand) 0%, #2563EB 100%)' }}
                  >
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{t.name}</div>
                    <div className="text-xs" style={{ color: 'var(--text-4)' }}>{t.role} · {t.firm}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-5" style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display font-bold text-4xl sm:text-5xl mb-4" style={{ letterSpacing: '-0.04em', color: 'var(--text-1)' }}>
              Simple, transparent pricing
            </h2>
            <p style={{ color: 'var(--text-3)' }}>Start with a 14-day free trial. No credit card required.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {PRICING.map(plan => (
              <div
                key={plan.name}
                className="card p-7 flex flex-col relative"
                style={plan.highlight ? {
                  borderColor: 'var(--brand)',
                  boxShadow: 'var(--shadow-brand), var(--shadow)',
                } : {}}
              >
                {plan.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span
                      className="text-xs font-bold px-3.5 py-1 rounded-full text-white"
                      style={{ background: 'var(--brand)' }}
                    >
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="font-display font-bold text-xl mb-1" style={{ color: 'var(--text-1)', letterSpacing: '-0.03em' }}>{plan.name}</h3>
                  <p className="text-sm mb-4" style={{ color: 'var(--text-3)' }}>{plan.desc}</p>
                  <div className="flex items-end gap-1">
                    <span className="font-display font-bold text-4xl" style={{ color: 'var(--text-1)', letterSpacing: '-0.04em' }}>{plan.price}</span>
                    {plan.period && <span className="text-sm pb-1" style={{ color: 'var(--text-4)' }}>{plan.period}</span>}
                  </div>
                </div>
                <ul className="space-y-3 flex-1 mb-8">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2.5 text-sm" style={{ color: 'var(--text-2)' }}>
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--brand)' }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/dashboard"
                  className={plan.highlight ? 'btn-primary justify-center py-2.5' : 'btn-secondary justify-center py-2.5'}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="py-24 px-5">
        <div className="max-w-3xl mx-auto text-center">
          <div className="relative">
            <div className="hero-blob w-[600px] h-[400px]" style={{ background: 'radial-gradient(circle, rgba(10,145,97,0.12) 0%, transparent 65%)', top: '-100px', left: '50%', transform: 'translateX(-50%)' }} />
            <h2 className="font-display font-bold text-4xl sm:text-5xl mb-4 relative z-10" style={{ letterSpacing: '-0.04em', color: 'var(--text-1)' }}>
              Ready to transform your<br />immigration practice?
            </h2>
            <p className="text-lg mb-10 relative z-10" style={{ color: 'var(--text-2)' }}>
              Join 500+ firms already using ImmigAI to handle more cases with less effort.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
              <Link href="/dashboard" className="btn-primary py-3 px-8 text-base">
                Start Free Trial <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                className="btn-secondary py-3 px-8 text-base"
                onClick={() => window.location.href = 'mailto:sales@immigai.com'}
              >
                <MessageSquare className="w-4 h-4" />
                Talk to Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-card)' }} className="py-12 px-5">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-5 gap-8 mb-10">
            <div className="md:col-span-2">
              <Link href="/" className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--brand)' }}>
                  <Scale className="w-4 h-4 text-white" />
                </div>
                <span className="font-display font-bold text-lg" style={{ color: 'var(--text-1)', letterSpacing: '-0.03em' }}>ImmigAI</span>
              </Link>
              <p className="text-sm leading-relaxed max-w-xs" style={{ color: 'var(--text-3)' }}>
                The end-to-end AI immigration platform built for law firms and corporate teams who need to scale.
              </p>
            </div>
            {[
              { title: 'Product',   links: ['Features', 'Dashboard', 'Analytics', 'Compliance', 'Pricing'] },
              { title: 'Resources', links: ['Documentation', 'API Reference', 'Blog', 'Case Studies', 'Webinars'] },
              { title: 'Company',   links: ['About', 'Careers', 'Privacy Policy', 'Terms of Service', 'Security'] },
            ].map(col => (
              <div key={col.title}>
                <h4 className="text-sm font-bold mb-4" style={{ color: 'var(--text-1)' }}>{col.title}</h4>
                <ul className="space-y-2.5">
                  {col.links.map(l => (
                    <li key={l}>
                      <Link href="#" className="nav-link text-sm" style={{ color: 'var(--text-3)' }}>{l}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
            <p className="text-xs" style={{ color: 'var(--text-4)' }}>
              © {new Date().getFullYear()} ImmigAI, Inc. All rights reserved.
            </p>
            <div className="flex items-center gap-5">
              {[
                { icon: Lock,      label: 'SOC 2 Type II' },
                { icon: Shield,    label: 'GDPR Compliant' },
                { icon: Building2, label: 'HIPAA Compliant' },
              ].map(item => {
                const Icon = item.icon
                return (
                  <span key={item.label} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-4)' }}>
                    <Icon className="w-3 h-3" /> {item.label}
                  </span>
                )
              })}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
