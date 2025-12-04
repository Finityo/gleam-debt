import { Calendar, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BlogCardProps {
  slug: string;
  title: string;
  description: string;
  date: string;
  readTime?: string;
  category?: string;
  image?: string;
}

export const BlogCard = ({
  slug,
  title,
  description,
  date,
  readTime,
  category,
  image,
}: BlogCardProps) => {
  const navigate = useNavigate();

  return (
    <article
      onClick={() => navigate(`/blog/${slug}`)}
      className="glass rounded-xl border border-border/50 overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_40px_hsl(var(--primary)/0.2)] group"
    >
      <div className="aspect-video overflow-hidden bg-muted relative">
        {image ? (
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 via-primary/10 to-background">
            <div className="text-center p-4">
              <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-primary/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <span className="text-xs text-muted-foreground font-medium">Finityo Blog</span>
            </div>
          </div>
        )}
      </div>
      
      <div className="p-6">
        {category && (
          <div className="mb-3">
            <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-primary/10 text-primary border border-primary/20">
              {category}
            </span>
          </div>
        )}
        
        <h3 className="text-xl font-bold text-finityo-textMain mb-3 group-hover:text-primary transition-colors">
          {title}
        </h3>
        
        <p className="text-finityo-textBody text-sm mb-4 line-clamp-2">
          {description}
        </p>
        
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>{date}</span>
          </div>
          {readTime && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>{readTime}</span>
            </div>
          )}
        </div>
      </div>
    </article>
  );
};
