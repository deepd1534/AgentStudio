export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${['Bytes', 'KB', 'MB', 'GB'][i]}`;
};

const AGENT_COLORS = [
  { text: 'text-cyan-400', chipBg: 'bg-cyan-600/50', chipText: 'text-cyan-200', chipRemove: 'text-cyan-300', border: 'border-cyan-500/30' },
  { text: 'text-sky-400', chipBg: 'bg-sky-600/50', chipText: 'text-sky-200', chipRemove: 'text-sky-300', border: 'border-sky-500/30' },
  { text: 'text-emerald-400', chipBg: 'bg-emerald-600/50', chipText: 'text-emerald-200', chipRemove: 'text-emerald-300', border: 'border-emerald-500/30' },
  { text: 'text-rose-400', chipBg: 'bg-rose-600/50', chipText: 'text-rose-200', chipRemove: 'text-rose-300', border: 'border-rose-500/30' },
  { text: 'text-violet-400', chipBg: 'bg-violet-600/50', chipText: 'text-violet-200', chipRemove: 'text-violet-300', border: 'border-violet-500/30' },
  { text: 'text-amber-400', chipBg: 'bg-amber-600/50', chipText: 'text-amber-200', chipRemove: 'text-amber-300', border: 'border-amber-500/30' },
  { text: 'text-lime-400', chipBg: 'bg-lime-600/50', chipText: 'text-lime-200', chipRemove: 'text-lime-300', border: 'border-lime-500/30' },
];

const TEAM_COLORS = [
    { text: 'text-emerald-400', chipBg: 'bg-emerald-600/50', chipText: 'text-emerald-200', chipRemove: 'text-emerald-300', border: 'border-emerald-500/30' },
    { text: 'text-lime-400', chipBg: 'bg-lime-600/50', chipText: 'text-lime-200', chipRemove: 'text-lime-300', border: 'border-lime-500/30' },
    { text: 'text-teal-400', chipBg: 'bg-teal-600/50', chipText: 'text-teal-200', chipRemove: 'text-teal-300', border: 'border-teal-500/30' },
    { text: 'text-green-400', chipBg: 'bg-green-600/50', chipText: 'text-green-200', chipRemove: 'text-green-300', border: 'border-green-500/30' },
];

const WORKFLOW_COLORS = [
    { text: 'text-purple-400', chipBg: 'bg-purple-600/50', chipText: 'text-purple-200', chipRemove: 'text-purple-300', border: 'border-purple-500/30' },
    { text: 'text-yellow-400', chipBg: 'bg-yellow-600/50', chipText: 'text-yellow-200', chipRemove: 'text-yellow-300', border: 'border-yellow-500/30' },
    { text: 'text-pink-400', chipBg: 'bg-pink-600/50', chipText: 'text-pink-200', chipRemove: 'text-pink-300', border: 'border-pink-500/30' },
];

const stringToHash = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
};

export const getAgentColorClasses = (agentIdOrName: string) => {
  if (!agentIdOrName) {
    return AGENT_COLORS[0];
  }
  const hash = stringToHash(agentIdOrName);
  const index = hash % AGENT_COLORS.length;
  return AGENT_COLORS[index];
};

export const getTeamColorClasses = (teamIdOrName: string) => {
    if (!teamIdOrName) {
      return TEAM_COLORS[0];
    }
    const hash = stringToHash(teamIdOrName);
    const index = hash % TEAM_COLORS.length;
    return TEAM_COLORS[index];
};

export const getWorkflowColorClasses = (workflowIdOrName: string) => {
  if (!workflowIdOrName) {
    return WORKFLOW_COLORS[0];
  }
  const hash = stringToHash(workflowIdOrName);
  const index = hash % WORKFLOW_COLORS.length;
  return WORKFLOW_COLORS[index];
};