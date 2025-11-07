import { ReactNode } from "react";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-finityo-bg text-finityo-textBody">
      <header className="border-b border-white/10 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <img src="/finityo-icon-final.png" alt="Finityo" className="h-9 w-9" />
            <div className="text-xl font-bold text-finityo-textMain">Finityo</div>
          </a>
          <nav className="flex items-center gap-4 text-sm">
            <a href="/demo/start" className="hover:text-white transition-colors">Demo</a>
            <a href="/pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="/auth/signin" className="hover:text-white px-3 py-1 border border-white/20 rounded-lg transition-colors">
              Sign in
            </a>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-8 text-xs flex flex-col md:flex-row gap-4 md:items-center md:justify-between text-finityo-textBody">
          <div>© {new Date().getFullYear()} Finityo · Debt Simplified.</div>
          <nav className="flex gap-4">
            <a href="/pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="/privacy" className="hover:text-white transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-white transition-colors">Terms</a>
            <a href="/disclosures" className="hover:text-white transition-colors">Disclosures</a>
            <a href="/blog" className="hover:text-white transition-colors">Blog</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
