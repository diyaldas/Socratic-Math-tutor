import React, { useMemo } from 'react';
import katex from 'katex';
import { parseMathBlocks } from '../utils/mathParser';

interface MathViewProps {
  content: string;
  className?: string;
}

export const MathView: React.FC<MathViewProps> = ({ content, className = '' }) => {
  const blocks = useMemo(() => parseMathBlocks(content), [content]);

  return (
    <div className={`space-y-2 leading-relaxed ${className}`}>
      {blocks.map((block, index) => {
        if (block.type === 'block-math') {
          let html = '';
          try {
            html = katex.renderToString(block.content, {
              displayMode: true,
              throwOnError: false,
            });
          } catch {
            return (
              <pre
                key={index}
                className="overflow-x-auto p-3 my-2 text-sm bg-amber-50/60 rounded-lg border border-amber-200/60 font-mono-math"
              >
                $${block.content}$$
              </pre>
            );
          }
          return (
            <div
              key={index}
              className="my-3 overflow-x-auto text-center py-2 px-3 bg-stone-50/80 rounded-xl border border-stone-200/80 shadow-xs"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        }

        if (block.type === 'inline-math') {
          let html = '';
          try {
            html = katex.renderToString(block.content, {
              displayMode: false,
              throwOnError: false,
            });
          } catch {
            return (
              <code key={index} className="px-1 py-0.5 text-xs bg-amber-50 rounded font-mono-math">
                ${block.content}$
              </code>
            );
          }
          return (
            <span
              key={index}
              className="inline-block px-1 align-baseline"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        }

        // Standard text, handle paragraphs & newlines
        return (
          <span key={index} className="whitespace-pre-wrap">
            {block.content}
          </span>
        );
      })}
    </div>
  );
};
