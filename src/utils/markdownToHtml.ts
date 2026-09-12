/**
 * Enterprise-Grade Markdown-to-HTML Converter Utility
 * Fully compliant with the SYSTEM SKILL specification:
 * - Complete Headings (H1 to H6)
 * - Advanced Typography: bold, italic, del, links, horizontal rule
 * - Deep nested blockquotes (>, >>)
 * - Lists & Nested Lists (ul, ol)
 * - Code blocks (<pre><code>) with sanitized &lt; and &gt;
 * - Tables (table, thead, tbody, th, td)
 * - Interactive details ([DETAILS: title] ... [/DETAILS])
 */

export function sanitizeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function parseInlineMarkdown(text: string): string {
  let res = text;

  // Inline code: `code`
  res = res.replace(/`([^`]+)`/g, (_m, code) => `<code>${sanitizeHtml(code)}</code>`);

  // Bold: **text** or __text__
  res = res.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  res = res.replace(/__(.+?)__/g, '<strong>$1</strong>');

  // Strikethrough: ~~text~~
  res = res.replace(/~~(.+?)~~/g, '<del>$1</del>');

  // Italic: *text* or _text_
  res = res.replace(/\*([^*]+?)\*/g, '<em>$1</em>');
  res = res.replace(/_([^_]+?)_/g, '<em>$1</em>');

  // Links: [text](url)
  res = res.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  return res;
}

export function convertMarkdownToHtml(md: string): string {
  if (!md) return '';

  const lines = md.split('\n');
  const out: string[] = [];

  let inCodeBlock = false;
  let codeLang = '';
  let codeLines: string[] = [];

  let inList: 'ul' | 'ol' | null = null;
  let inTable = false;
  let tableHeaderParsed = false;

  const closeList = () => {
    if (inList) {
      out.push(`</${inList}>`);
      inList = null;
    }
  };

  const closeTable = () => {
    if (inTable) {
      out.push('</tbody></table>');
      inTable = false;
      tableHeaderParsed = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // ── Code Block handling ──
    if (trimmed.startsWith('```')) {
      if (!inCodeBlock) {
        closeList();
        closeTable();
        inCodeBlock = true;
        codeLang = trimmed.slice(3).trim();
        codeLines = [];
      } else {
        inCodeBlock = false;
        const codeContent = sanitizeHtml(codeLines.join('\n'));
        const langClass = codeLang ? ` class="language-${sanitizeHtml(codeLang)}"` : '';
        out.push(`<pre><code${langClass}>${codeContent}</code></pre>`);
        codeLang = '';
        codeLines = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(rawLine);
      continue;
    }

    // ── Interactive Details: [DETAILS: Title] ... [/DETAILS] ──
    if (trimmed.startsWith('[DETAILS:') && trimmed.endsWith(']')) {
      closeList();
      closeTable();
      const title = trimmed.slice(9, -1).trim();
      out.push(`<details><summary>${parseInlineMarkdown(title)}</summary>`);
      continue;
    }
    if (trimmed === '[/DETAILS]') {
      closeList();
      closeTable();
      out.push('</details>');
      continue;
    }

    // ── Horizontal Rule ──
    if (/^(\-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      closeList();
      closeTable();
      out.push('<hr />');
      continue;
    }

    // ── Headings (H1 to H6) ──
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      closeList();
      closeTable();
      const level = headingMatch[1].length;
      const text = parseInlineMarkdown(headingMatch[2].trim());
      out.push(`<h${level}>${text}</h${level}>`);
      continue;
    }

    // ── Table Rows ──
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      closeList();
      const cells = trimmed
        .slice(1, -1)
        .split('|')
        .map((c) => c.trim());

      // Check if it's separator row: |:---|:---|
      const isSeparator = cells.every((c) => /^:?-+:?$/.test(c));
      if (isSeparator) {
        continue;
      }

      if (!inTable) {
        inTable = true;
        tableHeaderParsed = true;
        out.push('<table>');
        out.push('<thead><tr>');
        for (const cell of cells) {
          out.push(`<th>${parseInlineMarkdown(cell)}</th>`);
        }
        out.push('</tr></thead><tbody>');
      } else {
        out.push('<tr>');
        for (const cell of cells) {
          out.push(`<td>${parseInlineMarkdown(cell)}</td>`);
        }
        out.push('</tr>');
      }
      continue;
    } else {
      closeTable();
    }

    // ── Blockquotes (Support nested >>) ──
    if (trimmed.startsWith('>')) {
      closeList();
      closeTable();
      let quoteDepth = 0;
      let text = trimmed;
      while (text.startsWith('>')) {
        quoteDepth++;
        text = text.slice(1).trim();
      }
      const openTags = '<blockquote>'.repeat(quoteDepth);
      const closeTags = '</blockquote>'.repeat(quoteDepth);
      out.push(`${openTags}<p>${parseInlineMarkdown(text)}</p>${closeTags}`);
      continue;
    }

    // ── Unordered List (* or -) ──
    const ulMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (ulMatch) {
      closeTable();
      if (inList !== 'ul') {
        closeList();
        inList = 'ul';
        out.push('<ul>');
      }
      out.push(`<li>${parseInlineMarkdown(ulMatch[1].trim())}</li>`);
      continue;
    }

    // ── Ordered List (1. 2. etc.) ──
    const olMatch = trimmed.match(/^\d+\.\s+(.+)$/);
    if (olMatch) {
      closeTable();
      if (inList !== 'ol') {
        closeList();
        inList = 'ol';
        out.push('<ol>');
      }
      out.push(`<li>${parseInlineMarkdown(olMatch[1].trim())}</li>`);
      continue;
    }

    // ── Empty Line ──
    if (trimmed === '') {
      closeList();
      closeTable();
      continue;
    }

    // ── Regular Paragraph ──
    closeList();
    closeTable();
    out.push(`<p>${parseInlineMarkdown(trimmed)}</p>`);
  }

  closeList();
  closeTable();

  return out.join('\n');
}
