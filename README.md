# InvoiceApp

A premium, full-stack freelance invoicing application built with Next.js 15, Prisma, Auth.js, Stripe, Resend, and `@react-pdf/renderer`.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Auth | Auth.js v5 — Passwordless / Magic Links |
| Database | PostgreSQL via Prisma ORM |
| Styling | Tailwind CSS + custom design tokens |
| Animation | Framer Motion |
| Forms | React Hook Form + Zod |
| PDF | @react-pdf/renderer |
| Email | Resend |
| Payments | Stripe Checkout + Webhooks |
| Icons | Lucide React |

---

## Project Structure

```
invoiceapp/
├── app/
│   ├── (dashboard)/              # Authenticated shell
│   │   ├── layout.tsx            # Shell: Sidebar + Header
│   │   ├── dashboard/page.tsx    # Dashboard overview
│   │   ├── invoices/
│   │   │   ├── page.tsx          # Invoice list
│   │   │   ├── [id]/             # Invoice detail, actions, send email
│   │   │   └── new/              # Split-panel invoice builder
│   │   ├── customers/page.tsx    # Customer list
│   │   └── settings/             # FreelancerSettings form
│   ├── api/
│   │   ├── auth/[...nextauth]/   # Auth.js route handler
│   │   ├── invoices/[id]/pdf/    # PDF streaming endpoint
│   │   └── webhooks/stripe/      # Stripe webhook handler
│   ├── login/                    # Passwordless login page
│   ├── pay/[token]/              # Public client portal + Stripe
│   │   └── success/              # Post-payment confirmation
│   ├── layout.tsx                # Root layout (Geist font)
│   ├── globals.css               # Design tokens + base styles
│   └── not-found.tsx             # Global 404
├── components/
│   ├── sidebar.tsx               # Collapsible animated sidebar
│   ├── header.tsx                # Breadcrumb + user menu
│   └── ui/form-primitives.tsx    # Reusable form components
├── lib/
│   ├── prisma.ts                 # Prisma singleton
│   ├── utils.ts                  # cn(), formatCurrency(), formatDate()
│   ├── invoice-id.ts             # Crypto-secure ID generator w/ retry
│   ├── schemas/
│   │   ├── invoice.schema.ts     # Invoice Zod schema + computeTotals()
│   │   └── settings.schema.ts    # FreelancerSettings Zod schema
│   ├── pdf/
│   │   ├── invoice-pdf.tsx       # @react-pdf/renderer Document component
│   │   └── generate-pdf.ts       # Server-side PDF buffer generator
│   └── emails/
│       ├── magic-link.ts         # Magic link email HTML
│       └── invoice-email.ts      # Invoice email HTML (table-based)
├── prisma/
│   └── schema.prisma             # DB schema: User, Invoice, Customer, etc.
├── auth.ts                       # Auth.js v5 config
├── middleware.ts                 # Route protection + redirect logic
├── next.config.ts                # Next.js config
├── tailwind.config.ts            # Design system tokens
├── tsconfig.json
├── package.json
└── .env.example                  # Environment variable template
```

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in all values in `.env.local`:

```env
DATABASE_URL="postgresql://..."
AUTH_SECRET="..."           # openssl rand -base64 32
AUTH_URL="http://localhost:3000"
RESEND_API_KEY="re_..."
EMAIL_FROM="InvoiceApp <noreply@yourdomain.com>"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Set up the database

```bash
npm run db:generate   # Generate Prisma client
npm run db:push       # Push schema to DB (dev)
# or for production:
npm run db:migrate    # Create and apply migration
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Authentication

Strictly passwordless via **magic links**. Users enter their email, receive a link via Resend, and are authenticated instantly. No passwords stored anywhere.

- Auth.js v5 with the `Resend` provider
- Prisma adapter for session persistence
- `FreelancerSettings` row auto-seeded on first login

---

## Invoice Number Format

```
{PREFIX}-{9 cryptographically secure digits}
e.g.  DEV-483920174
```

Generated using `crypto.randomBytes` (not `Math.random`). The retry loop handles collisions (probability: 1 in 900M per attempt, max 10 retries). The `invoiceNumber` column has a `UNIQUE` constraint as a DB-level safety net.

---

## Money Handling

All monetary values are stored as **integer cents** in PostgreSQL to avoid floating-point drift:
- `$1,234.56` → `123456` in DB
- Tax rates stored as **basis points** (`2000 bps = 20.00%`)
- `computeTotals()` in `lib/schemas/invoice.schema.ts` is the single source of truth used by both client preview and server action

---

## PDF Generation

`@react-pdf/renderer` renders invoices server-side via `renderToBuffer`. The PDF is:
- Generated on demand via `GET /api/invoices/[id]/pdf`
- Attached to emails via Resend's `attachments` field
- Auth-guarded: ownership verified before any generation

---

## Stripe Integration

**Flow:**
1. Client visits `/pay/[publicToken]`
2. Clicks "Pay Now" → server action creates a Stripe Checkout Session
3. Client is redirected to Stripe-hosted checkout
4. On success, Stripe POSTs to `/api/webhooks/stripe`
5. Webhook verifies signature → marks invoice `PAID` + stamps `paidAt`
6. Client is redirected to `/pay/[token]/success`

**Webhook security:** raw body is read with `req.text()` before any parsing, then verified with `stripe.webhooks.constructEvent()`. Requests with invalid signatures are rejected with `400`.

---

## Design System

| Token | Value |
|---|---|
| Background | `#0A0A0A` (Deep Space Black) |
| Text | `#F8F8F8` (Ghost White) |
| Accent | `#3B82F6` (Electric Blue) |
| Font | Geist Sans / Geist Mono |
| Border | `rgba(255,255,255,0.06)` |

All tokens are defined as CSS custom properties in `globals.css` and as Tailwind theme extensions in `tailwind.config.ts`.

---

## Stripe Webhook — Local Testing

Install the Stripe CLI, then:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the webhook signing secret and set it as `STRIPE_WEBHOOK_SECRET` in `.env.local`.

---

## Deployment

Recommended: **Vercel** (frontend + API) + **Supabase** or **Neon** (PostgreSQL).

1. Push to GitHub
2. Connect repo to Vercel
3. Set all environment variables in Vercel dashboard
4. Run `npm run db:migrate` against your production DB
5. Set your production `NEXT_PUBLIC_APP_URL`
6. Register your Stripe webhook at `https://yourdomain.com/api/webhooks/stripe` in the Stripe dashboard

---

## Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run db:generate  # Regenerate Prisma client after schema changes
npm run db:push      # Push schema (dev — no migration history)
npm run db:migrate   # Create + apply migration (production)
npm run db:studio    # Open Prisma Studio GUI
```

---

## License

MIT — build whatever you want with it.
