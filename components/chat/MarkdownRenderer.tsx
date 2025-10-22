import React, { useMemo } from 'react';

// --- Markdown Parsers and Renderers ---
export const parseMarkdown = (text: string) => {
  const parts: { type: 'text' | 'code'; content: string; language?: string }[] = [];
  const codeBlockRegex = /```([^\n]*)\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.substring(lastIndex, match.index) });
    }
    parts.push({ type: 'code', language: match[1].trim().split(/\s+/)[0] || 'plaintext', content: match[2].trim() });
    lastIndex = codeBlockRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.substring(lastIndex) });
  }
  return parts;
};

const renderTextMarkdown = (text: string): string => {
  if (!text) return '';
  const processInlines = (str: string) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>').replace(/`(.*?)`/g, '<code class="bg-gray-700/50 text-cyan-300 rounded px-1.5 py-1 font-mono text-sm">$1</code>');
  const blocks = text.split(/\n\s*\n/);
  return blocks.map(block => {
    if (!block.trim()) return '';
    const headingMatch = block.match(/^(#{1,6})\s+(.*)/);
    if (headingMatch) return `<h${headingMatch[1].length}>${processInlines(headingMatch[2].trim())}</h${headingMatch[1].length}>`;
    if (block.match(/^(\*\*\*|---|___)\s*$/)) return '<hr />';
    if (block.startsWith('>')) return `<blockquote>${processInlines(block.split('\n').map(line => line.replace(/^>\s?/, '')).join('\n')).replace(/\n/g, '<br />')}</blockquote>`;
    if (block.match(/^\s*(\*|-)\s/)) return `<ul>${block.split('\n').map(item => `<li>${processInlines(item.replace(/^\s*(\*|-)\s/, ''))}</li>`).join('')}</ul>`;
    return `<p>${processInlines(block).replace(/\n/g, '<br />')}</p>`;
  }).join('');
};

export const TextContent: React.FC<{ content: string }> = ({ content }) => {
  const htmlContent = useMemo(() => renderTextMarkdown(content), [content]);
  return <div className="markdown-content" dangerouslySetInnerHTML={{ __html: htmlContent }} />;
};
