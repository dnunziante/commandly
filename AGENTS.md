# Sales Assistant AI contributor guide

## Product guardrails

- Build a trustworthy, multi-tenant sales enablement product in small, testable milestones.
- Version 1 serves company administrators and sales representatives. Keep tenant data boundaries explicit when persistence is introduced.
- Use sample data until a milestone explicitly authorizes a backend or AI provider.
- Never invent product facts, pricing, availability, or policy. Future AI responses must cite approved company knowledge.
- Do not connect Supabase, OpenAI, analytics, billing, or other external services without an approved milestone.

## Engineering conventions

- Use the Next.js App Router, strict TypeScript, React, and Tailwind CSS.
- Prefer server components. Add `"use client"` only for genuine browser interaction.
- Keep shared UI in `src/components`, sample domain data in `src/lib`, and route-specific UI in `src/app`.
- Preserve accessible names, keyboard behavior, visible focus states, semantic landmarks, and responsive layouts.
- Reuse design tokens and shared components instead of route-specific copies.
- Before editing Next.js code, consult the matching local guide under `node_modules/next/dist/docs/`.

## Definition of done

- Stay within the current roadmap milestone.
- Run `pnpm lint`, `pnpm typecheck`, and `pnpm build`.
- Manually verify desktop and mobile layouts for user-facing changes.
- Update product documentation when scope or product decisions change.


<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
