import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { ArrowLeft, Calendar, Clock, ArrowRight } from "lucide-react";
import { blogPosts } from "@/data/blogPosts";
import { useSmartNavigation } from '@/hooks/useSmartNavigation';

const Blog = () => {
  const { goToHome } = useSmartNavigation();
  const navigate = useNavigate();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "Finityo Debt Management Blog",
    "description": "Expert advice on debt payoff strategies, financial freedom, and money management",
    "url": "https://finityo-debt.com/blog"
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Debt Management Blog | Expert Financial Advice - Finityo"
        description="Learn proven debt payoff strategies, compare snowball vs avalanche methods, and get expert tips for achieving financial freedom."
        canonical="https://finityo-debt.com/blog"
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

        <header className="mb-12">
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Debt Management Blog
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Expert advice and strategies to help you achieve financial freedom faster
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post) => (
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

                <h2 className="text-xl font-semibold text-foreground mb-3 group-hover:text-primary transition-colors">
                  {post.title}
                </h2>

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
      </div>
    </div>
  );
};

export default Blog;
