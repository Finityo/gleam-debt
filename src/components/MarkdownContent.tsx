import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownContentProps {
  content: string;
}

export const MarkdownContent = ({ content }: MarkdownContentProps) => {
  return (
    <div className="prose prose-lg max-w-none dark:prose-invert">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
        // Customize heading rendering
        h1: ({ children }) => (
          <h1 className="text-4xl font-bold text-foreground mb-6 mt-8">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-3xl font-bold text-foreground mb-4 mt-8">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-2xl font-semibold text-foreground mb-3 mt-6">{children}</h3>
        ),
        // Customize paragraph rendering
        p: ({ children }) => (
          <p className="text-foreground/90 mb-4 leading-relaxed">{children}</p>
        ),
        // Customize link rendering
        a: ({ href, children }) => (
          <a
            href={href}
            className="text-primary hover:text-primary/80 underline transition-colors"
            target={href?.startsWith('http') ? '_blank' : undefined}
            rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
          >
            {children}
          </a>
        ),
        // Customize list rendering
        ul: ({ children }) => (
          <ul className="list-disc list-inside mb-4 space-y-2 text-foreground/90">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside mb-4 space-y-2 text-foreground/90">{children}</ol>
        ),
        // Customize blockquote rendering
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-primary/50 pl-4 py-2 my-6 bg-primary/5 rounded-r text-foreground/80 italic">
            {children}
          </blockquote>
        ),
        // Customize code rendering
        code: ({ className, children }) => {
          const isInline = !className;
          if (isInline) {
            return (
              <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-primary">
                {children}
              </code>
            );
          }
          return (
            <code className={`${className} block bg-muted p-4 rounded-lg overflow-x-auto text-sm`}>
              {children}
            </code>
          );
        },
        // Customize table rendering
        table: ({ children }) => (
          <div className="overflow-x-auto my-6">
            <table className="min-w-full border-collapse border border-border">
              {children}
            </table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border border-border bg-muted px-4 py-2 text-left font-semibold text-foreground">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border border-border px-4 py-2 text-foreground/90">{children}</td>
        ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
