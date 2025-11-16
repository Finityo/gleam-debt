import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "How does Finityo help me pay off debt faster?",
    answer: "Finityo uses proven strategies like the debt snowball (smallest balance first) and avalanche (highest interest first) methods. You can compare both side-by-side to see which saves you more money and time, then track your progress month-by-month."
  },
  {
    question: "Is my financial data secure?",
    answer: "Absolutely. Finityo uses bank-level encryption (256-bit SSL) and is SOC 2 compliant. We integrate with Plaid for secure bank connections and never store your bank login credentials. All data is encrypted both in transit and at rest."
  },
  {
    question: "What's the difference between Essential and Ultimate plans?",
    answer: "Essential ($2.99/mo) includes debt tracking, snowball/avalanche strategies, payoff calendar, and exports. Ultimate ($4.99/mo) adds automatic bank sync via Plaid, AI coach insights, advanced analytics, and priority support."
  },
  {
    question: "Can I use Finityo without connecting my bank accounts?",
    answer: "Yes! You can manually enter your debts on any plan. Bank sync via Plaid is optional and only available on the Ultimate plan for users who want automatic balance updates."
  },
  {
    question: "Do you offer a free trial?",
    answer: "Yes! All new users get a 7-day free trial of the Ultimate plan. No credit card required to start. You can explore all features risk-free before deciding which plan works best."
  },
  {
    question: "Can I cancel anytime?",
    answer: "Absolutely. There are no long-term contracts or cancellation fees. You can upgrade, downgrade, or cancel your subscription at any time from your account settings."
  },
  {
    question: "How accurate are the payoff projections?",
    answer: "Our projections are based on your current debt balances, interest rates, minimum payments, and any extra payments you plan to make. The calculations follow standard amortization formulas. Keep your data updated for the most accurate results."
  },
  {
    question: "Can I share my debt payoff plan with others?",
    answer: "Yes! You can generate shareable links with optional PIN protection. Perfect for sharing progress with a financial coach, accountability partner, or family member."
  }
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-24 bg-gradient-to-b from-background to-muted/20">
      <div className="mx-auto max-w-4xl px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground text-lg">
            Everything you need to know about Finityo
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="glass-card border-border overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
              >
                <span className="font-semibold text-foreground pr-4">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-muted-foreground transition-transform flex-shrink-0 ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>
              
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="px-6 pb-4 pt-2 text-muted-foreground">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}