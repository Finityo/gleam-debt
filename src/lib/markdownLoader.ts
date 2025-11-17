import matter from 'gray-matter';

export interface MarkdownPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  category: string;
  image?: string;
  readTime?: string;
  content: string;
}

// This function would typically use dynamic imports or a bundler plugin
// For now, we'll manually import the markdown files
const markdownFiles: Record<string, string> = {};

export async function loadMarkdownPost(slug: string): Promise<MarkdownPost | null> {
  try {
    // In a real implementation, this would dynamically import markdown files
    // For now, we'll return null and fall back to TSX posts
    const fileContent = markdownFiles[slug];
    if (!fileContent) return null;

    const { data, content } = matter(fileContent);
    
    return {
      slug: data.slug || slug,
      title: data.title,
      description: data.description,
      date: data.date,
      category: data.category,
      image: data.image,
      readTime: data.readTime,
      content,
    };
  } catch (error) {
    console.error(`Error loading markdown post: ${slug}`, error);
    return null;
  }
}

export async function loadAllMarkdownPosts(): Promise<MarkdownPost[]> {
  // This would typically scan the content/blog directory
  // For now, we'll manually define the posts we created
  const posts: MarkdownPost[] = [];

  const postSlugs = [
    'snowball-vs-avalanche',
    'how-to-read-your-credit-report',
    '7-mistakes-that-delay-debt-freedom'
  ];

  for (const slug of postSlugs) {
    try {
      // Import the markdown content
      const module = await import(`../../content/blog/${slug}.mdx?raw`);
      const fileContent = module.default;
      
      const { data, content } = matter(fileContent);
      
      posts.push({
        slug: data.slug || slug,
        title: data.title,
        description: data.description,
        date: data.date,
        category: data.category,
        image: data.image,
        readTime: data.readTime,
        content,
      });
    } catch (error) {
      console.error(`Error loading markdown post: ${slug}`, error);
    }
  }

  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
