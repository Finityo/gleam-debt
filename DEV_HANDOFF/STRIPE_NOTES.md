# Stripe Integration

## Pricing Tiers
- **Essential**: $2.99/month (5 debts max, basic features)
- **Ultimate**: $4.99/month (unlimited debts, Plaid, exports)

## Environment Variables
```
STRIPE_PRICE_ESSENTIALS=price_xxx
STRIPE_PRICE_ULTIMATE=price_xxx
```

## Webhooks
Endpoint: `/api/stripe-webhook`
Events: subscription.created, subscription.updated, subscription.deleted

## Routes
- `/pricing` - Public pricing page
- `/checkout/success` - Post-checkout success
- `/checkout/cancel` - Checkout cancelled
