'use client';

import React from 'react';

// Pure SVG trend icons with currentColor
const TrendUpSvg = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }}>
    <path d="M6 2L10 6H7V10H5V6H2L6 2Z" fill="currentColor" />
  </svg>
);

const TrendDownSvg = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }}>
    <path d="M6 10L2 6H5V2H7V6H10L6 10Z" fill="currentColor" />
  </svg>
);

interface IosMarkdownRendererProps {
  content: string;
}

/**
 * Parses inline Markdown:
 * - **bold** -> <strong>
 * - *italic* -> <em>
 * - `code` -> <code>
 * - Percentage / trend indicators (+X.XX%, -X.XX%)
 */
function renderInline(text: string): React.ReactNode {
  // Regex to tokenize bold, code, percentages, etc.
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*.*?\*\*|`.*?`|\+[0-9]+(?:\.[0-9]+)?%|-[0-9]+(?:\.[0-9]+)?%)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={match.index} style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code
          key={match.index}
          style={{
            background: 'var(--card-sub-bg, rgba(255,255,255,0.08))',
            border: '1px solid var(--glass-border, rgba(255,255,255,0.12))',
            padding: '2px 6px',
            borderRadius: '6px',
            fontSize: '0.85em',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            color: 'var(--accent-blue)',
          }}
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('+')) {
      parts.push(
        <span
          key={match.index}
          style={{
            color: 'var(--accent-positive, #34c759)',
            fontWeight: 700,
            fontVariantNumeric: 'tabular-nums',
            display: 'inline-flex',
            alignItems: 'center',
          }}
        >
          <TrendUpSvg />
          {token}
        </span>
      );
    } else if (token.startsWith('-')) {
      parts.push(
        <span
          key={match.index}
          style={{
            color: 'var(--accent-negative, #ff3b30)',
            fontWeight: 700,
            fontVariantNumeric: 'tabular-nums',
            display: 'inline-flex',
            alignItems: 'center',
          }}
        >
          <TrendDownSvg />
          {token}
        </span>
      );
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

export const IosMarkdownRenderer: React.FC<IosMarkdownRendererProps> = ({ content }) => {
  if (!content) return null;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
  let codeBlockLang = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Handle Code Blocks
    if (line.trim().startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeBlockLang = line.trim().slice(3);
        codeBlockContent = [];
      } else {
        inCodeBlock = false;
        elements.push(
          <pre
            key={`code_${i}`}
            style={{
              background: 'var(--card-sub-bg, rgba(0,0,0,0.4))',
              border: '1px solid var(--glass-border, rgba(255,255,255,0.1))',
              borderRadius: '12px',
              padding: '12px 16px',
              overflowX: 'auto',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              fontSize: '0.82rem',
              lineHeight: 1.5,
              margin: '10px 0',
              color: 'var(--text-primary)',
            }}
          >
            <code>{codeBlockContent.join('\n')}</code>
          </pre>
        );
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    const trimmed = line.trim();

    if (!trimmed) {
      elements.push(<div key={`empty_${i}`} style={{ height: '8px' }} />);
      continue;
    }

    // Header 1: # Header
    if (trimmed.startsWith('# ')) {
      elements.push(
        <h1
          key={`h1_${i}`}
          style={{
            fontSize: '1.35rem',
            fontWeight: 800,
            letterSpacing: '-0.5px',
            color: 'var(--text-primary)',
            margin: '14px 0 6px 0',
          }}
        >
          {renderInline(trimmed.slice(2))}
        </h1>
      );
      continue;
    }

    // Header 2: ## Header
    if (trimmed.startsWith('## ')) {
      elements.push(
        <h2
          key={`h2_${i}`}
          style={{
            fontSize: '1.15rem',
            fontWeight: 700,
            letterSpacing: '-0.4px',
            color: 'var(--text-primary)',
            margin: '12px 0 6px 0',
          }}
        >
          {renderInline(trimmed.slice(3))}
        </h2>
      );
      continue;
    }

    // Header 3: ### Header
    if (trimmed.startsWith('### ')) {
      elements.push(
        <h3
          key={`h3_${i}`}
          style={{
            fontSize: '0.98rem',
            fontWeight: 700,
            letterSpacing: '-0.3px',
            color: 'var(--text-primary)',
            margin: '10px 0 4px 0',
          }}
        >
          {renderInline(trimmed.slice(4))}
        </h3>
      );
      continue;
    }

    // Horizontal Rule: ---
    if (trimmed === '---' || trimmed === '***') {
      elements.push(
        <hr
          key={`hr_${i}`}
          style={{
            border: 'none',
            borderTop: '1px solid var(--glass-border, rgba(255,255,255,0.08))',
            margin: '12px 0',
          }}
        />
      );
      continue;
    }

    // Bullet List Item: - item or * item
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      elements.push(
        <div
          key={`li_${i}`}
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '8px',
            margin: '4px 0',
            fontSize: '0.88rem',
            lineHeight: 1.55,
            color: 'var(--text-primary)',
          }}
        >
          <span
            style={{
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              background: 'var(--accent-blue, #007aff)',
              flexShrink: 0,
              transform: 'translateY(-2px)',
            }}
          />
          <span style={{ flex: 1 }}>{renderInline(trimmed.slice(2))}</span>
        </div>
      );
      continue;
    }

    // Numbered List: 1. item
    const numMatch = trimmed.match(/^([0-9]+)\.\s+(.*)$/);
    if (numMatch) {
      elements.push(
        <div
          key={`num_${i}`}
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '8px',
            margin: '4px 0',
            fontSize: '0.88rem',
            lineHeight: 1.55,
            color: 'var(--text-primary)',
          }}
        >
          <span
            style={{
              fontWeight: 800,
              fontSize: '0.78rem',
              color: 'var(--accent-blue, #007aff)',
              fontVariantNumeric: 'tabular-nums',
              minWidth: '16px',
            }}
          >
            {numMatch[1]}.
          </span>
          <span style={{ flex: 1 }}>{renderInline(numMatch[2])}</span>
        </div>
      );
      continue;
    }

    // Blockquote: > text
    if (trimmed.startsWith('> ')) {
      elements.push(
        <div
          key={`quote_${i}`}
          style={{
            borderLeft: '3px solid var(--accent-blue, #007aff)',
            paddingLeft: '12px',
            margin: '8px 0',
            fontStyle: 'italic',
            color: 'var(--text-secondary, #94a3b8)',
            fontSize: '0.85rem',
          }}
        >
          {renderInline(trimmed.slice(2))}
        </div>
      );
      continue;
    }

    // Regular Paragraph
    elements.push(
      <p
        key={`p_${i}`}
        style={{
          margin: '5px 0',
          fontSize: '0.88rem',
          lineHeight: 1.6,
          color: 'var(--text-primary)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {renderInline(line)}
      </p>
    );
  }

  return <div className="ios-markdown-body">{elements}</div>;
};
