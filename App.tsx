import React, { useState } from 'react';
import ParticleBackground from './components/ParticleBackground';
import CosmosBackground from './components/CosmosBackground';
import Dashboard from './views/Dashboard';
import BlogAgentWorkspace from './views/BlogAgentWorkspace';
import SavedBlogs from './views/SavedBlogs';

type View = 'dashboard' | 'blogAgent' | 'savedBlogs';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [animationClass, setAnimationClass] = useState('animate-fade-in');

  const switchView = (view: View) => {
    if (view === currentView) return;

    setAnimationClass('animate-zoom-out-fade');

    setTimeout(() => {
      setCurrentView(view);
      setAnimationClass('animate-zoom-in-fade');
    }, 400); // Corresponds to animation duration
  };


  const handleSelectAgent = (agent: string) => {
    if (agent === 'blogAgent') {
      switchView('blogAgent');
    }
  };

  const handleBackToDashboard = () => {
    switchView('dashboard');
  };

  const handleGoToSavedBlogs = () => {
    switchView('savedBlogs');
  };

  return (
    <div className="relative min-h-screen w-full bg-gray-900 text-white overflow-hidden">
      <CosmosBackground />
      <ParticleBackground />
      <div className={`relative z-10 ${animationClass}`}>
        {currentView === 'dashboard' && <Dashboard onSelectAgent={handleSelectAgent} />}
        {currentView === 'blogAgent' && <BlogAgentWorkspace onBack={handleBackToDashboard} onGoToSaved={handleGoToSavedBlogs} />}
        {currentView === 'savedBlogs' && <SavedBlogs onBack={() => switchView('blogAgent')} />}
      </div>
    </div>
  );
};

export default App;
