import React, { useState } from 'react';
import ParticleBackground from './components/ParticleBackground';
import Dashboard from './views/Dashboard';
import BlogAgentWorkspace from './views/BlogAgentWorkspace';

type View = 'dashboard' | 'blogAgent';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');

  const handleSelectAgent = (agent: string) => {
    if (agent === 'blogAgent') {
      setCurrentView('blogAgent');
    }
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
  };

  return (
    <div className="relative min-h-screen w-full bg-gray-900 text-white overflow-hidden">
      <ParticleBackground />
      <div className="relative z-10">
        {currentView === 'dashboard' && <Dashboard onSelectAgent={handleSelectAgent} />}
        {currentView === 'blogAgent' && <BlogAgentWorkspace onBack={handleBackToDashboard} />}
      </div>
    </div>
  );
};

export default App;
