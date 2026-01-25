import React from "react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

type Props = {
  content: string;
  className?: string;
};

export function MarkdownTooltip({ content, className }: Props) {
  return (
    <div className={cn("space-y-2", className)}>
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="leading-relaxed">{children}</p>,
          strong: ({ children }) => (
            <span className="font-bold">{children}</span>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-4 space-y-1">{children}</ul>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          code: ({ children }) => (
            <code className="block bg-slate-800 text-slate-100 p-2 rounded font-mono text-[0.85em] my-1">
              {children}
            </code>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
