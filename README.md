# Commandly

Commandly is a responsive, multi-tenant sales enablement application. The current frontend is configured for BGC Dealerships and uses temporary product data and simulated AI responses.

## Run locally

Requires Node.js and pnpm.

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Local demo mode

Set `LOCAL_DEMO_MODE=true` only in `.env.development.local` to bypass login while building locally. This uses a mock BGC administrator and sample product data. The switch is ignored in production, where Supabase authentication remains required.

## Validate

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Included

- Marketing landing page and simulated login
- Responsive dashboard with mobile navigation
- Simulated sales assistant chat
- BGC product library and comparisons for Nexus, Beyond, and ActivEV Pulse
- Objection handling, email and text generators, and role-play training
- Training, knowledge base, analytics, and administration screens
- Loading, empty, and error-state examples

## Current foundation

Supabase authentication and tenant isolation are implemented for Sales, Coach, Growth, and Operations routes. Operations procedure and recurring-schedule management is limited to managers, tenant administrators, and the platform owner in both the interface and server actions. See `supabase/README.md` for project setup and administrator provisioning.

Products, Knowledge Base content, Sales Coach workflows, Growth plans, and Operations workflows support tenant-scoped persistence with a local demo fallback. OpenAI remains disconnected.

The Operations Process Improvement module includes employee-friendly problem and idea submission, department assignment, manager review, ownership, Five Whys analysis, corrective action, before-and-after measurements, results, lessons learned, and a basic improvement dashboard. Authenticated work is stored in tenant-scoped Supabase tables; local demo mode continues to use sample data. Lean waste classification remains reserved in the internal model for a later manager-analysis milestone.

## Planned next milestone

Complete final Operations checks and commit the milestone. OpenAI guidance remains a later, server-only milestone.
