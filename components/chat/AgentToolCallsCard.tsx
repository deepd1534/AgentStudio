import React, { useState } from 'react';
import { Agent, AgentToolCall } from '../../types';
import { getAgentColorClasses } from '../../utils/chatUtils';
import { Cog6ToothIcon, CheckIcon, LoaderIcon, XCircleIcon, ChevronDownIcon } from '../IconComponents';
import BotMessageContent from './BotMessageContent';

// A sub-component for a single tool call, similar to WorkflowStepView
const AgentToolCallView: React.FC<{ toolCall: AgentToolCall }> = ({ toolCall }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const hasDetails = toolCall.args && Object.keys(toolCall.args).length > 0 || toolCall.output;

    return (
        <div className="bg-black/20 rounded-md overflow-hidden">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex justify-between items-center p-3 text-left"
                disabled={!hasDetails}
            >
                <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
                        {toolCall.status === 'running' && <LoaderIcon className="w-full h-full text-blue-400 animate-spin" />}
                        {toolCall.status === 'completed' && <CheckIcon className="w-full h-full text-green-400" />}
                        {toolCall.status === 'failed' && <XCircleIcon className="w-full h-full text-red-400" />}
                    </div>
                    <p className="font-bold text-gray-300">{toolCall.name}</p>
                </div>
                {hasDetails && (
                    <ChevronDownIcon
                        className={`w-5 h-5 text-gray-400 transition-transform duration-300 flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                    />
                )}
            </button>
            {hasDetails && (
                 <div
                    className={`transition-all duration-500 ease-in-out ${
                    isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
                    }`}
                >
                    <div className="px-3 pb-3">
                        <div className="pl-4 text-sm text-gray-400 border-l-2 border-gray-700 ml-[11px] space-y-2">
                           {toolCall.args && Object.keys(toolCall.args).length > 0 && (
                               <div>
                                   <h4 className="font-semibold text-gray-300 mb-1">Arguments:</h4>
                                   <pre className="text-xs bg-black/30 p-2 rounded custom-scrollbar overflow-auto"><code>{JSON.stringify(toolCall.args, null, 2)}</code></pre>
                               </div>
                           )}
                           {toolCall.output && (
                               <div>
                                   <h4 className="font-semibold text-gray-300 mb-1">{toolCall.status === 'failed' ? 'Error:' : 'Output:'}</h4>
                                   <div className={`text-xs bg-black/30 p-2 rounded ${toolCall.status === 'failed' ? 'text-red-300' : ''}`}>
                                        <BotMessageContent text={toolCall.output} />
                                    </div>
                               </div>
                           )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


interface AgentToolCallsCardProps {
    toolCalls: AgentToolCall[];
    agent: Agent;
}

const AgentToolCallsCard: React.FC<AgentToolCallsCardProps> = ({ toolCalls, agent }) => {
    const agentColors = getAgentColorClasses(agent.id);
    const isRunning = toolCalls.some(tc => tc.status === 'running');
    
    return (
        <div className={`border rounded-lg bg-gray-800/50 overflow-hidden my-2 transition-all duration-300 ${agentColors.border}`}>
            <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                    <Cog6ToothIcon className={`w-6 h-6 ${agentColors.text} ${isRunning ? 'animate-spin' : ''}`} />
                    <div>
                        <p className="font-semibold text-gray-400 text-sm">Agent Tool Calls</p>
                        <h3 className={`font-bold text-white`}>{agent.name}</h3>
                    </div>
                </div>

                <div className="space-y-2">
                    {toolCalls.map((tc) => (
                        <AgentToolCallView key={tc.id} toolCall={tc} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AgentToolCallsCard;
