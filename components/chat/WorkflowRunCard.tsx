import React, { useState } from 'react';
import { WorkflowRun, WorkflowStep } from '../../types';
import { Cog6ToothIcon, CheckIcon, LoaderIcon, XCircleIcon, ChevronDownIcon } from '../IconComponents';
import { getWorkflowColorClasses } from '../../utils/chatUtils';
import BotMessageContent from './BotMessageContent';

const WorkflowStepView: React.FC<{ step: WorkflowStep }> = ({ step }) => {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <div className="bg-black/20 rounded-md overflow-hidden">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex justify-between items-center p-3 text-left"
                disabled={!step.content}
            >
                <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
                        {step.status === 'running' && <LoaderIcon className="w-full h-full text-blue-400 animate-spin" />}
                        {step.status === 'completed' && <CheckIcon className="w-full h-full text-green-400" />}
                        {step.status === 'failed' && <XCircleIcon className="w-full h-full text-red-400" />}
                    </div>
                    <p className="font-bold text-gray-300">{step.name}</p>
                </div>
                {step.content && (
                    <ChevronDownIcon
                        className={`w-5 h-5 text-gray-400 transition-transform duration-300 flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                    />
                )}
            </button>
            {step.content && (
                 <div
                    className={`transition-all duration-500 ease-in-out ${
                    isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
                    }`}
                >
                    <div className="px-3 pb-3">
                        <div className="pl-4 text-sm text-gray-400 border-l-2 border-gray-700 ml-[11px]">
                            <BotMessageContent text={step.content} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


const WorkflowRunCard: React.FC<{ workflowRun: WorkflowRun }> = ({ workflowRun }) => {
    const workflowColors = getWorkflowColorClasses(workflowRun.workflow.id);
    
    return (
        <div className={`border rounded-lg bg-gray-800/50 overflow-hidden my-2 transition-all duration-300 ${workflowColors.border}`}>
            <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                    <Cog6ToothIcon className={`w-6 h-6 ${workflowColors.text} ${workflowRun.status === 'running' ? 'animate-spin' : ''}`} />
                    <div>
                        <p className="font-semibold text-gray-400 text-sm">Workflow</p>
                        <h3 className="font-bold text-white">{workflowRun.workflow.name}</h3>
                    </div>
                </div>

                <div className="space-y-2">
                    {workflowRun.steps.map((step, index) => (
                        <WorkflowStepView key={index} step={step} />
                    ))}
                </div>

                {workflowRun.finalContent && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                         <BotMessageContent text={workflowRun.finalContent} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default WorkflowRunCard;