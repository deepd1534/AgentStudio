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
  
  const renderMarkdownTable = (block: string) => {
    const lines = block.trim().split('\n');
    if (lines.length < 2) return null;

    const headerLine = lines[0];
    const separatorLine = lines[1];

    if (!headerLine.includes('|') || !separatorLine.match(/^\|?[-| :]+\|/)) {
      return null;
    }

    const parseRow = (rowLine: string) => {
        let line = rowLine.trim();
        if (line.startsWith('|')) line = line.substring(1);
        if (line.endsWith('|')) line = line.slice(0, -1);
        return line.split('|').map(s => s.trim());
    };

    const headers = parseRow(headerLine);
    const separatorCells = parseRow(separatorLine);
    
    if(separatorCells.length < headers.length || !separatorCells.every(c => c.match(/^:?-+:?$/))) {
        return null;
    }

    const alignments: ('left'|'center'|'right')[] = separatorCells.map(cell => {
        const align = cell.trim();
        const hasLeft = align.startsWith(':');
        const hasRight = align.endsWith(':');
        if (hasLeft && hasRight) return 'center';
        if (hasRight) return 'right';
        return 'left';
    });

    const numColumns = headers.length;
    const rows = lines.slice(2).map(rowLine => {
        const cells = parseRow(rowLine);
        while (cells.length < numColumns) cells.push('');
        return cells.slice(0, numColumns);
    });

    let tableHtml = '<table><thead><tr>';
    headers.forEach((header, i) => {
      const align = alignments[i] ? ` style="text-align: ${alignments[i]}"` : '';
      tableHtml += `<th${align}>${processInlines(header)}</th>`;
    });
    tableHtml += '</tr></thead><tbody>';

    rows.forEach(row => {
      tableHtml += '<tr>';
      row.forEach((cell, i) => {
        const align = alignments[i] ? ` style="text-align: ${alignments[i]}"` : '';
        tableHtml += `<td${align}>${processInlines(cell)}</td>`;
      });
      tableHtml += '</tr>';
    });

    tableHtml += '</tbody></table>';
    return tableHtml;
  };

  const blocks = text.split(/\n\s*\n/);
  return blocks.map(block => {
    if (!block.trim()) return '';

    const tableHtml = renderMarkdownTable(block);
    if (tableHtml) return tableHtml;

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