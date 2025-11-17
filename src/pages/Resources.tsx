import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { ArrowLeft, BookOpen, ArrowRight } from "lucide-react";
import { blogPosts } from "@/data/blogPosts";
import { useSmartNavigation } from '@/hooks/useSmartNavigation';
import { BlogCard } from "@/components/blog/BlogCard";
import { useEffect, useState } from "react";
import { loadAllMarkdownPosts, MarkdownPost } from "@/lib/markdownLoader";

const Resources = () => {
  const { goToHome } = useSmartNavigation();
  const navigate = useNavigate();
  const [markdownPosts, setMarkdownPosts] = useState<MarkdownPost[]>([]);

  useEffect(() => {
    loadAllMarkdownPosts().then(setMarkdownPosts);
  }, []);

  // Combine markdown and TSX posts, take top 3
  const allPosts = [
    ...markdownPosts.map(post => ({
      slug: post.slug,
      title: post.title,
      description: post.description,
      date: post.date,
      readTime: post.readTime || "5 min read",
      category: post.category,
      image: post.image,
    })),
    ...blogPosts.slice(0, 3).map(post => ({
      slug: post.slug,
      title: post.title,
      description: post.excerpt,
      date: post.date,
      readTime: post.readTime,
      category: "Article",
      image: "/images/blog-default.png",
    }))
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Resources - Finityo",
    "description": "Educational resources, guides, and expert insights on debt management and financial freedom",
    "url": "https://finityo-debt.com/resources"
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Resources & Learning Center | Finityo"
        description="Access free guides, articles, and expert insights on debt payoff strategies, financial planning, and achieving financial freedom."
        canonical="https://finityo-debt.com/resources"
        structuredData={structuredData}
      />

      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <Button
          variant="ghost"
          onClick={goToHome}
          className="mb-8"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <header className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 mb-4 text-primary">
            <BookOpen className="w-8 h-8" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Resources & Learning Center
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Expert guides and insights to help you master your debt payoff journey
          </p>
        </header>

        {/* Latest from the Blog Section */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-foreground">Latest from the Blog</h2>
            <Button
              variant="ghost"
              onClick={() => navigate('/blog')}
              className="gap-2"
            >
              View All Articles
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
        </section>

        {/* Quick Start Guides */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-8">Quick Start Guides</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-card rounded-xl p-6 border border-border hover:shadow-vibrant transition-all">
              <h3 className="text-xl font-semibold text-foreground mb-3">Getting Started</h3>
              <p className="text-muted-foreground mb-4">
                New to debt payoff planning? Start here to learn the basics and create your first plan.
              </p>
              <Button onClick={() => navigate('/demo/start')} className="w-full">
                Try Interactive Demo
              </Button>
            </div>

            <div className="bg-gradient-card rounded-xl p-6 border border-border hover:shadow-vibrant transition-all">
              <h3 className="text-xl font-semibold text-foreground mb-3">Choose Your Strategy</h3>
              <p className="text-muted-foreground mb-4">
                Learn about Snowball, Avalanche, and AI Hybrid methods to find what works for you.
              </p>
              <Button 
                variant="outline" 
                onClick={() => navigate('/blog/snowball-vs-avalanche-method')}
                className="w-full"
              >
                Compare Methods
              </Button>
            </div>
          </div>
        </section>

        {/* Tools & Features */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-8">Tools & Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card border border-border rounded-xl p-6 hover:shadow-vibrant transition-all">
              <h3 className="text-lg font-semibold text-foreground mb-2">Debt Calculator</h3>
              <p className="text-muted-foreground text-sm">
                Calculate your debt-free date and total interest savings with our free calculator.
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 hover:shadow-vibrant transition-all">
              <h3 className="text-lg font-semibold text-foreground mb-2">Plaid Integration</h3>
              <p className="text-muted-foreground text-sm">
                Securely connect your accounts and automatically sync your debt balances.
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 hover:shadow-vibrant transition-all">
              <h3 className="text-lg font-semibold text-foreground mb-2">AI Insights</h3>
              <p className="text-muted-foreground text-sm">
                Get personalized recommendations and coaching to optimize your payoff strategy.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-card rounded-xl p-8 text-center border border-border">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Ready to Start Your Journey?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Join thousands who have taken control of their debt with Finityo's proven strategies and tools.
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate('/auth?mode=signup')}
            >
              Get Started Free
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/pricing')}
            >
              View Pricing
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Resources;
