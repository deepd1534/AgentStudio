import React, { useState, useEffect, useMemo } from 'react';
import CodeBlock from './CodeBlock';
import ThinkingIndicator from './ThinkingIndicator';
import { parseMarkdown, TextContent } from './MarkdownRenderer';

const BotMessageContent: React.FC<{ text: string; isStreaming?: boolean }> = ({ text, isStreaming }) => {
  const [displayedText, setDisplayedText] = useState('');
  useEffect(() => {
    if (!isStreaming) { setDisplayedText(text); return; }
    if (displayedText.length < text.length) {
      const timeoutId = setTimeout(() => setDisplayedText(text.slice(0, Math.min(text.length, displayedText.length + 50))), 5);
      return () => clearTimeout(timeoutId);
    }
  }, [text, displayedText, isStreaming]);

  const messageParts = useMemo(() => parseMarkdown(displayedText), [displayedText]);

  return (
    <div className="text-white break-words">
      {messageParts.map((part, index) => part.type === 'code' ? <CodeBlock key={index} language={part.language || 'code'} content={part.content} /> : <TextContent key={index} content={part.content} />)}
      {isStreaming && text.length === 0 && <ThinkingIndicator />}
    </div>
  );
};

export default BotMessageContent;
