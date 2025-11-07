# Finityo Debt Manager - Developer Handoff

## Quick Start

```bash
npm install
npm run dev
```

## Environment Variables

Required in `.env`:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Supabase anon key
- `VITE_DEMO_MODE=true` - Enable demo mode
- `STRIPE_PRICE_ESSENTIALS` - Stripe price ID for $2.99/mo plan
- `STRIPE_PRICE_ULTIMATE` - Stripe price ID for $4.99/mo plan

## Project Structure

```
/src
  /pages          - All route pages
    /demo         - Public demo flow (no auth)
    /auth         - Sign in/up pages
  /components     - Reusable UI components
    /ui           - Shadcn components
  /context        - React contexts (Auth, Plan, Demo)
  /lib            - Business logic & utilities
  /live           - Lovable Cloud integration
```

## Demo vs Live Modes

- **Demo**: localStorage-based, no backend (routes: /demo/*)
- **Live**: Full auth + Supabase backend (routes: /dashboard, /debts, etc.)

## Build & Deploy

```bash
npm run build        # Production build
npm run preview      # Test production build locally
```

Frontend deploys via Lovable publish button. Backend (edge functions) auto-deploy on save.
