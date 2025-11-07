# Demo → Account Migration

## How It Works
When a user signs up after using demo mode, `useDemoMigration` hook detects demo data in localStorage and presents 3 options:
1. **Merge** - Combine demo data with account
2. **Replace** - Use only demo data
3. **Start Fresh** - Clear demo, new account

## LocalStorage Keys
- `finityo:demoDebts`
- `finityo:demoPlan`
- `finityo:demoSettings`

## Migration Flow
1. User signs up → `NextHandler` detects demo data
2. Modal appears with options
3. Calls `/migrate-demo` edge function
4. Redirects to dashboard

## DemoPlanContext
Used in `/demo/*` routes for state management without backend.
