import React, { useState } from 'react';
import { BlogContent } from '../types';
import GlassmorphicCard from './GlassmorphicCard';
import Accordion from './Accordion';
import Chip from './Chip';
import { ClipboardCopyIcon, CheckIcon } from './IconComponents';

interface BlogOutputDisplayProps {
  blogData: BlogContent;
  traceId: string;
  generatedAt: string;
}

// A component to render markdown (bold, lists, links, tables)
const MarkdownRenderer: React.FC<{ text: string }> = ({ text }) => {
  // Helper to render inline markdown like bold and links
  const renderInline = (line: string): React.ReactNode => {
    // Regex to capture **bold** text and [links](url)
    const regex = /(\*\*.*?\*\*)|(\[.*?\]\(.*?\))/g;
    const parts = line.split(regex).filter(Boolean);

    return (
      <>
        {parts.map((part, index) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={index} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
          }
          const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
          if (linkMatch) {
            return <a href={linkMatch[2]} key={index} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{linkMatch[1]}</a>;
          }
          return <React.Fragment key={index}>{part}</React.Fragment>;
        })}
      </>
    );
  };

  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let tableHeader: string[] | null = null;
  let tableBody: string[][] = [];
  
  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="list-disc list-inside space-y-2 my-4 pl-4">
          {listItems.map((item, index) => <li key={index}>{renderInline(item)}</li>)}
        </ul>
      );
      listItems = [];
    }
  };

  const flushTable = () => {
    if (tableHeader) {
       elements.push(
        <div key={`table-wrapper-${elements.length}`} className="my-6 overflow-x-auto border border-white/10 rounded-lg">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/20">
                {tableHeader.map((cell, i) => (
                  <th key={i} className="p-4 font-semibold text-blue-300">{renderInline(cell.trim())}</th>
                ))}
              </tr>
            </thead>
            {tableBody.length > 0 && (
                <tbody>
                {tableBody.map((row, i) => (
                    <tr key={i} className="border-b border-white/10 last:border-b-0">
                    {row.map((cell, j) => (
                        <td key={j} className="p-4">{renderInline(cell.trim())}</td>
                    ))}
                    </tr>
                ))}
                </tbody>
            )}
          </table>
        </div>
      );
    }
    tableHeader = null;
    tableBody = [];
  };

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    
    // Table rows
    if (trimmedLine.startsWith('|') && trimmedLine.endsWith('|')) {
      flushList();
      const cells = trimmedLine.slice(1, -1).split('|');
      
      // Separator line
      if (cells.every(cell => /^\s*:?-{3,}:?\s*$/.test(cell))) {
        return;
      }

      if (!tableHeader) {
        tableHeader = cells;
      } else {
        tableBody.push(cells);
      }
    } else if (trimmedLine.startsWith('* ')) { // List items
      flushTable();
      listItems.push(trimmedLine.substring(2));
    } else { // Paragraphs
      flushList();
      flushTable();
      if (trimmedLine && trimmedLine !== '#') {
        elements.push(<p key={index} className="mb-4">{renderInline(trimmedLine)}</p>);
      }
    }
  });
  
  flushList();
  flushTable();

  return <div className="text-gray-300 leading-relaxed">{elements}</div>;
};


// Helper to parse the main content into sections based on headings
const createSections = (content: string, headings: string[]): { title: string; content: string }[] => {
    if (!content.trim() || !headings || headings.length === 0) {
        return [];
    }

    const sections: { title: string; content: string }[] = [];

    for (let i = 0; i < headings.length; i++) {
        const currentHeading = headings[i];
        const nextHeading = i + 1 < headings.length ? headings[i + 1] : null;

        const startMarker = `## ${currentHeading}`;
        const startIndex = content.indexOf(startMarker);

        if (startIndex === -1) continue;

        let endIndex;
        if (nextHeading) {
            const nextMarker = `## ${nextHeading}`;
            endIndex = content.indexOf(nextMarker, startIndex + startMarker.length);
        }
        
        if (endIndex === -1 || !nextHeading) {
            endIndex = content.length;
        }

        const sectionContent = content.substring(startIndex + startMarker.length, endIndex).trim();

        sections.push({
            title: currentHeading,
            content: sectionContent,
        });
    }

    return sections;
};

const markdownToHtml = (markdown: string): string => {
  if (!markdown) return '';
  const lines = markdown.split('\n');
  let html = '';
  let inList = false;

  const processLine = (line: string) => line.trim().replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  lines.forEach(line => {
    if (line.trim().startsWith('* ')) {
      const content = processLine(line.trim().substring(2));
      if (!inList) {
        html += '<ul>';
        inList = true;
      }
      html += `<li>${content}</li>`;
    } else {
      if (inList) {
        html += '</ul>';
        inList = false;
      }
      const processedLine = processLine(line);
      if (processedLine) {
        html += `<p>${processedLine}</p>`;
      }
    }
  });

  if (inList) {
    html += '</ul>';
  }
  return html;
};


const BlogOutputDisplay: React.FC<BlogOutputDisplayProps> = ({ blogData, traceId, generatedAt }) => {
  const [isCopied, setIsCopied] = useState(false);
  const blogSections = React.useMemo(() => createSections(blogData.content, blogData.headings), [blogData.content, blogData.headings]);

  const handleCopy = async () => {
    const plainText = `
# ${blogData.title}
## ${blogData.subtitle}

**Reading Time:** ${blogData.reading_time}

---

### Meta Description
${blogData.meta_description}

### Introduction
${blogData.introduction}

---

${blogSections.map(section => `## ${section.title}\n\n${section.content}`).join('\n\n---\n\n')}

---

### Conclusion
${blogData.conclusion}

### Call to Action
${blogData.call_to_action}

---
**Tags:** ${blogData.tags.join(', ')}
**Keywords:** ${blogData.keywords.join(', ')}
    `.trim().replace(/(\n){3,}/g, '\n\n');

    const htmlString = `
        <h1>${blogData.title}</h1>
        <h2>${blogData.subtitle}</h2>
        <p><em>Reading Time: ${blogData.reading_time}</em></p>
        <hr />
        <h3>Meta Description</h3>
        <p>${blogData.meta_description}</p>
        <h3>Introduction</h3>
        <p>${blogData.introduction}</p>
        <hr />
        ${blogSections.map(section => `<h2>${section.title}</h2>${markdownToHtml(section.content)}`).join('\n')}
        <hr />
        <h3>Conclusion</h3>
        <p>${blogData.conclusion}</p>
        <h3>Call to Action</h3>
        <p>${blogData.call_to_action}</p>
        <hr />
        <p><strong>Tags:</strong> ${blogData.tags.join(', ')}</p>
        <p><strong>Keywords:</strong> ${blogData.keywords.join(', ')}</p>
    `;

    try {
        if (!navigator.clipboard.write) {
            throw new Error("Clipboard API 'write' not supported. Falling back to plain text.");
        }
        const htmlBlob = new Blob([htmlString], { type: 'text/html' });
        const textBlob = new Blob([plainText], { type: 'text/plain' });
        const clipboardItem = new ClipboardItem({
            'text/html': htmlBlob,
            'text/plain': textBlob,
        });
        await navigator.clipboard.write([clipboardItem]);
        
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2500);

    } catch (err) {
        console.warn("Rich text copy failed, falling back to plain text:", err);
        navigator.clipboard.writeText(plainText).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2500);
        }).catch(copyErr => {
            console.error("Failed to copy plain text:", copyErr);
        });
    }
  };

  return (
    <div className="relative space-y-8 animate-fade-in">
      <div className="flex justify-end">
        <button 
            onClick={handleCopy} 
            title={isCopied ? "Copied!" : "Copy Content"}
            className="flex items-center gap-2 p-2 rounded-lg bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-200"
        >
            {isCopied ? (
                <>
                    <CheckIcon className="w-5 h-5 text-green-400" />
                    <span className="text-sm text-green-300 pr-1">Copied!</span>
                </>
            ) : (
                <ClipboardCopyIcon className="w-5 h-5 text-gray-300" />
            )}
        </button>
      </div>

      {/* Header */}
      <header className="text-center">
        <h1 className="text-4xl md:text-6xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-cyan-200 mb-2">
          {blogData.title}
        </h1>
        <p className="text-xl md:text-2xl text-gray-400">{blogData.subtitle}</p>
      </header>
      
      <div className="flex justify-center">
        <div className="px-4 py-2 text-sm font-semibold text-cyan-200 bg-cyan-500/10 border border-cyan-500/30 rounded-full">
            {blogData.reading_time}
        </div>
      </div>

      {/* Intro */}
      <GlassmorphicCard>
        <div className="p-6">
            <h3 className="text-lg font-semibold text-blue-300 mb-2">Meta Description</h3>
            <p className="text-gray-400 italic mb-4">{blogData.meta_description}</p>
            <div className="w-full h-[1px] bg-white/10 my-4"></div>
            <h3 className="text-lg font-semibold text-blue-300 mb-2">Introduction</h3>
            <p className="text-gray-300 leading-relaxed">{blogData.introduction}</p>
        </div>
      </GlassmorphicCard>

      {/* Accordion Sections */}
      {blogSections.length > 0 ? (
        <div className="space-y-4">
          {blogSections.map((section, index) => (
            <Accordion key={index} title={section.title}>
              <MarkdownRenderer text={section.content} />
            </Accordion>
          ))}
        </div>
      ) : (
         /* Fallback to show full content if parsing fails or no headings are present */
         <GlassmorphicCard>
            <div className="p-6">
                <h2 className="text-2xl font-bold text-blue-300 mb-4">Content</h2>
                <MarkdownRenderer text={blogData.content} />
            </div>
          </GlassmorphicCard>
      )}

      {/* Conclusion & CTA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-6 bg-gradient-to-br from-gray-800 to-gray-900 border border-white/10 rounded-xl">
             <h3 className="text-xl font-bold text-blue-300 mb-3">Conclusion</h3>
             <p className="text-gray-300 leading-relaxed">{blogData.conclusion}</p>
        </div>
         <div className="p-6 bg-gradient-to-br from-blue-900/50 to-cyan-900/50 border border-blue-500/30 rounded-xl">
             <h3 className="text-xl font-bold text-cyan-300 mb-3">Call to Action</h3>
             <p className="text-cyan-100 leading-relaxed">{blogData.call_to_action}</p>
        </div>
      </div>

      {/* Tags and Keywords */}
      <div>
        <h3 className="text-lg font-semibold text-gray-400 mb-4">Tags</h3>
        <div className="flex flex-wrap gap-3">
            {blogData.tags.map(tag => <Chip key={tag} text={tag} />)}
        </div>
      </div>
       <div>
        <h3 className="text-lg font-semibold text-gray-400 mb-4">Keywords</h3>
        <div className="flex flex-wrap gap-3">
            {blogData.keywords.map(keyword => <Chip key={keyword} text={keyword} />)}
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-gray-600 pt-8">
        <p>Trace ID: {traceId}</p>
        <p>Generated At: {new Date(generatedAt).toLocaleString()}</p>
      </footer>
    </div>
  );
};

export default BlogOutputDisplay;