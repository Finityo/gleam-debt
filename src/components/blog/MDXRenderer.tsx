import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MDXRendererProps {
  content: string;
}

export const MDXRenderer = ({ content }: MDXRendererProps) => {
  return (
    <div className="prose prose-lg max-w-none dark:prose-invert prose-headings:text-finityo-textMain prose-p:text-finityo-textBody prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:text-finityo-textMain prose-code:text-primary prose-code:bg-white/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-white/5 prose-pre:border prose-pre:border-border/50 prose-li:text-finityo-textBody">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  );
};
