# Finityo Routes Map

## Public Routes (No Auth)
- `/` - Landing page
- `/hero` - Hero marketing page
- `/auth/signin` - Sign in page
- `/auth/signup` - Sign up page
- `/pricing` - Pricing page ($2.99 Essential, $4.99 Ultimate)
- `/about` - About page
- `/privacy` - Privacy policy
- `/terms` - Terms of service
- `/blog` - Blog index
- `/blog/:slug` - Individual blog post
- `/p/:id` - Shared plan viewer (public, PIN-protected option)

## Demo Flow (Public, No Auth Required)
- `/demo/start` - Demo entry point
- `/demo/debts` - Input debt information
- `/demo/plan` - Configure payment strategy
- `/demo/chart` - View payoff visualization

## Protected Routes (Requires Auth)
### Main App
- `/dashboard` - Main dashboard
- `/debts` - Manage debts
- `/debt-plan` - Configure debt payoff plan
- `/debt-chart` - View debt charts
- `/scenarios` - Compare different strategies
- `/settings` - User settings
- `/profile` - User profile

### Advanced Features
- `/ai-advisor` - AI financial advisor
- `/payoff-calendar` - Calendar view of payoffs
- `/share/history` - Share link history

### Admin
- `/admin` - Admin dashboard
- `/admin/roles` - User role management
- `/support-dashboard` - Support dashboard
- `/security-audit` - Security audit page
