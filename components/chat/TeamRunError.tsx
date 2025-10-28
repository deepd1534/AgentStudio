import React from 'react';
import { XCircleIcon } from '../IconComponents';

interface TeamRunErrorProps {
    error: string;
}

const TeamRunError: React.FC<TeamRunErrorProps> = ({ error }) => {
    return (
        <div className="border border-red-500/50 bg-red-900/20 rounded-lg p-4 my-2 animate-fade-in">
            <div className="flex items-start gap-3">
                <XCircleIcon className="w-6 h-6 text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                    <h4 className="font-bold text-red-300">An error occurred</h4>
                    <p className="text-red-300/90 text-sm mt-1">{error}</p>
                </div>
            </div>
        </div>
    )
};

export default TeamRunError;
