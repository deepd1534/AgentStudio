export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${['Bytes', 'KB', 'MB', 'GB'][i]}`;
};

const AGENT_COLORS = [
  { text: 'text-cyan-400', chipBg: 'bg-cyan-600/50', chipText: 'text-cyan-200', chipRemove: 'text-cyan-300' },
  { text: 'text-sky-400', chipBg: 'bg-sky-600/50', chipText: 'text-sky-200', chipRemove: 'text-sky-300' },
  { text: 'text-emerald-400', chipBg: 'bg-emerald-600/50', chipText: 'text-emerald-200', chipRemove: 'text-emerald-300' },
  { text: 'text-rose-400', chipBg: 'bg-rose-600/50', chipText: 'text-rose-200', chipRemove: 'text-rose-300' },
  { text: 'text-violet-400', chipBg: 'bg-violet-600/50', chipText: 'text-violet-200', chipRemove: 'text-violet-300' },
  { text: 'text-amber-400', chipBg: 'bg-amber-600/50', chipText: 'text-amber-200', chipRemove: 'text-amber-300' },
  { text: 'text-lime-400', chipBg: 'bg-lime-600/50', chipText: 'text-lime-200', chipRemove: 'text-lime-300' },
];

const TEAM_COLORS = [
    { text: 'text-emerald-400', chipBg: 'bg-emerald-600/50', chipText: 'text-emerald-200', chipRemove: 'text-emerald-300' },
    { text: 'text-lime-400', chipBg: 'bg-lime-600/50', chipText: 'text-lime-200', chipRemove: 'text-lime-300' },
    { text: 'text-teal-400', chipBg: 'bg-teal-600/50', chipText: 'text-teal-200', chipRemove: 'text-teal-300' },
    { text: 'text-green-400', chipBg: 'bg-green-600/50', chipText: 'text-green-200', chipRemove: 'text-green-300' },
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
