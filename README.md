# Refyntra

Refyntra is a responsive, multi-tenant sales enablement application. The current frontend is configured for BGC Dealerships and uses temporary product data and simulated AI responses.

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

## Planned next milestone

The Supabase authentication and tenant-isolation foundation is implemented. See `supabase/README.md` to connect a project and create the first BGC administrator.

After tenant isolation is verified in a live Supabase project, the next milestone is persistent tenant-scoped products and knowledge-base content. OpenAI remains disconnected until that data boundary is proven.
