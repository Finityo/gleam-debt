import React from "react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-financial-freedom.jpg";
import finityoLogo from "@/assets/finityo-logo.png";

function isIOSWebKit() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /AppleWebKit/.test(ua) && /Mobile|iP(hone|ad|od)/i.test(ua);
}

const SafeImage: React.FC<React.ImgHTMLAttributes<HTMLImageElement> & { maxW?: number }> = ({ maxW = 1400, ...rest }) => (
  <img
    loading="lazy"
    decoding="async"
    fetchPriority="low"
    sizes={`(max-width: ${maxW}px) 100vw, ${maxW}px`}
    style={{ maxWidth: "100%", height: "auto" }}
    {...rest}
  />
);

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "name": "Finityo",
      "url": "https://finityo-debt.com",
      "logo": "https://finityo-debt.com/og-image.jpg",
      "description": "Debt payoff planning tool helping users achieve financial freedom",
      "sameAs": []
    },
    {
      "@type": "WebSite",
      "name": "Finityo Debt Payoff",
      "url": "https://finityo-debt.com",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://finityo-debt.com/?s={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    },
    {
      "@type": "SoftwareApplication",
      "name": "Finityo",
      "applicationCategory": "FinanceApplication",
      "operatingSystem": "Web",
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
      "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.8", "ratingCount": "1247" },
      "description": "Debt payoff planning tool using snowball and avalanche methods with Plaid integration for automatic account sync"
    }
  ]
};

const Index: React.FC = () => {
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!isIOSWebKit()) return;
    // Turn off costly effects on iOS to avoid compositor crashes
    const style = document.createElement("style");
    style.innerHTML = `
      .ios-guard * {
        -webkit-backdrop-filter: none !important;
        backdrop-filter: none !important;
        filter: none !important;
      }
      .svh { min-height: 100svh; }
    `;
    style.setAttribute("data-ios-guard", "true");
    document.head.appendChild(style);
    document.documentElement.classList.add("ios-guard");
    return () => {
      document.documentElement.classList.remove("ios-guard");
      style.remove();
    };
  }, []);

  return (
    <>
      {/* Proper JSON-LD injection */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      <main className="svh flex flex-col">
        {/* Hero */}
        <section className="px-6 py-12 md:py-16 max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <img src={finityoLogo} alt="Finityo" width={36} height={36} />
            <h1 className="text-2xl md:text-3xl font-semibold">Accelerate Your Debt Freedom</h1>
          </div>

          <p className="text-base md:text-lg text-muted-foreground mb-6">
            Connect accounts with Plaid, choose Snowball or Avalanche, and see your debt-free date.
          </p>

          <div className="flex gap-3 mb-8">
            <button
              className="bg-primary text-primary-foreground px-5 py-2.5 rounded-md"
              onClick={() => navigate("/auth?mode=signup")}
            >
              Create your free plan →
            </button>
            <button
              className="border px-5 py-2.5 rounded-md"
              onClick={() => navigate("/pricing")}
            >
              View Pricing
            </button>
          </div>

          <SafeImage src={heroImage} alt="Financial freedom" />
        </section>

        {/* Keep the rest minimal first; re-enable sections one by one to isolate any crash */}
        {/* Sections you can re-add incrementally:
            - Stats Section
            - Testimonials
            - Sample Plan
            - Features Grid (avoid backdrop-filter)
            - Trust & Security (no heavy animations)
            - Blog Featured Card
            - How It Works
            - Debts Preview (mock list)
            - Footer
        */}
      </main>
    </>
  );
};

export default Index;
