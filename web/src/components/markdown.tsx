import { useEffect, useId, useState, type ReactNode } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import mermaid from 'mermaid';
import { cn } from '@/lib/utils';

export interface MarkdownProps {
  content: string;
  className?: string;
  /** When true, strips the leading "## heading" line (useful when title is shown separately). */
  skipFirstHeading?: boolean;
}

// Initialize mermaid once
let mermaidInitialized = false;
function initMermaid() {
  if (!mermaidInitialized) {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'strict',
    });
    mermaidInitialized = true;
  }
}

/** Render a mermaid diagram source string into an SVG. */
function MermaidDiagram({ chart }: { chart: string }) {
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');

  useEffect(() => {
    let cancelled = false;
    initMermaid();

    const renderId = `mermaid-${id}`;
    mermaid
      .render(renderId, chart)
      .then((result) => {
        if (!cancelled) {
          setSvg(result.svg);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [chart, id]);

  if (error) {
    return (
      <pre className="my-4 overflow-x-auto rounded-md border border-destructive/40 bg-destructive/5 p-4 font-mono text-sm text-destructive">
        {chart}
      </pre>
    );
  }

  if (!svg) {
    return (
      <div className="my-4 flex justify-center overflow-x-auto rounded-md border border-border bg-muted/30 p-4">
        <span className="text-sm text-muted-foreground">Loading diagram...</span>
      </div>
    );
  }

  return (
    <div
      className="my-4 flex justify-center overflow-x-auto rounded-md border border-border bg-muted/30 p-4"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

/** Preprocess content: strip leading "## heading" if skipFirstHeading, convert [^N] to superscript. */
function preprocessContent(content: string, skipFirstHeading?: boolean): string {
  let result = content;

  if (skipFirstHeading) {
    // Remove the first "## Title\n\n" at the start of content
    result = result.replace(/^##\s+.+\n+/, '');
  }

  return result;
}

/** Convert [^N] footnote references to superscript badges since definitions live outside the content. */
function FootnoteRefs({ children }: { children?: ReactNode }) {
  return <sup className="ml-0.5 text-xs text-muted-foreground/80">[{children}]</sup>;
}

const components: Components = {
  h1: ({ children }) => (
    <h1 className="mt-8 mb-4 text-2xl font-bold leading-tight tracking-tight text-foreground first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-6 mb-3 border-b border-border pb-2 text-lg font-semibold leading-tight tracking-tight text-foreground first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-5 mb-2 text-base font-semibold leading-tight text-foreground first:mt-0">
      {children}
    </h3>
  ),
  p: ({ children }) => {
    // Wrap [^N] text nodes in <sup> by post-processing children
    const processed = processFootnoteRefs(children);
    return <p className="my-3 leading-relaxed text-foreground">{processed}</p>;
  },
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  ul: ({ children }) => (
    <ul className="my-3 list-disc space-y-1 pl-6 text-foreground marker:text-muted-foreground">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-3 list-decimal space-y-1 pl-6 text-foreground marker:text-muted-foreground">
      {children}
    </ol>
  ),
  li: ({ children }) => {
    const processed = processFootnoteRefs(children);
    return <li className="pl-1 leading-relaxed">{processed}</li>;
  },
  blockquote: ({ children }) => (
    <blockquote className="my-4 border-l-4 border-primary bg-primary-light px-4 py-2 text-muted-foreground">
      {children}
    </blockquote>
  ),
  a: ({ children, href }) => {
    const isFootnoteReference = href?.startsWith('#user-content-fn-') ?? false;
    const isFootnoteBackReference = href?.startsWith('#user-content-fnref-') ?? false;

    return (
      <a
        href={href}
        className={cn(
          'font-medium text-primary underline decoration-primary/40 underline-offset-2 transition-colors hover:text-primary-hover focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          isFootnoteReference && 'text-xs no-underline',
          isFootnoteBackReference && 'ml-1 no-underline',
        )}
      >
        {children}
      </a>
    );
  },
  sup: ({ children }) => <sup className="ml-0.5 align-super text-xs leading-none">{children}</sup>,
  pre: ({ children }) => (
    <pre className="my-4 overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-sm leading-relaxed text-foreground">
      {children}
    </pre>
  ),
  code: ({ children, className }) => {
    const language = /language-([^\s]+)/.exec(className ?? '')?.[1];

    // Render mermaid diagrams
    if (language === 'mermaid') {
      const chartText = Array.isArray(children) ? children.join('') : String(children);
      return <MermaidDiagram chart={chartText} />;
    }

    return (
      <code
        className={cn(
          'rounded-sm bg-muted px-1.5 py-0.5 font-mono text-[0.9em] text-foreground',
          language && 'block min-w-max bg-transparent p-0 text-sm',
          className,
        )}
      >
        {children}
      </code>
    );
  },
  table: ({ children }) => (
    <div
      className="my-4 overflow-x-auto rounded-md border border-border"
      role="region"
      aria-label="Scrollable table"
      tabIndex={0}
    >
      <table className="w-full min-w-max border-collapse text-left text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-muted text-foreground">{children}</thead>,
  tbody: ({ children }) => <tbody className="divide-y divide-border">{children}</tbody>,
  tr: ({ children }) => <tr className="transition-colors hover:bg-muted/50">{children}</tr>,
  th: ({ children }) => (
    <th className="border-r border-border px-3 py-2 font-semibold last:border-r-0">{children}</th>
  ),
  td: ({ children }) => (
    <td className="border-r border-border px-3 py-2 align-top last:border-r-0">{children}</td>
  ),
  hr: () => <hr className="my-6 border-border" />,
  section: ({ children }) => (
    <section className="mt-8 border-t border-border pt-4 text-xs text-muted-foreground">
      {children}
    </section>
  ),
};

/** Process React children to convert [^N] text into superscript badges. */
function processFootnoteRefs(children: ReactNode): ReactNode {
  if (typeof children === 'string') {
    const parts = children.split(/\[\^(\d+)\]/g);
    if (parts.length === 1) return children;
    const result: ReactNode[] = [];
    parts.forEach((part, i) => {
      if (i % 2 === 0) {
        if (part) result.push(part);
      } else {
        result.push(<FootnoteRefs key={`fn-${i}`}>{part}</FootnoteRefs>);
      }
    });
    return result;
  }

  if (Array.isArray(children)) {
    return children.map((child, i) => {
      if (typeof child === 'string') {
        const processed = processFootnoteRefs(child);
        return <span key={i}>{processed}</span>;
      }
      return child;
    });
  }

  return children;
}

export function Markdown({ content, className, skipFirstHeading }: MarkdownProps) {
  const processed = preprocessContent(content, skipFirstHeading);

  return (
    <div className={cn('min-w-0 text-sm text-foreground', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {processed}
      </ReactMarkdown>
    </div>
  );
}
