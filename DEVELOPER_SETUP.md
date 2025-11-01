# Finityo Debt Management App - Developer Setup Guide

## 🚀 Quick Start

This repository contains the complete Finityo Debt Management App built with React, TypeScript, and Lovable Cloud (Supabase).

## 📋 Prerequisites

- Node.js 18+ and npm/bun
- Git
- Supabase account (for local development)

## 🔧 Environment Setup

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/finityo-debt-app.git
cd finityo-debt-app
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://jsvduobkznoszmxedkss.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzdmR1b2Jrem5vc3pteGVka3NzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2OTU0MDQsImV4cCI6MjA3NTI3MTQwNH0.tvjsheUrW4po61UAowqCxsiRCaCe2KlFh1nSxeT8eBE
VITE_SUPABASE_PROJECT_ID=jsvduobkznoszmxedkss
```

### 3. Required Secrets (Edge Functions)

The following secrets need to be configured in Supabase Dashboard → Project Settings → Edge Functions:

```bash
# Plaid Integration (for bank account connectivity)
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_secret
PLAID_CLIENT_SECRET_ID=your_plaid_client_secret_id
PLAID_SECRET_ID=your_plaid_secret_id

# Twilio (for phone verification)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_VERIFY_SERVICE_SID=your_twilio_verify_service_sid
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Stripe (for payments/subscriptions)
STRIPE_SECRET_KEY=your_stripe_secret_key

# Lovable AI (optional - for AI features)
LOVABLE_API_KEY=your_lovable_api_key

# Supabase (auto-configured)
SUPABASE_URL=https://jsvduobkznoszmxedkss.supabase.co
SUPABASE_ANON_KEY=see_above
SUPABASE_SERVICE_ROLE_KEY=ask_project_owner
SUPABASE_DB_URL=ask_project_owner
```

## 🗄️ Database Schema

The database schema is maintained in `supabase/migrations/` directory. All migrations are automatically applied in the Lovable Cloud environment.

### Key Tables:
- **profiles** - User profile information
- **debts** - User debt records
- **debt_plans** - Calculated debt payoff plans
- **plaid_items** - Connected bank institutions
- **plaid_accounts** - Bank account details
- **plaid_encrypted_tokens** - Secure token storage
- **analytics_events** - App usage tracking
- **user_roles** - Role-based access control

### Database Functions:
- `handle_new_user()` - Auto-creates profile on signup
- `search_all_tables()` - Full-text search across data
- `get_plaid_token_from_vault()` - Secure token retrieval
- `migrate_single_plaid_token()` - Token migration utility

## 🔌 Edge Functions

Located in `supabase/functions/`, these serverless functions handle:

### Plaid Integration:
- `plaid-create-link-token` - Initialize Plaid Link
- `plaid-exchange-token` - Exchange public token
- `plaid-sync-accounts` - Sync account balances
- `plaid-import-debts` - Import debts from accounts
- `plaid-webhook` - Handle Plaid webhooks
- `plaid-remove-item` - Disconnect bank

### Debt Calculation:
- `compute-debt-plan` - Calculate payoff strategies
- `auto-compute-debt-plans` - Batch plan generation
- `finityo-debt-engine` - Core debt calculation engine

### Data Export:
- `export-debt-csv` - CSV export
- `export-debt-xlsx` - Excel export
- `export-document-pdf` - PDF generation

### User Management:
- `delete-user-account` - Complete account deletion
- `register-team-member` - Team member registration
- `verify-phone-otp` - Phone verification

### Payment/Subscription:
- `create-checkout` - Stripe checkout
- `customer-portal` - Stripe customer portal
- `check-subscription` - Subscription status

### Utilities:
- `track-event` - Analytics tracking
- `search-data` - Data search
- `ai-financial-advisor` - AI-powered advice

## 🚀 Running Locally

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🔐 Security Notes

1. **RLS (Row Level Security)** is enabled on all user-facing tables
2. All Plaid tokens are encrypted and stored securely
3. Authentication is required for most operations
4. Rate limiting is implemented on sensitive endpoints
5. CORS is configured for edge functions

## 📱 Features

### Core Functionality:
- ✅ Debt tracking and management
- ✅ Snowball/Avalanche payoff strategies
- ✅ Plaid bank account integration
- ✅ Real-time debt calculations
- ✅ CSV/Excel/PDF exports
- ✅ AI financial advisor
- ✅ Phone verification (Twilio)
- ✅ Subscription management (Stripe)

### User Roles:
- **User** - Standard user with access to own data
- **Admin** - Full system access, analytics, support

## 🐛 Known Issues & Debugging

### Issue: "Delete All" Button Crashes
**Status:** Fixed (v2.1)
**Solution:** Added `isDeletingRef` flag to prevent race conditions in auto-save

### Issue: Module Import Failure
**Status:** Fixed (v2.0)
**Solution:** Added missing export statement in DebtCalculator

### Debugging Tools:
1. Check browser console for errors
2. View Supabase logs in Lovable Cloud UI
3. Check edge function logs for backend issues
4. Use React DevTools for component inspection

## 📞 API Integrations

### Plaid
- **Environment:** Production
- **Products:** Auth, Transactions, Liabilities
- **Documentation:** https://plaid.com/docs/

### Twilio
- **Product:** Verify API
- **Documentation:** https://www.twilio.com/docs/verify

### Stripe
- **Products:** Checkout, Customer Portal, Subscriptions
- **Documentation:** https://stripe.com/docs

## 🔄 Deployment

The app is automatically deployed via Lovable when changes are pushed to the main branch.

**Production URL:** Available after publishing in Lovable

## 📚 Additional Documentation

- `PLAID_MSA_COMPLIANCE_REPORT.md` - Plaid compliance details
- `SECURITY_NOTES.md` - Security implementation
- `TODO.md` - Feature roadmap
- `DEVELOPER_HANDOFF.md` - Original handoff notes

## 🆘 Support

For questions about the codebase:
1. Review inline code comments
2. Check documentation files in root directory
3. Contact the original developer

## 📄 License

Proprietary - All rights reserved

---

**Last Updated:** 2025-11-01
**Project ID:** jsvduobkznoszmxedkss
**Framework:** React 18 + TypeScript + Vite + Tailwind CSS
**Backend:** Lovable Cloud (Supabase)
