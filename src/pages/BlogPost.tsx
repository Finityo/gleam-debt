import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { blogPosts } from "@/data/blogPosts";
import { useEffect, useState } from "react";
import { loadMarkdownPost, MarkdownPost } from "@/lib/markdownLoader";
import { MDXRenderer } from "@/components/blog/MDXRenderer";

const BlogPost = () => {
  const navigate = useNavigate();
  const { slug } = useParams();
  const [markdownPost, setMarkdownPost] = useState<MarkdownPost | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!slug) return;
    
    loadMarkdownPost(slug)
      .then(setMarkdownPost)
      .finally(() => setLoading(false));
  }, [slug]);

  // Try markdown first, then fall back to TSX posts
  const tsxPost = blogPosts.find(p => p.slug === slug);
  const post = markdownPost || tsxPost;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12 text-center">
          <p className="text-finityo-textBody">Loading...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12 max-w-4xl text-center">
          <h1 className="text-3xl font-bold text-finityo-textMain mb-4">Post Not Found</h1>
          <p className="text-finityo-textBody mb-8">The blog post you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/blog')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Blog
          </Button>
        </div>
      </div>
    );
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": markdownPost?.title || tsxPost?.title,
    "description": markdownPost?.description || tsxPost?.excerpt,
    "datePublished": markdownPost?.date || tsxPost?.datePublished,
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
        title={`${markdownPost?.title || tsxPost?.title} - Finityo Blog`}
        description={markdownPost?.description || tsxPost?.excerpt || ""}
        canonical={`https://finityo-debt.com/blog/${slug}`}
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
          {markdownPost?.category && (
            <div className="mb-4">
              <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-primary/10 text-primary border border-primary/20">
                {markdownPost.category}
              </span>
            </div>
          )}
          
          <h1 className="text-4xl lg:text-5xl font-bold text-finityo-textMain mb-6">
            {markdownPost?.title || tsxPost?.title}
          </h1>
          
          <div className="flex items-center gap-4 text-muted-foreground mb-6">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{markdownPost?.date || tsxPost?.date}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{markdownPost?.readTime || tsxPost?.readTime}</span>
            </div>
          </div>
        </header>

        {markdownPost ? (
          <MDXRenderer content={markdownPost.content} />
        ) : tsxPost ? (
          <div className="prose prose-lg max-w-none dark:prose-invert prose-headings:text-finityo-textMain prose-p:text-finityo-textBody prose-a:text-primary prose-strong:text-finityo-textMain">
            {tsxPost.content}
          </div>
        ) : null}

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
