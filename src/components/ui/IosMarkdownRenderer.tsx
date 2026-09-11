'use client';

import React, { useMemo } from 'react';
import { convertMarkdownToHtml } from '@/utils/markdownToHtml';

interface IosMarkdownRendererProps {
  content: string;
}

export const IosMarkdownRenderer: React.FC<IosMarkdownRendererProps> = React.memo(({ content }) => {
  if (!content) return null;

  const html = useMemo(() => {
    return convertMarkdownToHtml(content);
  }, [content]);

  return (
    <div
      className="ios-markdown-body"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
});

IosMarkdownRenderer.displayName = 'IosMarkdownRenderer';
