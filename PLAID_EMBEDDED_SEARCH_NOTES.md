# Plaid Embedded Institution Search - Future Payment Automation

## Overview
**Status:** Not implemented yet - stored for future debt payment automation feature

Embedded Institution Search (also known as Embedded Link) allows embedding Plaid's institution search directly into the application UI, providing a seamless transition to account connectivity.

## Use Case for Finityo
When we implement **automatic debt payment functionality**, this feature will:
- Guide users to select their bank account as a payment method
- Embed institution search directly in our debt payment flow
- Improve conversion by reducing friction in the payment setup process

## Key Benefits
1. **Seamless UX**: Institution search integrated directly into our app (not a redirect)
2. **Higher Conversion**: Better for payment experiences - guides users to bank payments
3. **Payment Integration**: Works with Database Auth and other Auth flows for ACH payments
4. **Branding**: Maintains Finityo branding throughout the connection process

## Technical Implementation (When Needed)

### Step 1: Request Embedded Link in Link Token
```javascript
const response = await fetch('https://production.plaid.com/link/token/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'PLAID-CLIENT-ID': PLAID_CLIENT_ID,
    'PLAID-SECRET': PLAID_SECRET,
  },
  body: JSON.stringify({
    user: { client_user_id: user.id },
    client_name: 'Finityo',
    products: ['auth'], // For payments
    country_codes: ['US'],
    language: 'en',
    webhook: WEBHOOK_URL,
    // Enable embedded institution search
    institution_search_mode: 'embedded'
  }),
});
```

### Step 2: Implement Institution Search Handler
```typescript
import { usePlaidLink } from 'react-plaid-link';

const config = {
  token: linkToken,
  onSuccess: onSuccessCallback,
  onEvent: onEventCallback,
  onExit: onExitCallback,
  
  // Enable institution search in our UI
  onInstitutionSearch: (query: string, metadata: any) => {
    // Custom search UI logic
    // Return filtered institution results
    // Show in our branded interface
  }
};

const { open, ready } = usePlaidLink(config);
```

### Step 3: Customize Institution Display
- Display institution results in Finityo-branded components
- Add custom filtering/sorting logic
- Include payment-specific messaging
- Show benefits of ACH vs other payment methods

## Products to Initialize for Payments
When implementing payment automation:
- **Required**: `auth` (for ACH debits)
- **Optional**: Consider `identity` for enhanced verification
- **Consider**: Database Auth for instant micro-deposits

## Integration Points in Finityo

### Where to Implement
1. **Debt Payment Setup Flow**
   - User selects "Auto-pay this debt"
   - Embedded search shows bank options
   - Connect specific account for payments

2. **Payment Method Management**
   - Add/remove payment methods
   - Link multiple accounts for different debts
   - Set up payment schedules

3. **Debt Payoff Automation**
   - Connect to recommended payment strategy
   - Schedule automated payments based on payoff plan
   - Track payment execution

## Compatibility
- ✅ Works with micro-deposit flows
- ✅ Compatible with Same-day Micro-deposits
- ✅ Integrates with Database Auth
- ✅ Supports OAuth institutions

## Documentation Reference
Full documentation: https://plaid.com/docs/link/embedded-institution-search/

## Related Features to Consider
1. **Plaid Auth** - Account verification for payments
2. **Database Auth** - Instant micro-deposits
3. **Payment Initiation** - Direct payment execution
4. **Balance** - Real-time balance checks before payments

## Next Steps When Implementing
1. Add `institution_search_mode: 'embedded'` to link token creation
2. Implement `onInstitutionSearch` callback in PlaidLink component
3. Create branded institution search UI component
4. Add payment method selection flow
5. Implement payment scheduling logic
6. Add payment execution via Plaid Auth
7. Track payment status and history

## Cost Considerations
- Auth product pricing for payment verification
- Payment Initiation pricing (if used)
- Consider Database Auth for improved UX (instant verification)

## Security Notes
- Users select specific accounts for payments
- Read-only access until payment authorization
- Each payment requires explicit user consent
- Track payment authorization in database
- Log all payment attempts for audit trail

---
**Last Updated:** 2025-10-23
**Status:** Documentation only - implementation pending
**Priority:** Medium (depends on payment automation roadmap)
