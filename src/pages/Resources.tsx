import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { ArrowLeft, BookOpen, ArrowRight, Calendar, Clock } from "lucide-react";
import { blogPosts } from "@/data/blogPosts";
import { useSmartNavigation } from '@/hooks/useSmartNavigation';

const Resources = () => {
  const { goToHome } = useSmartNavigation();
  const navigate = useNavigate();

  // Get the 3 most recent blog posts
  const recentPosts = blogPosts.slice(0, 3);

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
            {recentPosts.map((post) => (
              <article
                key={post.slug}
                className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-vibrant hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
                onClick={() => navigate(`/blog/${post.slug}`)}
              >
                <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <post.icon className="w-16 h-16 text-primary/60" />
                </div>
                
                <div className="p-6">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{post.date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{post.readTime}</span>
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold text-foreground mb-3 group-hover:text-primary transition-colors">
                    {post.title}
                  </h3>

                  <p className="text-muted-foreground mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>

                  <div className="flex items-center text-primary font-medium">
                    Read more
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </article>
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
