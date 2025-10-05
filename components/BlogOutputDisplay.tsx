import React, { useState, useEffect, useCallback } from 'react';
import { BlogContent } from '../types';
import GlassmorphicCard from './GlassmorphicCard';
import Accordion from './Accordion';
import { ClipboardCopyIcon, CheckIcon, SaveIcon, LoaderIcon } from './IconComponents';
import Editable from './Editable';
import EditableTags from './EditableTags';

interface BlogOutputDisplayProps {
  blogData: BlogContent;
  traceId: string;
  generatedAt: string;
}

interface BlogSection {
  title: string;
  content: string;
}

const createSections = (content: string, headings: string[]): BlogSection[] => {
    if (!content.trim() || !headings || headings.length === 0) {
        return [];
    }
    return headings.map((heading, i) => {
        const nextHeading = i + 1 < headings.length ? headings[i + 1] : null;
        const startMarker = `## ${heading}`;
        let startIndex = content.indexOf(startMarker);
        if (startIndex === -1) return { title: heading, content: '' };

        startIndex += startMarker.length;
        
        let endIndex;
        if (nextHeading) {
            endIndex = content.indexOf(`## ${nextHeading}`, startIndex);
        }
        endIndex = (endIndex === -1 || !nextHeading) ? content.length : endIndex;

        return { title: heading, content: content.substring(startIndex, endIndex).trim() };
    });
};

const markdownToHtml = (text: string): string => {
  if (!text) return '';

  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Bold and Italic
  html = html
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');
    
  // Citations
  html = html.replace(/\[cite:(.*?)\]/g, '<span class="text-xs text-gray-500 align-super">[cite:$1]</span>');
  
  const lines = html.split('\n');
  let inList = false;
  let result = '';

  lines.forEach(line => {
    line = line.trim();
    if (line.startsWith('* ')) {
      if (!inList) {
        result += '<ul>';
        inList = true;
      }
      result += `<li>${line.substring(2)}</li>`;
    } else {
      if (inList) {
        result += '</ul>';
        inList = false;
      }
      if (line) {
        result += `<p>${line}</p>`;
      }
    }
  });

  if (inList) {
    result += '</ul>';
  }

  return result;
};

const htmlToMarkdown = (html: string): string => {
  if (!html) return '';
  let markdown = html;

  // Block elements
  markdown = markdown.replace(/<p>(.*?)<\/p>/gi, '$1\n\n');
  markdown = markdown.replace(/<br\s*\/?>/gi, '\n');
  markdown = markdown.replace(/<ul>/gi, '');
  markdown = markdown.replace(/<\/ul>/gi, '');
  markdown = markdown.replace(/<li>(.*?)<\/li>/gi, '* $1\n');

  // Inline elements
  markdown = markdown.replace(/<strong>(.*?)<\/strong>/gi, '**$1**');
  markdown = markdown.replace(/<b>(.*?)<\/b>/gi, '**$1**');
  markdown = markdown.replace(/<em>(.*?)<\/em>/gi, '*$1*');
  markdown = markdown.replace(/<i>(.*?)<\/i>/gi, '*$1*');
  
  // Strip remaining HTML tags
  markdown = markdown.replace(/<[^>]*>?/gm, '');

  // Clean up whitespace and entities
  markdown = markdown.replace(/&nbsp;/g, ' ');
  markdown = markdown.replace(/&amp;/g, '&');
  markdown = markdown.replace(/&lt;/g, '<');
  markdown = markdown.replace(/&gt;/g, '>');

  return markdown.trim();
};

const BlogOutputDisplay: React.FC<BlogOutputDisplayProps> = ({ blogData, traceId, generatedAt }) => {
  const [editableData, setEditableData] = useState<BlogContent>(blogData);
  const [editableSections, setEditableSections] = useState<BlogSection[]>([]);
  
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    setEditableData({
      ...blogData,
      meta_description: markdownToHtml(blogData.meta_description),
      introduction: markdownToHtml(blogData.introduction),
      conclusion: markdownToHtml(blogData.conclusion),
      call_to_action: markdownToHtml(blogData.call_to_action),
    });
    
    setEditableSections(createSections(blogData.content, blogData.headings).map(section => ({
        title: section.title,
        content: markdownToHtml(section.content)
    })));

    setIsDirty(false);
    setIsSaving(false);
  }, [blogData]);
  
  const handleDirty = useCallback(() => setIsDirty(true), []);

  const handleFieldChange = (field: keyof BlogContent, value: string | string[]) => {
    setEditableData(prev => ({ ...prev, [field]: value }));
  };

  const handleSectionTitleChange = (index: number, newTitle: string) => {
    const newHeadings = [...editableData.headings];
    newHeadings[index] = newTitle;
    setEditableData(prev => ({...prev, headings: newHeadings}));
    
    const newSections = [...editableSections];
    newSections[index].title = newTitle;
    setEditableSections(newSections);
  };

  const handleSectionContentChange = (index: number, newContent: string) => {
    const newSections = [...editableSections];
    newSections[index].content = newContent;
    setEditableSections(newSections);
  };
  
  const handleSave = async () => {
    setIsSaving(true);
    
    const cleanHeadings = editableData.headings.map(h => h.replace(/<[^>]*>?/gm, ''));

    let fullContent = '';
    cleanHeadings.forEach((heading, index) => {
      if (editableSections[index]) {
        const sectionContent = htmlToMarkdown(editableSections[index].content);
        fullContent += `## ${heading}\n\n${sectionContent}\n\n`;
      }
    });

    const finalData: BlogContent = {
      ...editableData,
      title: editableData.title.replace(/<[^>]*>?/gm, ''),
      subtitle: editableData.subtitle.replace(/<[^>]*>?/gm, ''),
      meta_description: htmlToMarkdown(editableData.meta_description),
      introduction: htmlToMarkdown(editableData.introduction),
      headings: cleanHeadings,
      content: fullContent.trim(),
      conclusion: htmlToMarkdown(editableData.conclusion),
      call_to_action: htmlToMarkdown(editableData.call_to_action),
      reading_time: editableData.reading_time.replace(/<[^>]*>?/gm, ''),
    };
    
    // Mock API call
    console.log("Saving data:", JSON.stringify(finalData, null, 2));
    await new Promise(resolve => setTimeout(resolve, 1500)); 

    setIsSaving(false);
    setIsDirty(false);
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 3000);
  };

  const handleCopy = async () => {
    const sectionsPlainText = editableSections.map(s => 
        `## ${s.title.replace(/<[^>]*>?/gm, '')}\n\n${htmlToMarkdown(s.content)}`
    ).join('\n\n');

    const plainText = `
# ${editableData.title.replace(/<[^>]*>?/gm, '')}
${editableData.subtitle.replace(/<[^>]*>?/gm, '')}

Reading Time: ${editableData.reading_time.replace(/<[^>]*>?/gm, '')}

## Introduction
${htmlToMarkdown(editableData.introduction)}

${sectionsPlainText}

## Conclusion
${htmlToMarkdown(editableData.conclusion)}

## Call to Action
${htmlToMarkdown(editableData.call_to_action)}

---
**Tags:** ${editableData.tags.join(', ')}
**Keywords:** ${editableData.keywords.join(', ')}
    `.trim();

    const htmlString = `
        <h1>${editableData.title}</h1>
        <h2>${editableData.subtitle}</h2>
        <p><em>Reading Time: ${editableData.reading_time}</em></p>
        <h3>Introduction</h3><div>${editableData.introduction}</div>
        ${editableSections.map(s => `<h2>${s.title}</h2><div>${s.content}</div>`).join('')}
        <h3>Conclusion</h3><div>${editableData.conclusion}</div>
        <h3>Call to Action</h3><div>${editableData.call_to_action}</div>
        <p><strong>Tags:</strong> ${editableData.tags.join(', ')}</p>
        <p><strong>Keywords:</strong> ${editableData.keywords.join(', ')}</p>
    `;

    try {
        await navigator.clipboard.write([
            new ClipboardItem({
                'text/html': new Blob([htmlString], { type: 'text/html' }),
                'text/plain': new Blob([plainText], { type: 'text/plain' }),
            })
        ]);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2500);
    } catch (err) {
        console.error("Failed to copy content:", err);
    }
  };

  const SaveStatusHeader = () => (
    <div className="sticky top-4 z-40 w-full flex justify-center mb-6">
        <div className="flex items-center justify-between gap-6 p-3 rounded-xl bg-gray-900/50 backdrop-blur-lg border border-white/10 shadow-2xl">
            <div className="flex items-center gap-3 text-gray-300 font-semibold text-sm">
                {isSaving ? (
                    <>
                        <LoaderIcon className="w-5 h-5 animate-spin text-blue-400" />
                        <span>Saving...</span>
                    </>
                ) : isDirty ? (
                    <>
                        <div className="w-3 h-3 bg-yellow-400 rounded-full animate-blink" />
                        <span>Unsaved changes</span>
                    </>
                ) : (
                    <>
                        <div className="w-3 h-3 bg-green-500 rounded-full" />
                        <span>Saved</span>
                    </>
                )}
            </div>
            <div className="flex items-center gap-2">
                 <button onClick={handleSave} disabled={!isDirty || isSaving} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-md hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    <SaveIcon className="w-5 h-5" />
                    <span>Save</span>
                </button>
                <button 
                    onClick={handleCopy} 
                    title={isCopied ? "Copied!" : "Copy Content"}
                    className="flex items-center justify-center p-2.5 rounded-md bg-white/10 hover:bg-white/20 transition-all"
                >
                    {isCopied ? <CheckIcon className="w-5 h-5 text-green-400" /> : <ClipboardCopyIcon className="w-5 h-5 text-gray-300" />}
                </button>
            </div>
        </div>
    </div>
  );

  return (
    <div className="relative space-y-8 animate-fade-in">
        <SaveStatusHeader />

      <header className="text-center">
        <Editable as="h1" html={editableData.title} onChange={(val) => handleFieldChange('title', val)} onDirty={handleDirty} className="text-4xl md:text-6xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-cyan-200 mb-2 focus:caret-white" />
        <Editable as="p" html={editableData.subtitle} onChange={(val) => handleFieldChange('subtitle', val)} onDirty={handleDirty} className="text-xl md:text-2xl text-gray-400" />
      </header>
      
      <div className="flex justify-center">
        <Editable as="div" html={editableData.reading_time} onChange={(val) => handleFieldChange('reading_time', val)} onDirty={handleDirty} className="px-4 py-2 text-sm font-semibold text-cyan-200 bg-cyan-500/10 border border-cyan-500/30 rounded-full" />
      </div>

      <GlassmorphicCard>
        <div className="p-6">
            <h3 className="text-lg font-semibold text-blue-300 mb-2">Meta Description</h3>
            <Editable as="p" html={editableData.meta_description} onChange={(val) => handleFieldChange('meta_description', val)} onDirty={handleDirty} className="text-gray-400 italic mb-4" />
            <div className="w-full h-[1px] bg-white/10 my-4"></div>
            <h3 className="text-lg font-semibold text-blue-300 mb-2">Introduction</h3>
            <Editable html={editableData.introduction} onChange={(val) => handleFieldChange('introduction', val)} onDirty={handleDirty} className="text-gray-300 leading-relaxed" />
        </div>
      </GlassmorphicCard>

      <div className="space-y-4">
        {editableSections.map((section, index) => (
          <Accordion 
            key={index} 
            title={
              <Editable
                as="span"
                html={section.title}
                onChange={(val) => handleSectionTitleChange(index, val)}
                onDirty={handleDirty}
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
              />
            }
          >
            <Editable html={section.content} onChange={(val) => handleSectionContentChange(index, val)} onDirty={handleDirty} className="text-gray-300 leading-relaxed" />
          </Accordion>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-6 bg-gradient-to-br from-gray-800 to-gray-900 border border-white/10 rounded-xl">
             <h3 className="text-xl font-bold text-blue-300 mb-3">Conclusion</h3>
             <Editable html={editableData.conclusion} onChange={(val) => handleFieldChange('conclusion', val)} onDirty={handleDirty} className="text-gray-300 leading-relaxed" />
        </div>
         <div className="p-6 bg-gradient-to-br from-blue-900/50 to-cyan-900/50 border border-blue-500/30 rounded-xl">
             <h3 className="text-xl font-bold text-cyan-300 mb-3">Call to Action</h3>
             <Editable html={editableData.call_to_action} onChange={(val) => handleFieldChange('call_to_action', val)} onDirty={handleDirty} className="text-cyan-100 leading-relaxed" />
        </div>
      </div>

      <GlassmorphicCard>
        <div className="p-6 space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-gray-400 mb-4">Tags</h3>
                <EditableTags items={editableData.tags} onChange={(val) => handleFieldChange('tags', val as string[])} onDirty={handleDirty} />
            </div>
            <div>
                <h3 className="text-lg font-semibold text-gray-400 mb-4">Keywords</h3>
                <EditableTags items={editableData.keywords} onChange={(val) => handleFieldChange('keywords', val as string[])} onDirty={handleDirty} />
            </div>
        </div>
      </GlassmorphicCard>

      <footer className="text-center text-xs text-gray-600 pt-8">
        <p>Trace ID: {traceId}</p>
        <p>Generated At: {new Date(generatedAt).toLocaleString()}</p>
      </footer>
      
      {showSaveToast && (
        <div className="fixed bottom-8 right-8 z-50 flex items-center gap-3 bg-green-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg shadow-green-500/30 animate-fade-in">
            <CheckIcon className="w-5 h-5" />
            <span>Saved successfully!</span>
        </div>
      )}
    </div>
  );
};

export default BlogOutputDisplay;
