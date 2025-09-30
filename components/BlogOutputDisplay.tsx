import React from 'react';
import { BlogContent } from '../types';
import GlassmorphicCard from './GlassmorphicCard';
import Accordion from './Accordion';
import Chip from './Chip';

interface BlogOutputDisplayProps {
  blogData: BlogContent;
  traceId: string;
  generatedAt: string;
}

// A simple component to render basic markdown (bold, lists)
const MarkdownRenderer: React.FC<{ text: string }> = ({ text }) => {
    // Helper to render bold text
    const renderBold = (line: string) => {
      const parts = line.split('**');
      return (
        <>
          {parts.map((part, index) =>
            index % 2 === 1 ? <strong key={index} className="text-white font-semibold">{part}</strong> : <>{part}</>
          )}
        </>
      );
    };
  
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let listItems: React.ReactNode[] = [];
  
    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`ul-${elements.length}`} className="list-disc list-inside space-y-2 my-4 pl-4">
            {listItems}
          </ul>
        );
        listItems = [];
      }
    };
  
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('* ')) {
        const content = trimmedLine.substring(2);
        listItems.push(<li key={index}>{renderBold(content)}</li>);
      } else {
        flushList();
        if (trimmedLine) {
            elements.push(<p key={index} className="mb-4">{renderBold(trimmedLine)}</p>);
        }
      }
    });
  
    flushList(); // Add any remaining list items at the end
  
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

const BlogOutputDisplay: React.FC<BlogOutputDisplayProps> = ({ blogData, traceId, generatedAt }) => {
  const blogSections = React.useMemo(() => createSections(blogData.content, blogData.headings), [blogData.content, blogData.headings]);

  return (
    <div className="space-y-12 animate-fade-in">
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

      {/* FIX: Replaced non-standard `style jsx` with a standard `style` tag to fix TypeScript error. */}
      <style>{`
        .animate-fade-in {
            animation: fadeIn 0.8s ease-in-out;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default BlogOutputDisplay;