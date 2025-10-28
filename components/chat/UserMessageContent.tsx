import React, { useMemo } from 'react';
import { getAgentColorClasses, getTeamColorClasses, getWorkflowColorClasses } from '../../utils/chatUtils';

const UserMessageContent: React.FC<{ text: string }> = ({ text }) => {
  const content = useMemo(() => {
    const parts = text.split(/([@\/!]\[[^\]]+\])/g);
    return parts.map((part, index) => {
      const agentMatch = part.match(/@\[([^\]]+)\]/);
      if (agentMatch && agentMatch[1]) {
        const agentName = agentMatch[1];
        const colorClass = getAgentColorClasses(agentName).text;
        return <strong key={index} className={`font-semibold ${colorClass}`}>@{agentName}</strong>;
      }
      const teamMatch = part.match(/\/\[([^\]]+)\]/);
      if (teamMatch && teamMatch[1]) {
        const teamName = teamMatch[1];
        const colorClass = getTeamColorClasses(teamName).text;
        return <strong key={index} className={`font-semibold ${colorClass}`}>/{teamName}</strong>;
      }
      const workflowMatch = part.match(/!\[([^\]]+)\]/);
      if (workflowMatch && workflowMatch[1]) {
        const workflowName = workflowMatch[1];
        const colorClass = getWorkflowColorClasses(workflowName).text;
        return <strong key={index} className={`font-semibold ${colorClass}`}>!{workflowName}</strong>;
      }
      return <React.Fragment key={index}>{part}</React.Fragment>;
    });
  }, [text]);

  return <p className="text-white whitespace-pre-wrap">{content}</p>;
};

export default UserMessageContent;