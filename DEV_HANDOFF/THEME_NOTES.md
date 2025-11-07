# Finityo Theme System

## Design Tokens (index.css)

### Colors
Use semantic tokens defined in `src/index.css`:
- `--finityo-textMain` - Primary text
- `--finityo-textBody` - Body text
- `--finityo-bg` - Background
- `--primary` - Primary brand color
- `--card` - Card backgrounds
- `--border` - Border colors

### Usage
```tsx
// ✅ CORRECT - Use semantic tokens
<div className="text-finityo-textMain bg-card border-border">

// ❌ WRONG - Don't use direct colors
<div className="text-white bg-white/10 border-white/30">
```

## Components to Use

### PageShell
New unified shell for all public pages:
```tsx
import { PageShell } from "@/components/PageShell";

<PageShell>
  <div className="max-w-5xl mx-auto px-4 py-10">
    {/* Your content */}
  </div>
</PageShell>
```

### Logo
```tsx
import { FinityoLogo } from "@/components/FinityoLogo";
<FinityoLogo />
```

## Shadcn Components
All UI components in `/components/ui` are customizable via variants. Prefer using variants over custom classes.
