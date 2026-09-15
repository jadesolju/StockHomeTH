import { describe, it, expect } from 'vitest';
import { sanitizeHtml, parseInlineMarkdown, convertMarkdownToHtml } from './markdownToHtml';

describe('markdownToHtml utility', () => {
  describe('sanitizeHtml', () => {
    it('returns an empty string unchanged', () => {
      expect(sanitizeHtml('')).toBe('');
    });

    it('returns standard text without special characters unchanged', () => {
      const text = 'Hello world 123!';
      expect(sanitizeHtml(text)).toBe(text);
    });

    it('escapes ampersand (&)', () => {
      expect(sanitizeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
    });

    it('escapes less-than (<)', () => {
      expect(sanitizeHtml('5 < 10')).toBe('5 &lt; 10');
    });

    it('escapes greater-than (>)', () => {
      expect(sanitizeHtml('10 > 5')).toBe('10 &gt; 5');
    });

    it('escapes double quotes (")', () => {
      expect(sanitizeHtml('He said "Hello"')).toBe('He said &quot;Hello&quot;');
    });

    it('escapes single quotes (\')', () => {
      expect(sanitizeHtml("It's fine")).toBe('It&#39;s fine');
    });

    it('escapes combined HTML special characters correctly (XSS prevention)', () => {
      const xssInput = '<script>alert("XSS & \'attack\'")</script>';
      const expected = '&lt;script&gt;alert(&quot;XSS &amp; &#39;attack&#39;&quot;)&lt;/script&gt;';
      expect(sanitizeHtml(xssInput)).toBe(expected);
    });

    it('handles multiple consecutive special characters', () => {
      expect(sanitizeHtml('<<&&""\'\'>>')).toBe('&lt;&lt;&amp;&amp;&quot;&quot;&#39;&#39;&gt;&gt;');
    });
  });

  describe('parseInlineMarkdown', () => {
    it('parses inline code and sanitizes content', () => {
      expect(parseInlineMarkdown('Use `<script>` code')).toBe('Use <code>&lt;script&gt;</code> code');
    });

    it('parses bold text with ** or __', () => {
      expect(parseInlineMarkdown('**bold1** and __bold2__')).toBe('<strong>bold1</strong> and <strong>bold2</strong>');
    });

    it('parses strikethrough text', () => {
      expect(parseInlineMarkdown('~~strikethrough~~')).toBe('<del>strikethrough</del>');
    });

    it('parses italic text with * or _', () => {
      expect(parseInlineMarkdown('*italic1* and _italic2_')).toBe('<em>italic1</em> and <em>italic2</em>');
    });

    it('parses links', () => {
      expect(parseInlineMarkdown('[Google](https://google.com)')).toBe(
        '<a href="https://google.com" target="_blank" rel="noopener noreferrer">Google</a>'
      );
    });
  });

  describe('convertMarkdownToHtml', () => {
    it('returns empty string for empty input', () => {
      expect(convertMarkdownToHtml('')).toBe('');
    });

    it('converts code blocks with language and sanitizes inner code', () => {
      const md = '```typescript\nconst x: number = 5 < 10;\n```';
      const expected = '<pre><code class="language-typescript">const x: number = 5 &lt; 10;</code></pre>';
      expect(convertMarkdownToHtml(md)).toBe(expected);
    });

    it('converts headings (H1 - H6)', () => {
      const md = '# Header 1\n## Header 2\n### Header 3';
      expect(convertMarkdownToHtml(md)).toBe('<h1>Header 1</h1>\n<h2>Header 2</h2>\n<h3>Header 3</h3>');
    });

    it('converts horizontal rules', () => {
      expect(convertMarkdownToHtml('---')).toBe('<hr />');
    });

    it('converts lists', () => {
      const md = '- Item 1\n- Item 2\n\n1. First\n2. Second';
      const expected = '<ul>\n<li>Item 1</li>\n<li>Item 2</li>\n</ul>\n<ol>\n<li>First</li>\n<li>Second</li>\n</ol>';
      expect(convertMarkdownToHtml(md)).toBe(expected);
    });

    it('converts tables', () => {
      const md = '| Col 1 | Col 2 |\n|---|---|\n| Val 1 | Val 2 |';
      const expected = '<table>\n<thead><tr>\n<th>Col 1</th>\n<th>Col 2</th>\n</tr></thead><tbody>\n<tr>\n<td>Val 1</td>\n<td>Val 2</td>\n</tr>\n</tbody></table>';
      expect(convertMarkdownToHtml(md)).toBe(expected);
    });

    it('converts interactive details tag', () => {
      const md = '[DETAILS: Title]\nContent line\n[/DETAILS]';
      const expected = '<details><summary>Title</summary>\n<p>Content line</p>\n</details>';
      expect(convertMarkdownToHtml(md)).toBe(expected);
    });

    it('converts blockquotes', () => {
      expect(convertMarkdownToHtml('> Quote text')).toBe('<blockquote><p>Quote text</p></blockquote>');
    });
  });
});
