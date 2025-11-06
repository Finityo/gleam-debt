# Finityo Build Instructions

## Build Environments

This project supports **two separate build environments**:

### 1. **Demo Build** (Default)
- Entry point: `src/main.tsx`
- Uses demo/mock data from `src/context/PlanContext.tsx`
- Output directory: `dist-demo`
- Perfect for testing, development, and showcasing features

### 2. **Live Build** (Production)
- Entry point: `src/live/index.tsx`
- Connects to real backend APIs
- Output directory: `dist-live`
- Production-ready with authentication and real data

---

## Build Commands

### Demo Build
```bash
npm run build
# or
vite build
```
Builds to `dist-demo/` using demo data

### Live Build
```bash
BUILD_ENV=live npm run build
# or
BUILD_ENV=live vite build
```
Builds to `dist-live/` using live backend

---

## Development Mode

```bash
npm run dev
```
Runs demo version by default on `http://localhost:8080`

---

## Architecture

### Demo Environment
- **Context**: `src/context/PlanContext.tsx`
- **Pages**: `src/pages/*`
- **Data**: Mock data with preset demo debts
- **API**: No backend required

### Live Environment
- **Context**: `src/live/context/PlanContextLive.tsx`
- **Pages**: `src/live/pages/*`
- **Data**: Fetched from `/api/debts` and `/api/settings`
- **API**: Requires Lovable Cloud backend

---

## Next Steps for Live Deployment

1. **Set up Backend APIs**:
   - Create `/api/debts` endpoint
   - Create `/api/settings` endpoint
   
2. **Add Authentication**:
   - Implement login/signup
   - Protect routes with auth guards

3. **Deploy**:
   ```bash
   BUILD_ENV=live npm run build
   # Deploy dist-live/ to your hosting provider
   ```

---

## Environment Detection

The build system automatically detects which environment to use:

```typescript
const isLive = process.env.BUILD_ENV === "live";
```

This switches:
- Entry HTML file
- TypeScript entry point
- Output directory
- Build configuration
