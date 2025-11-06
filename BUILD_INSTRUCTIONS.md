# Finityo Build Instructions

## Quick Start

### Development Mode

**Demo Mode** (default):
```bash
npm run dev
```
Opens at `http://localhost:8080` - Demo environment with mock data

**Live Mode**:
```bash
vite --config vite-live.config.ts
```
Opens at `http://localhost:8080` - Live environment (loads `index-live.html`)

### Production Builds

**Demo Build**:
```bash
npm run build
```
Builds to `dist/` - Demo version

**Live Build**:
```bash
vite build --config vite-live.config.ts
```
Builds to `dist-live/` - Production version

---

## How It Works

- **Demo**: Uses `index.html` → `src/main.tsx` → Demo pages
- **Live**: Uses `index-live.html` → `src/live/index.tsx` → Live pages
- Both share the same `@/lib/debtPlan.ts` engine

---

## Testing Live Mode

Run in your terminal:
```bash
vite --config vite-live.config.ts
```

You should see **"Finityo Live Dashboard"** at the root!

---

## Project Structure

This project has **two parallel environments**:

### 1. **Demo Environment** (Current Default)
- Entry point: `src/main.tsx`
- Uses demo/mock data from `src/context/PlanContext.tsx`
- Perfect for testing, development, and showcasing features
- No backend required

### 2. **Live Environment** (Ready for Production)
- Entry point: `src/live/index.tsx`
- Uses local API modules: `src/live/api/debts.ts` and `src/live/api/settings.ts`
- Ready to connect to Lovable Cloud backend
- Currently uses placeholder data

---

## Current Development

```bash
npm run dev
```
Runs demo version on `http://localhost:8080`

---

## Testing Live Environment Locally

To switch the entry point to test live mode during development:

1. Temporarily edit `index.html` line 61:
   ```html
   <!-- Change from: -->
   <script type="module" src="/src/main.tsx"></script>
   
   <!-- To: -->
   <script type="module" src="/src/live/index.tsx"></script>
   ```

2. Run `npm run dev`

3. Remember to revert before committing!

---

## Architecture

### Demo Environment
- **Context**: `src/context/PlanContext.tsx`
- **Pages**: `src/pages/*`
- **Data**: Mock data with preset demo debts
- **API**: None (fully client-side)

### Live Environment
- **Context**: `src/live/context/PlanContextLive.tsx`
- **Pages**: `src/live/pages/*`
- **Data**: `src/live/api/debts.ts` and `src/live/api/settings.ts`
- **API**: Ready to integrate with Lovable Cloud

---

## Next Steps for Production

1. **Replace Local API Files with Lovable Cloud**:
   - Update `src/live/context/PlanContextLive.tsx`
   - Replace import statements with fetch calls to Supabase
   
2. **Add Authentication**:
   - Implement login/signup in live environment
   - Protect routes with auth guards

3. **Deploy**:
   - Configure deployment to use `src/live/index.tsx` as entry point
   - Set up environment variables for production

---

## Data Flow

**Demo**: 
- Hardcoded data in PlanContext → PlanService.compute() → UI

**Live**: 
- API files → PlanContextLive → PlanService.compute() → UI
- (Future: Lovable Cloud → PlanContextLive → PlanService.compute() → UI)

