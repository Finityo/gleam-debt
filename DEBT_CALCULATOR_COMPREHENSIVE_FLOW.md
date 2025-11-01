# Comprehensive Debt Calculator Flow & Logic Documentation

## Overview
This document details the complete flow, logic, formulas, and arithmetic used in the Finityo Debt Freedom Calculator from user input to final debt payoff plan.

---

## 1. USER INPUT STAGE (DebtCalculator.tsx)

### Input Data Structure
```typescript
interface DebtInput {
  name: string;              // Creditor name (e.g., "Chase Visa")
  balance: number;           // Current balance owed ($)
  apr: number;               // Annual Percentage Rate (%)
  minPayment: number;        // Minimum monthly payment ($)
  dueDay?: number;           // Day of month payment is due (1-31)
  type?: string;             // Debt type: 'credit_card', 'personal_loan', etc.
}

interface CalculatorSettings {
  strategy: 'snowball' | 'avalanche';  // Payoff strategy
  extra_monthly: number;               // Extra $ to apply each month
  one_time: number;                    // One-time payment to apply upfront
}
```

### User Actions Flow
```
┌─────────────────────────────────────────────────────────────────┐
│ 1. USER ADDS DEBTS                                              │
│    - Manual entry OR                                             │
│    - Import from Excel OR                                        │
│    - Import from connected Plaid accounts                        │
├─────────────────────────────────────────────────────────────────┤
│ 2. USER SETS STRATEGY                                            │
│    - Snowball: Pay smallest balance first                        │
│    - Avalanche: Pay highest APR first                            │
├─────────────────────────────────────────────────────────────────┤
│ 3. USER SETS EXTRA PAYMENTS                                      │
│    - Extra Monthly: Additional $ every month                     │
│    - One-Time: Lump sum applied to first debt immediately        │
├─────────────────────────────────────────────────────────────────┤
│ 4. DEBTS SAVED TO SUPABASE                                       │
│    Table: debts                                                  │
│    Table: debt_calculator_settings                               │
├─────────────────────────────────────────────────────────────────┤
│ 5. USER CLICKS "COMPUTE PLAN"                                    │
│    → Calls supabase.functions.invoke('compute-debt-plan')       │
│    → Navigates to /debt-plan with results                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. COMPUTATION ENGINE (compute-debt-plan/index.ts)

### Core Algorithm Flow
```
┌─────────────────────────────────────────────────────────────────┐
│ INPUT VALIDATION                                                 │
│ ✓ Check all debts have balance > 0                              │
│ ✓ Check APR >= 0                                                │
│ ✓ Check minPayment > 0                                          │
└─────────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────────┐
│ APR NORMALIZATION                                                │
│ Formula: monthlyRate = (apr / 100) / 12                         │
│ Example: 18% APR → 0.18 / 12 = 0.015 per month                 │
└─────────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────────┐
│ ONE-TIME PAYMENT APPLICATION                                     │
│ IF one_time > 0:                                                │
│   Apply to first debt in sorted order                           │
│   newBalance = max(0, originalBalance - one_time)               │
└─────────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────────┐
│ DEBT SORTING (based on strategy)                                │
│                                                                  │
│ SNOWBALL: Sort by balance (ascending)                           │
│   [Debt A: $500] → [Debt B: $1200] → [Debt C: $5000]          │
│                                                                  │
│ AVALANCHE: Sort by APR (descending)                             │
│   [Debt X: 24%] → [Debt Y: 18%] → [Debt Z: 12%]               │
└─────────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────────┐
│ MONTHLY SIMULATION LOOP                                          │
│ Continue until ALL debts are paid off                           │
└─────────────────────────────────────────────────────────────────┘
```

### Monthly Payment Calculation (The Core Math)

For each month, for each debt:

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: CALCULATE INTEREST FOR THIS MONTH                       │
│                                                                  │
│ Formula:                                                         │
│   monthlyInterest = currentBalance × monthlyRate                │
│                                                                  │
│ Example:                                                         │
│   Balance: $1,000                                               │
│   APR: 18% → monthlyRate = 0.015                               │
│   Interest = $1,000 × 0.015 = $15.00                           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: APPLY MINIMUM PAYMENT                                   │
│                                                                  │
│ interestPortion = monthlyInterest                               │
│ principalPortion = minPayment - interestPortion                 │
│ newBalance = currentBalance - principalPortion                  │
│                                                                  │
│ Example:                                                         │
│   Min Payment: $50                                              │
│   Interest: $15                                                 │
│   Principal: $50 - $15 = $35                                   │
│   New Balance: $1,000 - $35 = $965                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: ACCUMULATE SNOWBALL EXTRA                               │
│                                                                  │
│ When a debt is PAID OFF:                                        │
│   snowballExtra += that debt's minPayment                       │
│                                                                  │
│ Example:                                                         │
│   Debt A paid off (was $50/month)                              │
│   Debt B paid off (was $75/month)                              │
│   snowballExtra = $50 + $75 = $125                             │
│   This $125 goes to next debt + user's extra_monthly           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: APPLY EXTRA TO SMALLEST REMAINING DEBT                  │
│                                                                  │
│ totalExtra = extra_monthly + snowballExtra                      │
│                                                                  │
│ Find the debt with SMALLEST balance still > 0                   │
│ Apply totalExtra to it:                                         │
│                                                                  │
│ additionalPrincipal = min(totalExtra, remainingBalance)         │
│ newBalance = currentBalance - additionalPrincipal               │
│                                                                  │
│ Example:                                                         │
│   extra_monthly: $200                                           │
│   snowballExtra: $125 (from paid off debts)                    │
│   totalExtra: $325                                              │
│   Apply all $325 to smallest remaining debt                     │
└─────────────────────────────────────────────────────────────────┘
```

### Complete Monthly Cycle Example

```
INITIAL STATE:
Debt A: $500 @ 15% APR, $25 min payment
Debt B: $1,200 @ 20% APR, $50 min payment  
Debt C: $5,000 @ 18% APR, $100 min payment
Strategy: Snowball (smallest first)
Extra Monthly: $200
One-Time: $0

┌─────────────────────────────────────────────────────────────────┐
│ MONTH 1                                                          │
├─────────────────────────────────────────────────────────────────┤
│ Debt A (target - smallest balance)                              │
│   Interest: $500 × (0.15/12) = $6.25                           │
│   Min Payment: $25                                              │
│     → Interest portion: $6.25                                   │
│     → Principal portion: $25 - $6.25 = $18.75                  │
│   Balance after min: $500 - $18.75 = $481.25                   │
│   Extra applied: $200                                           │
│   Balance after extra: $481.25 - $200 = $281.25                │
├─────────────────────────────────────────────────────────────────┤
│ Debt B                                                           │
│   Interest: $1,200 × (0.20/12) = $20.00                        │
│   Min Payment: $50                                              │
│     → Principal: $50 - $20 = $30                               │
│   Balance: $1,200 - $30 = $1,170                               │
├─────────────────────────────────────────────────────────────────┤
│ Debt C                                                           │
│   Interest: $5,000 × (0.18/12) = $75.00                        │
│   Min Payment: $100                                             │
│     → Principal: $100 - $75 = $25                              │
│   Balance: $5,000 - $25 = $4,975                               │
├─────────────────────────────────────────────────────────────────┤
│ Month 1 Summary:                                                 │
│   Total Paid: $25 + $50 + $100 + $200 = $375                   │
│   Total Interest: $6.25 + $20 + $75 = $101.25                  │
│   Total Principal: $375 - $101.25 = $273.75                    │
│   Remaining Total: $281.25 + $1,170 + $4,975 = $6,426.25      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ MONTH 2                                                          │
├─────────────────────────────────────────────────────────────────┤
│ Debt A (still smallest)                                          │
│   Interest: $281.25 × (0.15/12) = $3.52                        │
│   Min Payment: $25                                              │
│     → Principal: $25 - $3.52 = $21.48                          │
│   Balance after min: $281.25 - $21.48 = $259.77                │
│   Extra applied: $200                                           │
│   Balance after extra: $259.77 - $200 = $59.77                 │
├─────────────────────────────────────────────────────────────────┤
│ [Debt B and C same calculations...]                             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ MONTH 3 (Debt A PAID OFF)                                       │
├─────────────────────────────────────────────────────────────────┤
│ Debt A                                                           │
│   Interest: $59.77 × (0.15/12) = $0.75                         │
│   Payment needed: $59.77 + $0.75 = $60.52                      │
│   Min + Extra available: $25 + $200 = $225                     │
│   PAID IN FULL! Leftover: $225 - $60.52 = $164.48             │
│   ✓ Debt A ELIMINATED                                           │
├─────────────────────────────────────────────────────────────────┤
│ SNOWBALL EFFECT ACTIVATED:                                       │
│   Previous min payment ($25) now added to snowballExtra         │
│   Leftover from this month ($164.48) carries to Debt B          │
├─────────────────────────────────────────────────────────────────┤
│ Debt B (now smallest, receives full snowball)                   │
│   Interest: $1,110 × (0.20/12) = $18.50                        │
│   Min Payment: $50 → Principal: $31.50                          │
│   Balance after min: $1,078.50                                  │
│   Extra applied: $200 (user) + $25 (freed up) + $164.48        │
│                = $389.48 TOTAL EXTRA                            │
│   New Balance: $1,078.50 - $389.48 = $689.02                   │
└─────────────────────────────────────────────────────────────────┘

[Continue until all debts reach $0...]
```

---

## 3. PAYOFF TIME CALCULATION

### Formula for Months to Payoff
```
When payment > interest per month:

monthsToPayoff = -log(1 - (balance × monthlyRate / payment)) / log(1 + monthlyRate)

Example:
  Balance: $1,000
  APR: 18% → monthlyRate = 0.015
  Payment: $50

  monthsToPayoff = -log(1 - (1000 × 0.015 / 50)) / log(1.015)
                 = -log(1 - 0.3) / log(1.015)
                 = -log(0.7) / 0.0149
                 = 0.357 / 0.0149
                 = 23.96 months ≈ 24 months
```

### Early Payoff Detection
```
IF payment ≤ monthlyInterest:
  Debt is NOT payable (interest exceeds payment)
  Return: Infinity months

IF payment covers balance in one month:
  Return: 1 month
```

---

## 4. OUTPUT DATA STRUCTURE

### Monthly Snapshot
```typescript
interface MonthlySnapshot {
  month: number;           // Month number (1, 2, 3...)
  date: string;           // "January 2025"
  debts: {
    name: string;         // Creditor name
    balance: number;      // Balance at END of month
    payment: number;      // Total payment this month
    interest: number;     // Interest charged this month
    principal: number;    // Principal paid this month
  }[];
  totalBalance: number;   // Sum of all balances
  totalPaid: number;      // Total $ paid this month
  totalInterest: number;  // Total interest this month
  totalPrincipal: number; // Total principal this month
}
```

### Final Result
```typescript
interface ComputeResult {
  rows: DebtPlanRow[];           // Legacy table format
  schedule: MonthlySnapshot[];   // Month-by-month breakdown
  payoffOrder: string[];         // Order debts were eliminated
  totals: {
    totalPaid: number;           // Sum of all payments
    totalInterest: number;       // Total interest over life
    totalPrincipal: number;      // Total principal (sum of balances)
    months: number;              // Total months to debt freedom
  };
}
```

---

## 5. SNOWBALL VS AVALANCHE COMPARISON

### Snowball Strategy (Psychological Wins)
```
Sort: balance (ascending)
Focus: Smallest debt first
Advantage: Quick wins boost motivation
Math: May pay slightly more interest overall

Example Order:
  1. Credit Card A: $500 @ 15% APR
  2. Credit Card B: $1,200 @ 20% APR
  3. Car Loan: $5,000 @ 12% APR

Payoff: A → B → C (regardless of interest rate)
```

### Avalanche Strategy (Optimal Math)
```
Sort: APR (descending)
Focus: Highest interest rate first
Advantage: Pays less interest overall
Math: Mathematically optimal

Example Order:
  1. Credit Card B: $1,200 @ 20% APR
  2. Credit Card A: $500 @ 15% APR
  3. Car Loan: $5,000 @ 12% APR

Payoff: B → A → C (by interest rate)
```

### Interest Savings Comparison
```
Same debts, same payments, different order:

Snowball: $6,700 total (18 months)
  Month 1-3: Pay off $500 debt
  Month 4-10: Pay off $1,200 debt
  Month 11-18: Pay off $5,000 debt
  Total Interest: $450

Avalanche: $6,650 total (18 months)
  Month 1-7: Pay off $1,200 debt
  Month 8-10: Pay off $500 debt
  Month 11-18: Pay off $5,000 debt
  Total Interest: $400

Savings: $50 with Avalanche
```

---

## 6. KEY FORMULAS REFERENCE

### Interest Calculation
```
monthlyInterest = balance × (APR / 100) / 12
```

### Principal Calculation
```
principal = payment - interest
newBalance = balance - principal
```

### Payoff Time (Months)
```
months = -log(1 - (balance × monthlyRate / payment)) / log(1 + monthlyRate)
```

### Total Interest Over Life
```
totalInterest = (payment × months) - initialBalance
```

### Effective Interest Rate
```
effectiveRate = (totalInterest / initialBalance) × 100%
```

---

## 7. EDGE CASES HANDLED

### Case 1: Payment Less Than Interest
```
IF minPayment ≤ monthlyInterest:
  Debt grows each month (negative amortization)
  Validation error: "Minimum payment too low"
```

### Case 2: One-Time Payment Exceeds Debt
```
IF oneTime > debt.balance:
  Excess = oneTime - debt.balance
  Debt eliminated immediately
  Excess applied to next debt in order
```

### Case 3: All Debts Paid Same Month
```
IF multiple debts < payment remaining:
  Pay all in order
  Accumulate leftover for next cycle
```

### Case 4: Zero APR Debt
```
IF apr === 0:
  monthlyRate = 0
  No interest charged
  Pure principal reduction
```

---

## 8. UI DISPLAY FLOW (DebtPlan.tsx)

```
┌─────────────────────────────────────────────────────────────────┐
│ TAB 1: SNOWBALL TABLE                                            │
│ Shows all debts with:                                            │
│   - Current balance                                              │
│   - APR                                                          │
│   - Min payment                                                  │
│   - Estimated payoff (months)                                    │
│   - Monthly breakdown                                            │
├─────────────────────────────────────────────────────────────────┤
│ TAB 2: MONTHLY CALENDAR                                          │
│ Expandable month-by-month view:                                  │
│   Month 1: January 2025                                          │
│     Debt A: Paid $225 → Balance $275                            │
│     Debt B: Paid $50 → Balance $1,150                           │
│     Total Paid: $375 | Interest: $101 | Remaining: $1,425      │
├─────────────────────────────────────────────────────────────────┤
│ TAB 3: SUMMARY                                                   │
│ Printable overview:                                              │
│   - Total debt: $6,700                                          │
│   - Total interest: $450                                        │
│   - Time to freedom: 18 months                                  │
│   - Payoff order: A → B → C                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. DATA PERSISTENCE

### Database Tables
```sql
-- User's debts
debts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  name TEXT,
  balance NUMERIC,
  apr NUMERIC,
  min_payment NUMERIC,
  due_date TEXT,
  debt_type TEXT
)

-- Calculator settings
debt_calculator_settings (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  strategy TEXT, -- 'snowball' or 'avalanche'
  extra_monthly NUMERIC,
  one_time NUMERIC
)
```

---

## 10. COMPLETE EXECUTION TRACE EXAMPLE

```
═══════════════════════════════════════════════════════════════════
INPUT
═══════════════════════════════════════════════════════════════════
Debts:
  1. Chase Visa: $3,000 @ 19.99% APR, $90 min
  2. Discover: $1,500 @ 16.99% APR, $45 min
  3. Car Loan: $8,000 @ 5.99% APR, $200 min

Strategy: Snowball
Extra Monthly: $300
One-Time: $500

═══════════════════════════════════════════════════════════════════
PROCESSING
═══════════════════════════════════════════════════════════════════

STEP 1: Normalize APR
  Chase: 19.99% → 0.016658/month
  Discover: 16.99% → 0.014158/month
  Car: 5.99% → 0.004992/month

STEP 2: Apply One-Time
  Sorted by balance: Discover ($1,500) → Chase ($3,000) → Car ($8,000)
  Apply $500 to Discover
  New: Discover $1,000

STEP 3: Begin Monthly Simulation

MONTH 1:
  Discover (smallest): $1,000
    Interest: $1,000 × 0.014158 = $14.16
    Min: $45 → Principal: $30.84 → Balance: $969.16
    Extra: $300 → Balance: $669.16
  
  Chase: $3,000
    Interest: $3,000 × 0.016658 = $49.97
    Min: $90 → Principal: $40.03 → Balance: $2,959.97
  
  Car: $8,000
    Interest: $8,000 × 0.004992 = $39.94
    Min: $200 → Principal: $160.06 → Balance: $7,839.94
  
  Total Paid: $635
  Total Balance: $11,469.07

MONTH 2:
  Discover: $669.16
    Interest: $9.47
    Min: $45 → Principal: $35.53 → Balance: $633.63
    Extra: $300 → Balance: $333.63

  [Continue Chase and Car...]

MONTH 3:
  Discover: $333.63
    Interest: $4.72
    Payment: $338.35 → PAID OFF! ✓
    Leftover: $45 + $300 - $338.35 = $6.65
  
  Snowball: $45 freed up
  
  Chase (now smallest):
    Interest: $49.26
    Min: $90 → Principal: $40.74 → Balance: $2,868.49
    Extra: $300 + $45 + $6.65 = $351.65
    New Balance: $2,516.84

[Continue until all paid...]

═══════════════════════════════════════════════════════════════════
OUTPUT
═══════════════════════════════════════════════════════════════════
Total Months: 16
Total Paid: $12,562
Total Interest: $562
Total Principal: $12,000

Payoff Order:
  1. Discover (Month 3)
  2. Chase (Month 8)
  3. Car Loan (Month 16)

Monthly Schedule: [16 monthly snapshots with full breakdown]
```

---

## 11. VALIDATION & ERROR HANDLING

### Input Validation
```typescript
✓ balance > 0
✓ apr >= 0
✓ minPayment > 0
✓ minPayment > (balance × apr/12) // Must cover interest
✓ extra_monthly >= 0
✓ one_time >= 0
✓ strategy in ['snowball', 'avalanche']
```

### Runtime Checks
```typescript
✓ No infinite loops (max 600 months)
✓ No negative balances
✓ All payments properly allocated
✓ Snowball extra correctly accumulated
✓ Interest never negative
```

---

## END OF DOCUMENTATION

This document provides the complete mathematical and logical flow of the Finityo Debt Freedom Calculator from user input through computation to final display.

**Key Takeaway**: The system uses standard amortization math with a twist - the "snowball" or "avalanche" strategy determines payment order, and freed-up minimum payments cascade to remaining debts for accelerated payoff.
