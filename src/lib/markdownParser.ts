import matter from 'gray-matter';
import { LucideIcon } from 'lucide-react';
import * as Icons from 'lucide-react';

export interface MarkdownPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  datePublished: string;
  readTime: string;
  icon: LucideIcon;
  content: string;
  category?: string;
}

const iconMap: Record<string, LucideIcon> = {
  TrendingDown: Icons.TrendingDown,
  TrendingUp: Icons.TrendingUp,
  Target: Icons.Target,
  Brain: Icons.Brain,
  DollarSign: Icons.DollarSign,
  Shield: Icons.Shield,
  Zap: Icons.Zap,
  CreditCard: Icons.CreditCard,
  Calendar: Icons.Calendar,
  Repeat: Icons.Repeat,
  Gift: Icons.Gift,
  AlertCircle: Icons.AlertCircle,
};

export function parseMarkdownPost(markdownContent: string): MarkdownPost {
  const { data, content } = matter(markdownContent);

  return {
    slug: data.slug || '',
    title: data.title || 'Untitled Post',
    excerpt: data.excerpt || '',
    date: data.date || '',
    datePublished: data.datePublished || '',
    readTime: data.readTime || '5 min read',
    icon: iconMap[data.icon] || Icons.FileText,
    content: content.trim(),
    category: data.category || 'General',
  };
}

export function parseAllMarkdownPosts(markdownFiles: string[]): MarkdownPost[] {
  return markdownFiles.map(parseMarkdownPost);
}
