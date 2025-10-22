import React, { useMemo } from 'react';
import CodeBlock from './CodeBlock';
import ThinkingIndicator from './ThinkingIndicator';
import { parseMarkdown, TextContent } from './MarkdownRenderer';

const BotMessageContent: React.FC<{ text: string; isStreaming?: boolean }> = ({ text, isStreaming }) => {
  const messageParts = useMemo(() => parseMarkdown(text), [text]);

  return (
    <div className="text-white break-words">
      {messageParts.map((part, index) => part.type === 'code' ? <CodeBlock key={index} language={part.language || 'code'} content={part.content} /> : <TextContent key={index} content={part.content} />)}
      {isStreaming && text.length === 0 && <ThinkingIndicator />}
    </div>
  );
};

export default BotMessageContent;