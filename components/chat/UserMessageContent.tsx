import React, { useMemo } from 'react';
import { getAgentColorClasses } from '../../utils/chatUtils';

const UserMessageContent: React.FC<{ text: string }> = ({ text }) => {
  const content = useMemo(() => {
    const parts = text.split(/(@\[[^\]]+\])/g);
    return parts.map((part, index) => {
      const match = part.match(/@\[([^\]]+)\]/);
      if (match && match[1]) {
        const agentName = match[1];
        const colorClass = getAgentColorClasses(agentName).text;
        return <strong key={index} className={`font-semibold ${colorClass}`}>{agentName}</strong>;
      }
      return <React.Fragment key={index}>{part}</React.Fragment>;
    });
  }, [text]);

  return <p className="text-white whitespace-pre-wrap">{content}</p>;
};

export default UserMessageContent;
