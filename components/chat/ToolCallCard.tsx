import React, { useState } from 'react';
import { Team, ToolCall } from '../../types';
import { ChevronDownIcon, Cog6ToothIcon, UserIcon } from '../IconComponents';
import { getTeamColorClasses } from '../../utils/chatUtils';

interface ToolCallCardProps {
  toolCall: ToolCall;
  team: Team;
}

const ToolCallCard: React.FC<ToolCallCardProps> = ({ toolCall, team }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const teamColors = getTeamColorClasses(team.id);

    return (
        <div className={`border rounded-lg bg-gray-800/50 overflow-hidden my-2 transition-all duration-300 ${isCollapsed ? 'border-white/10' : teamColors.border}`}>
            <button 
                onClick={() => setIsCollapsed(!isCollapsed)} 
                className="w-full flex justify-between items-center p-3 text-left"
                aria-expanded={!isCollapsed}
            >
                <div className="flex items-center gap-3">
                    <Cog6ToothIcon className={`w-5 h-5 ${teamColors.text} transition-transform duration-500 ${isCollapsed ? '' : 'rotate-90'}`} />
                    <span className="font-semibold text-white">{toolCall.toolName}</span>
                </div>
                <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${!isCollapsed ? 'rotate-180' : ''}`} />
            </button>
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isCollapsed ? 'max-h-0' : 'max-h-96'}`}>
                <div className="px-4 pb-4 pt-2 border-t border-white/10 space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                        <UserIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-400">Delegated to:</span>
                        <span className="font-semibold text-white truncate">{toolCall.delegatedToAgentName}</span>
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm mb-1">Task:</p>
                        <p className="text-gray-200 bg-black/20 p-3 rounded-md text-sm whitespace-pre-wrap">{toolCall.toolArgs.task}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ToolCallCard;
