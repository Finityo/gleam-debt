import { useEffect, useState } from "react";
import { SEOHead } from "@/components/SEOHead";
import { BlogCard } from "@/components/blog/BlogCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { blogPosts } from "@/data/blogPosts";
import { loadAllMarkdownPosts, MarkdownPost } from "@/lib/markdownLoader";

// Import blog thumbnail images - MDX posts
import snowballVsAvalancheImg from "@/assets/blog/snowball-vs-avalanche.jpg";
import creditReportGuideImg from "@/assets/blog/credit-report-guide.jpg";
import debtMistakesImg from "@/assets/blog/debt-mistakes.jpg";
import debtConsolidationImg from "@/assets/blog/debt-consolidation.jpg";
import budgetGuideImg from "@/assets/blog/budget-guide.jpg";
import trackingProgressImg from "@/assets/blog/tracking-progress.jpg";

// Import blog thumbnail images - TSX posts
import debtPayoffPlanImg from "@/assets/blog/debt-payoff-plan.jpg";
import aprInterestRatesImg from "@/assets/blog/apr-interest-rates.jpg";
import psychologySmallWinsImg from "@/assets/blog/psychology-small-wins.jpg";
import emergencyFundImg from "@/assets/blog/emergency-fund.jpg";
import balanceTransferImg from "@/assets/blog/balance-transfer.jpg";
import sideHustleImg from "@/assets/blog/side-hustle.jpg";
import motivationStrategiesImg from "@/assets/blog/motivation-strategies.jpg";
import creditScoreImg from "@/assets/blog/credit-score.jpg";
import preventingRelapseImg from "@/assets/blog/preventing-relapse.jpg";
import automationImg from "@/assets/blog/automation.jpg";
import windfallsBonusesImg from "@/assets/blog/windfalls-bonuses.jpg";
import snowballAvalancheMethodImg from "@/assets/blog/snowball-avalanche-method.jpg";

// Map slugs to imported images
const blogImages: Record<string, string> = {
  // MDX posts
  "snowball-vs-avalanche": snowballVsAvalancheImg,
  "how-to-read-your-credit-report": creditReportGuideImg,
  "7-mistakes-that-delay-debt-freedom": debtMistakesImg,
  "debt-consolidation-options": debtConsolidationImg,
  "debt-payoff-budget-guide": budgetGuideImg,
  "tracking-debt-progress": trackingProgressImg,
  // TSX posts
  "snowball-vs-avalanche-method": snowballAvalancheMethodImg,
  "create-debt-payoff-plan-5-steps": debtPayoffPlanImg,
  "understanding-apr-interest-rates": aprInterestRatesImg,
  "psychology-of-debt-small-wins": psychologySmallWinsImg,
  "emergency-fund-while-paying-debt": emergencyFundImg,
  "balance-transfer-strategy-guide": balanceTransferImg,
  "side-hustle-debt-payoff-acceleration": sideHustleImg,
  "debt-free-date-motivation-strategies": motivationStrategiesImg,
  "credit-score-during-debt-payoff": creditScoreImg,
  "preventing-debt-relapse": preventingRelapseImg,
  "automating-debt-payoff-success": automationImg,
  "debt-payoff-windfalls-bonuses": windfallsBonusesImg,
};

export default function BlogList() {
  const navigate = useNavigate();
  const [markdownPosts, setMarkdownPosts] = useState<MarkdownPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllMarkdownPosts()
      .then(setMarkdownPosts)
      .finally(() => setLoading(false));
  }, []);

  // Combine markdown posts with TSX posts for fallback
  const allPosts = [
    ...markdownPosts.map(post => ({
      slug: post.slug,
      title: post.title,
      description: post.description,
      date: post.date,
      readTime: post.readTime || "5 min read",
      category: post.category,
      image: blogImages[post.slug] || post.image,
      source: 'markdown' as const,
    })),
    ...blogPosts.map(post => ({
      slug: post.slug,
      title: post.title,
      description: post.excerpt,
      date: post.date,
      readTime: post.readTime,
      category: "Article",
      image: blogImages[post.slug],
      source: 'tsx' as const,
    }))
  ].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Blog - Finityo"
        description="Tips, strategies, and insights for achieving debt freedom faster. Learn about snowball vs avalanche methods, credit management, and more."
        canonical="https://finityo-debt.com/blog"
      />

      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-8"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <header className="mb-12 text-center animate-fade-in">
          <h1 className="text-4xl lg:text-5xl font-bold text-finityo-textMain mb-4">
            Finityo Blog
          </h1>
          <p className="text-lg text-finityo-textBody max-w-2xl mx-auto">
            Tips, strategies, and insights for achieving debt freedom faster
          </p>
        </header>

        {loading ? (
          <div className="text-center text-finityo-textBody">
            Loading posts...
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {allPosts.map((post) => (
              <BlogCard
                key={post.slug}
                slug={post.slug}
                title={post.title}
                description={post.description}
                date={post.date}
                readTime={post.readTime}
                category={post.category}
                image={post.image}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
