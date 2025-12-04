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

// Simple browser-compatible frontmatter parser (no Buffer dependency)
function parseFrontmatter(fileContent: string): { data: Record<string, string>; content: string } {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = fileContent.match(frontmatterRegex);
  
  if (!match) {
    return { data: {}, content: fileContent };
  }
  
  const frontmatterBlock = match[1];
  const content = match[2];
  
  const data: Record<string, string> = {};
  const lines = frontmatterBlock.split('\n');
  
  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      let value = line.slice(colonIndex + 1).trim();
      // Remove surrounding quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      data[key] = value;
    }
  }
  
  return { data, content };
}

export async function loadMarkdownPost(slug: string): Promise<MarkdownPost | null> {
  try {
    const module = await import(`../../content/blog/${slug}.mdx?raw`);
    const fileContent = module.default;
    
    const { data, content } = parseFrontmatter(fileContent);
    
    return {
      slug: data.slug || slug,
      title: data.title || '',
      description: data.description || '',
      date: data.date || '',
      category: data.category || '',
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
  const posts: MarkdownPost[] = [];

  const postSlugs = [
    'snowball-vs-avalanche',
    'how-to-read-your-credit-report',
    '7-mistakes-that-delay-debt-freedom',
    'debt-consolidation-options',
    'debt-payoff-budget-guide',
    'tracking-debt-progress',
    'negotiating-with-creditors',
    'dealing-with-debt-collectors'
  ];

  for (const slug of postSlugs) {
    const post = await loadMarkdownPost(slug);
    if (post) {
      posts.push(post);
    }
  }

  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
