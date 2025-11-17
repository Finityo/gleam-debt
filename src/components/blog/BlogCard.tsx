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
      {image && (
        <div className="aspect-video overflow-hidden bg-muted">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      )}
      
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
