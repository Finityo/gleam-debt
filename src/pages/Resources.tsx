import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { blogPosts } from "@/data/blogPosts";
import { ArrowLeft, BookOpen, Download, FileText, Calendar, ArrowRight, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Category = "all" | "blog" | "guides" | "tools";

const guides = [
  {
    id: 1,
    title: "Complete Debt Payoff Guide",
    description: "Everything you need to know about paying off debt, from strategies to psychological tips.",
    category: "guides" as const,
    downloadUrl: "#",
    size: "2.4 MB"
  },
  {
    id: 2,
    title: "Understanding Credit Scores",
    description: "Learn how debt impacts your credit and how to rebuild it while paying off debt.",
    category: "guides" as const,
    downloadUrl: "#",
    size: "1.8 MB"
  },
  {
    id: 3,
    title: "Budgeting Basics Workbook",
    description: "A practical workbook to help you create and stick to a debt payoff budget.",
    category: "guides" as const,
    downloadUrl: "#",
    size: "3.1 MB"
  }
];

const tools = [
  {
    id: 1,
    title: "Debt Snowball Spreadsheet",
    description: "Excel template to track your debt snowball progress manually.",
    category: "tools" as const,
    downloadUrl: "#",
    size: "125 KB"
  },
  {
    id: 2,
    title: "Monthly Budget Planner",
    description: "Printable monthly budget template to track income and expenses.",
    category: "tools" as const,
    downloadUrl: "#",
    size: "890 KB"
  },
  {
    id: 3,
    title: "Debt Payment Tracker",
    description: "Visual tracker to mark off debt payments and celebrate progress.",
    category: "tools" as const,
    downloadUrl: "#",
    size: "450 KB"
  }
];

export default function Resources() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<Category>("all");

  const filteredBlogPosts = activeCategory === "all" || activeCategory === "blog" ? blogPosts : [];
  const filteredGuides = activeCategory === "all" || activeCategory === "guides" ? guides : [];
  const filteredTools = activeCategory === "all" || activeCategory === "tools" ? tools : [];

  const hasContent = filteredBlogPosts.length > 0 || filteredGuides.length > 0 || filteredTools.length > 0;

  return (
    <PageShell>
      <div className="min-h-screen py-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-8 -ml-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>

          {/* Header */}
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
              <BookOpen className="w-4 h-4" />
              <span className="text-sm font-medium">Learn & Grow</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Resource Hub
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Everything you need to master debt payoff and achieve financial freedom.
            </p>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            <Button
              variant={activeCategory === "all" ? "default" : "outline"}
              onClick={() => setActiveCategory("all")}
              className="gap-2"
            >
              <Filter className="w-4 h-4" />
              All Resources
            </Button>
            <Button
              variant={activeCategory === "blog" ? "default" : "outline"}
              onClick={() => setActiveCategory("blog")}
              className="gap-2"
            >
              <FileText className="w-4 h-4" />
              Blog Posts
            </Button>
            <Button
              variant={activeCategory === "guides" ? "default" : "outline"}
              onClick={() => setActiveCategory("guides")}
              className="gap-2"
            >
              <BookOpen className="w-4 h-4" />
              Guides
            </Button>
            <Button
              variant={activeCategory === "tools" ? "default" : "outline"}
              onClick={() => setActiveCategory("tools")}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Tools
            </Button>
          </div>

          {!hasContent && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No resources found in this category.</p>
            </div>
          )}

          {/* Blog Posts Section */}
          {filteredBlogPosts.length > 0 && (
            <div className="mb-16">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <FileText className="w-6 h-6 text-primary" />
                Latest Articles
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBlogPosts.map((post) => (
                  <div
                    key={post.slug}
                    className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6 hover:shadow-lg transition-all group cursor-pointer"
                    onClick={() => navigate(`/blog/${post.slug}`)}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <Badge variant="secondary" className="bg-primary/10 text-primary">
                        Debt Payoff
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                        <Calendar className="w-3 h-3" />
                        {post.date}
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center text-primary text-sm font-medium group-hover:gap-2 transition-all">
                      Read More
                      <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Guides Section */}
          {filteredGuides.length > 0 && (
            <div className="mb-16">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-primary" />
                Comprehensive Guides
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredGuides.map((guide) => (
                  <div
                    key={guide.id}
                    className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6 hover:shadow-lg transition-all group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <FileText className="w-6 h-6 text-primary" />
                      </div>
                      <span className="text-xs text-muted-foreground">{guide.size}</span>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">
                      {guide.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      {guide.description}
                    </p>
                    <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Download className="w-4 h-4 mr-2" />
                      Download PDF
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tools Section */}
          {filteredTools.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <Download className="w-6 h-6 text-primary" />
                Downloadable Tools
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTools.map((tool) => (
                  <div
                    key={tool.id}
                    className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6 hover:shadow-lg transition-all group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <FileText className="w-6 h-6 text-primary" />
                      </div>
                      <span className="text-xs text-muted-foreground">{tool.size}</span>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">
                      {tool.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      {tool.description}
                    </p>
                    <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
