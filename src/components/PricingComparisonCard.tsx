import { Check, X } from "lucide-react";

interface ComparisonFeature {
  label: string;
  essentials: boolean | string;
  ultimate: boolean | string;
}

const features: ComparisonFeature[] = [
  { label: "Snowball + Avalanche", essentials: true, ultimate: true },
  { label: "Calendar view", essentials: true, ultimate: true },
  { label: "Insights", essentials: false, ultimate: true },
  { label: "Coach access", essentials: false, ultimate: true },
  { label: "Pace monitor", essentials: false, ultimate: true },
  { label: "What-if simulator", essentials: false, ultimate: true },
  { label: "Sharing features", essentials: false, ultimate: true },
];

export const PricingComparisonCard = () => {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="glass rounded-2xl overflow-hidden border border-border/50">
        <div className="grid grid-cols-3 gap-px bg-border/20">
          {/* Header */}
          <div className="bg-background/80 backdrop-blur-xl p-4">
            <h4 className="text-sm font-medium text-muted-foreground">Feature</h4>
          </div>
          <div className="bg-background/80 backdrop-blur-xl p-4 text-center">
            <h4 className="text-sm font-semibold text-foreground">Essentials</h4>
            <p className="text-xs text-muted-foreground mt-1">$2.99/mo</p>
          </div>
          <div className="bg-gradient-to-br from-primary/10 to-accent/10 backdrop-blur-xl p-4 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 animate-pulse" />
            <h4 className="text-sm font-semibold text-primary relative">Ultimate</h4>
            <p className="text-xs text-primary/70 mt-1 relative">$4.99/mo</p>
          </div>

          {/* Features */}
          {features.map((feature, idx) => (
            <>
              <div key={`label-${idx}`} className="bg-background/80 backdrop-blur-xl p-4">
                <span className="text-sm text-foreground">{feature.label}</span>
              </div>
              <div key={`essentials-${idx}`} className="bg-background/80 backdrop-blur-xl p-4 flex items-center justify-center">
                {typeof feature.essentials === "boolean" ? (
                  feature.essentials ? (
                    <Check className="w-5 h-5 text-success" />
                  ) : (
                    <X className="w-5 h-5 text-muted-foreground/30" />
                  )
                ) : (
                  <span className="text-sm text-muted-foreground">{feature.essentials}</span>
                )}
              </div>
              <div key={`ultimate-${idx}`} className="bg-gradient-to-br from-primary/5 to-accent/5 backdrop-blur-xl p-4 flex items-center justify-center">
                {typeof feature.ultimate === "boolean" ? (
                  feature.ultimate ? (
                    <Check className="w-5 h-5 text-primary" />
                  ) : (
                    <X className="w-5 h-5 text-muted-foreground/30" />
                  )
                ) : (
                  <span className="text-sm text-foreground">{feature.ultimate}</span>
                )}
              </div>
            </>
          ))}
        </div>
      </div>
    </div>
  );
};
