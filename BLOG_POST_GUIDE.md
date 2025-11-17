# Finityo Blog Post Guide

This guide shows you how to add blog posts using **TWO methods**: TSX (TypeScript/JSX) or Markdown.

---

## Method 1: TSX Format (Current System)

### Step 1: Open `src/data/blogPosts.tsx`

### Step 2: Add your post to the `blogPosts` array:

```typescript
{
  slug: "your-url-slug",
  title: "Your Post Title",
  excerpt: "Brief 150-200 character description for cards and SEO",
  date: "Nov 16, 2025",
  datePublished: "2025-11-16",
  readTime: "5 min read",
  icon: TrendingDown, // Choose from available icons
  content: (
    <>
      <p>
        Your introduction paragraph here. Use proper quote escaping.
      </p>

      <h2>Main Section Heading</h2>
      <p>
        Content here. Use <strong>bold</strong> and <em>italics</em> as needed.
      </p>

      <h3>Subsection</h3>
      <ul>
        <li>Bullet point one</li>
        <li>Bullet point two</li>
        <li>Bullet point three</li>
      </ul>

      <blockquote>
        <p>Important callout or quote goes here</p>
      </blockquote>

      <h2>Another Section</h2>
      <ol>
        <li>Numbered step one</li>
        <li>Numbered step two</li>
        <li>Numbered step three</li>
      </ol>

      <h2>Conclusion</h2>
      <p>
        Final thoughts and call to action.
      </p>
    </>
  )
}
```

### Available Icons:
- `TrendingDown` - Debt reduction
- `TrendingUp` - Progress/growth
- `Target` - Goals
- `Brain` - Strategy/thinking
- `DollarSign` - Money/finances
- `Shield` - Protection/security
- `Zap` - Speed/efficiency
- `CreditCard` - Credit cards
- `Calendar` - Scheduling
- `Repeat` - Recurring/cycles
- `Gift` - Bonuses/rewards
- `AlertCircle` - Warnings/alerts

### IMPORTANT: Quote Escaping
```typescript
// ❌ WRONG - Will cause build error
content: (<p>Don't do this</p>)

// ✅ CORRECT - Use double quotes for strings with apostrophes
content: (<p>Don{"'"}t do this</p>)
// OR
content: (<p>{"Don't do this"}</p>)
```

---

## Method 2: Markdown Format (New System)

### Step 1: Create a new markdown file in `src/data/blog/`

Example: `src/data/blog/my-new-post.md`

```markdown
---
slug: my-new-post
title: Your Post Title
excerpt: Brief 150-200 character description for cards and SEO
date: Nov 16, 2025
datePublished: 2025-11-16
readTime: 5 min read
icon: TrendingDown
category: Strategies
---

Your introduction paragraph here.

## Main Section Heading

Content here. Use **bold** and *italics* as needed.

### Subsection

- Bullet point one
- Bullet point two
- Bullet point three

> Important callout or quote goes here

## Another Section

1. Numbered step one
2. Numbered step two
3. Numbered step three

## Conclusion

Final thoughts and call to action.
```

### Step 2: Register your markdown post in `src/data/markdownBlogPosts.ts`

```typescript
import myNewPost from './blog/my-new-post.md?raw';

export const markdownPosts = [
  // ... existing posts
  myNewPost,
];
```

### Markdown Features Supported:
- ✅ Headings (H1-H6)
- ✅ Bold and italic text
- ✅ Bullet lists and numbered lists
- ✅ Blockquotes
- ✅ Links
- ✅ Inline code and code blocks
- ✅ Tables (GitHub-flavored markdown)
- ✅ Frontmatter metadata

---

## Which Method Should You Use?

### Use **TSX Format** when:
- You need custom React components in your post
- You want full control over styling and layout
- You need interactive elements

### Use **Markdown Format** when:
- You want simple, fast content creation
- You're familiar with markdown
- You don't need custom components
- You want to write in a standard format

---

## Blog Post Checklist

Before publishing, make sure:

- [ ] Slug is unique and URL-friendly (lowercase, hyphens)
- [ ] Title is clear and under 60 characters (SEO)
- [ ] Excerpt is 150-200 characters
- [ ] Date format matches existing posts
- [ ] Icon is imported and appropriate
- [ ] Content is well-structured with headings
- [ ] Quotes are properly escaped (TSX only)
- [ ] Links work correctly
- [ ] Post appears in blog list
- [ ] Post opens correctly at `/blog/your-slug`

---

## Testing Your Post

1. Navigate to `/blog` - Your post should appear in the list
2. Click on your post - It should open at `/blog/your-slug`
3. Check formatting, links, and images
4. Test on mobile view
5. Verify SEO meta tags in browser dev tools

---

## Need Help?

- Check existing posts in `src/data/blogPosts.tsx` for examples
- Review `src/data/blog/example-markdown-post.md` for markdown reference
- Ensure all dependencies are installed (`react-markdown`, `gray-matter`, `remark-gfm`)
