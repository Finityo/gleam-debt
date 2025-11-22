# Legacy Folder — Archived Pages

These files were moved out of the active app because they were outdated,
duplicated, or replaced with new versions.

## Purpose
- Reduce noise in Lovable's page search
- Prevent confusion from seeing multiple similar pages (Hero, Pricing, etc.)
- Ensure developers only modify the current live code

## Structure
- `/demo` — old demo flows before setup migration
- `/plan-old` — old plan pages prior to the new engine
- Misc outdated components replaced by normalized plan structure

## Archived Demo Files (src/legacy/demo/):
- **DemoChartPolished.tsx** - Old demo chart (replaced by routed demo flow)
- **_DemoShell.tsx** - Old demo shell wrapper (replaced by new demo structure)
- **chart.tsx** - Ghost demo chart page (not routed)
- **debts.tsx** - Ghost demo debts page (not routed)
- **plan.tsx** - Ghost demo plan page (not routed)
- **start.tsx** - Ghost demo start page (not routed)

## Archived Root Pages:
- **Index.tsx** - Old landing page (replaced by src/pages/index.tsx)
- **Mobile.tsx** - Old mobile view (replaced by routed mobile pages)
- **pricing.tsx** - Old pricing page (replaced by PricingNew.tsx)

## Rules
1. Do NOT import legacy files into the main codebase.
2. Do NOT route legacy pages in routes.tsx.
3. They are kept for code reference ONLY.
