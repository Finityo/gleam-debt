import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { blogPosts } from "@/data/blogPosts";

const BlogPost = () => {
  const navigate = useNavigate();
  const { slug } = useParams();
  
  const post = blogPosts.find(p => p.slug === slug);

  if (!post) {
    navigate('/blog');
    return null;
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.excerpt,
    "datePublished": post.datePublished,
    "author": {
      "@type": "Organization",
      "name": "Finityo"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Finityo",
      "logo": {
        "@type": "ImageObject",
        "url": "https://finityo-debt.com/og-image.jpg"
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${post.title} - Finityo Blog`}
        description={post.excerpt}
        canonical={`https://finityo-debt.com/blog/${post.slug}`}
        structuredData={structuredData}
        ogType="article"
      />

      <article className="container mx-auto px-4 py-12 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/blog')}
          className="mb-8"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Blog
        </Button>

        <header className="mb-8">
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
            {post.title}
          </h1>
          
          <div className="flex items-center gap-4 text-muted-foreground mb-6">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{post.date}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{post.readTime}</span>
            </div>
          </div>
        </header>

        <div className="prose prose-lg max-w-none dark:prose-invert">
          {post.content}
        </div>

        <footer className="mt-12 pt-8 border-t border-border">
          <div className="bg-gradient-card rounded-xl p-8 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Ready to Start Your Debt-Free Journey?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Create your personalized debt payoff plan in minutes with Finityo's free tools
            </p>
            <Button
              size="lg"
              onClick={() => navigate('/auth?mode=signup')}
              className="gap-2"
            >
              Get Started Free
            </Button>
          </div>
        </footer>
      </article>
    </div>
  );
};

export default BlogPost;
