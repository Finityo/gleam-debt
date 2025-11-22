# FINITYO ENGINE COMPATIBILITY LAYER (LOCKED)

This folder contains the official compatibility layer for the
Finityo Debt Engine. 

⚠️ DO NOT MODIFY, DELETE, OR REFACTOR ANY FILES HERE unless 
explicitly instructed by the lead architect. These files ensure:
- Backwards compatibility
- UI stability
- Migration safety
- Engine consistency

All new debt calculations must use:
- `computeDebtPlan` from "@/lib/debtPlan"

All legacy components may use:
- `computeDebtPlan` from "@/engine/compat/compatLayer"

This isolation prevents drift and guarantees stability across
Lovable patches, Tupac refactors, and future engine updates.
