import { ReactNode } from "react";
import FooterSitemap from "@/components/FooterSitemap";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="border-b border-border backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <img src="/finityo-icon-final.png" alt="Finityo" className="h-9 w-9" />
            <div className="text-xl font-bold text-foreground">Finityo</div>
          </a>
          <nav className="flex items-center gap-4 text-sm">
            <a href="/setup/start" className="text-muted-foreground hover:text-foreground transition-colors">Setup</a>
            <a href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
            <a href="/auth/signin" className="text-foreground hover:text-primary px-4 py-2 border border-border rounded-lg transition-colors">
              Sign in
            </a>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <FooterSitemap />
    </div>
  );
}
