# ImmigAI Platform — Merged Repository

> End-to-end AI-powered immigration case management for law firms, corporate immigration teams, and individuals.

This repository was created by merging 11 source repos into a single, production-ready codebase using **R4 (New-Claude-REpo)** as the base.

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL via Prisma ORM |
| Auth | NextAuth.js (credentials + Google OAuth) |
| AI | Anthropic Claude (claude-sonnet-4) |
| Payments | Stripe (subscriptions + portal) |
| File Storage | Vercel Blob (primary) / AWS S3 (optional) |
| Email | Resend |
| Styling | Tailwind CSS + Radix UI |
| Deployment | Vercel |

---

## Features

### Case Management (from R4 base)
- Create and manage immigration cases (H-1B, I-485, EB-2, O-1A, I-130, K-1, F-1, and more)
- Case timeline tracking with automated event logging
- Checklist management with per-visa-type auto-generation
- Deadline tracking with email alerts
- Approval probability scoring

### AI Assistant (from R4 chatEngine)
- Multilingual assistant: English, Spanish, Arabic (RTL), Hindi, Chinese
- Full intake data collection via conversational flow
- Legal disclaimer enforcement on every response
- Session persistence and multi-turn memory

### Eligibility Engine (from R9)
- Rules-based pre-filter + Claude AI deep analysis
- Supports: H-1B, O-1A, EB-1/2/3, F-1, I-485, K-1, TN, L-1, B-1/B-2, EB-2 NIW
- Auto-updates case approval probability score
- Creates timeline event on each analysis run

### Document Management (from R4 + R9)
- Upload via Vercel Blob or AWS S3 (configurable)
- OCR text extraction via Tesseract.js
- AI document analysis and completeness scoring
- Expiry date tracking and alerts

### RFE Response Drafting (from R4)
- AI-powered RFE analysis and response drafting
- Multi-section document export (PDF, DOCX)
- Review workflow with user edit tracking
- Confidence scoring

### Regulatory Alerts (from R4 + R9)
- Live USCIS / Federal Register alert ingestion
- Per-case relevance matching
- Severity levels: critical → high → medium → low → info
- Dashboard widget + dedicated alerts page

### Stripe Subscriptions (from R9)
- Pro ($79/mo): 500 AI credits, unlimited cases, RFE drafting
- Enterprise ($299/mo): Unlimited credits, multi-attorney, admin, HR module
- Stripe webhook handling (checkout, invoices, cancellations)
- Billing portal integration

### Interview Prep (from R8)
- Practice and mock interview modes
- Visa-type specific question banks (H-1B, F-1, I-485, O-1A, and more)
- AI-generated question sets via Claude
- Per-answer scoring and coaching feedback
- Session review with aggregate scores

### Admin Panel (from R9)
- User management with role assignment
- Subscription overrides
- Platform metrics (MRR, user count, cases)
- Audit log for all admin actions

### Safety & Geo Module (from R1)
- AI output validation (hallucination and legal overreach detection)
- PII scrubbing from logs
- Geo-based content gating for restricted countries

### 4-Role RBAC (from R4 + R6)
- `attorney`: Full case management
- `admin`: Platform admin panel + all attorney access
- `client`: View own cases and documents
- `partner`: Case collaboration, limited admin access

---

## Project Structure

```
src/
├── app/
│   ├── login/                  Auth
│   ├── dashboard/              Main dashboard with live alerts
│   ├── cases/                  Case list
│   ├── case/
│   │   ├── create/             New case wizard
│   │   └── [id]/
│   │       ├── page.tsx        Case detail + timeline
│   │       ├── documents/      Document upload and review
│   │       ├── forms/[formId]/ USCIS form completion
│   │       ├── rfe/            RFE drafting workflow
│   │       ├── eligibility/    Eligibility analysis (R9)
│   │       └── timeline/       Full timeline view
│   ├── assistant/              Multilingual AI chat
│   ├── documents/              Global document vault
│   ├── forms/                  All forms overview
│   ├── analytics/              Case analytics + charts
│   ├── compliance/             Regulatory alert management
│   ├── alerts/                 Alerts page (R9)
│   ├── interview-prep/         Interview prep module (R8)
│   ├── clients/                Client list (attorney view)
│   ├── settings/               Account + billing + notifications
│   ├── admin/                  Admin dashboard (R9)
│   │   └── users/              User management table
│   └── api/
│       ├── auth/               NextAuth
│       ├── case/               Case CRUD + documents
│       ├── chat/               AI chat sessions
│       ├── documents/          Upload, OCR, review
│       ├── forms/              Form data save/export
│       ├── rfe/                RFE analyze + draft + export
│       ├── eligibility/        Eligibility engine (R9)
│       ├── regulatory/         Alert fetch + dismiss
│       ├── interview-prep/     Questions + evaluate (R8)
│       ├── stripe/             Checkout + portal + webhook (R9)
│       └── admin/              Admin user management (R9)
├── components/
│   ├── layout/DashboardLayout  Sidebar nav + mobile overlay
│   ├── cases/                  CaseCard, CreateCaseForm, …
│   ├── documents/              DropZone, DocumentList, …
│   ├── forms/                  FormBuilder, FormSection, …
│   ├── rfe/                    RFEDrafter, RFEReview, …
│   ├── assistant/              ChatWindow, MessageBubble, …
│   ├── admin/                  UserTable, AuditLog, …
│   └── ui/                     button, card, input, …
└── lib/
    ├── auth.ts                 NextAuth config (4 roles + Google)
    ├── prisma.ts               Prisma client singleton
    ├── stripe.ts               Stripe client + plan config (R9)
    ├── storage.ts              Blob/S3 unified upload (R9)
    ├── email.ts                Resend email helpers (R9)
    ├── safety.ts               AI output validation + geo (R1)
    ├── chatEngine.ts           Multilingual AI assistant
    ├── rfeEngine.ts            RFE analysis and drafting
    ├── regulatoryEngine.ts     USCIS alert ingestion
    ├── workflow.ts             Case workflow automations
    ├── ai-engines/
    │   ├── eligibility.ts      Rules + Claude eligibility (R9)
    │   ├── documents.ts        Document AI analysis (R9)
    │   └── chat.ts             Chat AI engine (R9)
    ├── form-schemas/           Zod schemas for USCIS forms
    └── actions/                Server actions (cases, docs, forms)
```

---

## Getting Started

### 1. Clone and install
```bash
git clone <this-repo>
cd immigai-platform
npm install
```

### 2. Configure environment
```bash
cp .env.example .env.local
# Fill in all required values — DATABASE_URL, NEXTAUTH_SECRET, ANTHROPIC_API_KEY minimum
```

### 3. Set up database
```bash
npm run db:push    # push schema to PostgreSQL
npm run db:seed    # seed demo data
```

### 4. Run development server
```bash
npm run dev
# Open http://localhost:3000
# Login: demo@immigai.com / demo1234
# Admin: admin@immigai.com / admin123
```

---

## Merge Source Map

| Feature | Merged from |
|---------|-------------|
| Core case management, forms, RFE, AI assistant | **R4** (New-Claude-REpo) — base |
| Eligibility engine, admin panel, audit log | **R9** (VisaGuideAiProclaude) |
| Stripe subscriptions, S3, Resend email | **R9** |
| Interview prep module + question bank | **R8** (VisaGuideAi-Claude-agies) |
| Safety/geo validation, PII scrubbing | **R1** (immigration-platform) |
| 4-role RBAC model (attorney/admin/client/partner) | **R6** (remote-legal-uae) |
| Multilingual 5-language support design | **R3** (New-Aiges-Site) + R4 |

**Discarded repos:**
- R2 (Mini-Immigration-Pro) — stub/mock app, no real features
- R5 (nova-main) — unrelated generic analytics dashboard
- R7 (Vgcfree) — paywall-stripped twin of R4 (95%+ identical)
- R10 (VisaGuideUSA-1) — earlier snapshot fully superseded by R11
- R11 (VisaGuideUSA) — consumer-facing content site; different product category, no case management

---

## Deployment

Deploy to Vercel in one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

Set all env vars in the Vercel dashboard. For the Stripe webhook, point `https://yourapp.vercel.app/api/stripe/webhook` at your Stripe dashboard.

---

## License
Private — all rights reserved.
