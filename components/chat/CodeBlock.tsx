import React, { useState, useRef, useEffect } from 'react';
import { ClipboardCopyIcon, CheckIcon } from '../IconComponents';

declare global {
  interface Window {
    hljs: any;
  }
}

const CodeBlock: React.FC<{ language: string; content: string }> = ({ language, content }) => {
  const [isCopied, setIsCopied] = useState(false);
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (codeRef.current && window.hljs) window.hljs.highlightElement(codeRef.current);
  }, [content, language]);

  const handleCopy = () => {
    navigator.clipboard.writeText(content).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  return (
    <div className="bg-gray-800/70 border border-white/10 rounded-lg my-4 overflow-hidden animate-fade-in">
      <div className="flex justify-between items-center px-4 py-2 bg-black/20">
        <span className="text-xs font-semibold text-gray-400 uppercase">{language}</span>
        <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs text-gray-300 hover:text-white transition-colors disabled:opacity-50" disabled={isCopied}>
          {isCopied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <ClipboardCopyIcon className="w-4 h-4" />}
          <span className="font-sans">{isCopied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>
      <pre className="p-4 overflow-x-auto custom-scrollbar"><code ref={codeRef} className={`language-${language} text-sm`}>{content}</code></pre>
    </div>
  );
};

export default CodeBlock;
