import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Tone, BlogAgentRequest, BlogAgentResponse } from '../types';
import { ArrowLeftIcon, SparklesIcon, EditIcon, LoaderIcon, PlusCircleIcon, ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon, ChevronDownIcon, MagnifyingGlassIcon, FireIcon } from '../components/IconComponents';
import BlogOutputDisplay from '../components/BlogOutputDisplay';

const BlogAgentWorkspace: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [sessionId, setSessionId] = useState('');
  const [formData, setFormData] = useState<Omit<BlogAgentRequest, 'session_id'>>({
    content: '',
    target_audience: '',
    tone: Tone.PROFESSIONAL,
    word_count: 1000,
    include_seo: true,
    is_hackernews: false,
    is_duckduckgo: false,
    feedback: '',
  });
  const [isCustomTone, setIsCustomTone] = useState(false);
  
  const [generationHistory, setGenerationHistory] = useState<BlogAgentResponse[]>([]);
  const [currentGenerationIndex, setCurrentGenerationIndex] = useState(0);
  const [showForm, setShowForm] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formRef = useRef<HTMLDivElement>(null);

  // Generate initial session ID on component mount
  useEffect(() => {
    setSessionId(crypto.randomUUID());
  }, []);

  // Scroll to form on regeneration
  useEffect(() => {
    if (showForm && generationHistory.length > 0) {
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [showForm, generationHistory.length]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
        setFormData(prev => ({ ...prev, [name]: parseInt(value, 10) || 0 }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    const isRegeneration = generationHistory.length > 0;

    const requestBody: BlogAgentRequest = {
      ...formData,
      content: isRegeneration ? '' : formData.content,
      session_id: sessionId,
    };

    console.log('Sending request:', JSON.stringify(requestBody, null, 2));

    try {
      const response = await fetch('http://localhost:3000/blog-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: BlogAgentResponse = await response.json();
      const newHistory = [...generationHistory, data];
      setGenerationHistory(newHistory);
      setCurrentGenerationIndex(newHistory.length - 1);
      setShowForm(false);
    } catch (err) {
      setError('Failed to generate blog. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [formData, sessionId, generationHistory]);

  const handleWordCountIncrease = useCallback(() => {
    setFormData(prev => ({ ...prev, word_count: (prev.word_count || 0) + 10 }));
  }, []);

  const handleWordCountDecrease = useCallback(() => {
    setFormData(prev => ({ ...prev, word_count: Math.max(0, (prev.word_count || 0) - 10) }));
  }, []);
  
  const handleRegenerate = () => {
    setShowForm(true);
  }

  const handleNewSession = () => {
    setSessionId(crypto.randomUUID());
    setFormData({
        content: '',
        target_audience: '',
        tone: Tone.PROFESSIONAL,
        word_count: 1000,
        include_seo: true,
        is_hackernews: false,
        is_duckduckgo: false,
        feedback: '',
    });
    setGenerationHistory([]);
    setCurrentGenerationIndex(0);
    setError(null);
    setShowForm(true);
    setIsCustomTone(false);
    window.scrollTo(0, 0);
  };

  const handlePrevGeneration = () => {
    if (currentGenerationIndex > 0) {
        setCurrentGenerationIndex(currentGenerationIndex - 1);
    }
  };

  const handleNextGeneration = () => {
      if (currentGenerationIndex < generationHistory.length - 1) {
          setCurrentGenerationIndex(currentGenerationIndex + 1);
      }
  };

  const currentGeneration = generationHistory[currentGenerationIndex];

  return (
    <div className="min-h-screen w-full max-w-5xl mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-8">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group">
            <ArrowLeftIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Back to Studio
        </button>
        <button onClick={handleNewSession} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group">
            <PlusCircleIcon className="w-6 h-6" />
            New Session
        </button>
      </div>

      {currentGeneration && (
        <div className={showForm ? 'pb-12 border-b border-white/10 mb-12' : ''}>
          {generationHistory.length > 1 && (
            <div className="flex justify-center items-center gap-6 mb-8 animate-fade-in">
              <button 
                onClick={handlePrevGeneration} 
                disabled={currentGenerationIndex === 0} 
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Previous Generation"
              >
                <ChevronLeftIcon className="w-6 h-6" />
              </button>
              <span className="text-gray-300 font-semibold tracking-wider">
                Generation {currentGenerationIndex + 1} of {generationHistory.length}
              </span>
              <button 
                onClick={handleNextGeneration} 
                disabled={currentGenerationIndex === generationHistory.length - 1} 
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Next Generation"
              >
                <ChevronRightIcon className="w-6 h-6" />
              </button>
            </div>
          )}
          <BlogOutputDisplay 
              key={currentGeneration.traceId}
              blogData={currentGeneration.blog_content} 
              traceId={currentGeneration.traceId} 
              generatedAt={currentGeneration.generated_at} 
          />
        </div>
      )}

      {!showForm && currentGeneration && (
          <button
            onClick={handleRegenerate}
            className="fixed bottom-8 right-8 z-50 flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-full shadow-lg shadow-blue-500/30 transform hover:scale-105 transition-all duration-300"
        >
            <EditIcon className="w-5 h-5" />
            <span>Tweak & Regenerate</span>
        </button>
      )}

      {showForm && (
        <div ref={formRef} className="flex flex-col items-center">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 py-6 px-4">
            {generationHistory.length > 0 ? 'Tweak & Regenerate' : 'Blog Agent'}
          </h1>
          <p className="text-gray-400 text-center mb-12">
            {generationHistory.length > 0 ? 'Adjust the settings below and generate a new version.' : 'Fill in the details below to generate your next masterpiece.'}
          </p>

          <form onSubmit={handleSubmit} className="w-full space-y-8">
            {/* Input Area */}
            <div className="relative">
              <textarea
                name="content"
                id="content"
                rows={8}
                value={formData.content}
                onChange={handleChange}
                placeholder=" "
                readOnly={generationHistory.length > 0}
                className={`block px-4 pb-4 pt-6 w-full text-lg text-white rounded-lg border border-white/20 appearance-none focus:outline-none focus:ring-0 focus:border-blue-400 peer transition-colors custom-scrollbar ${generationHistory.length > 0 ? 'bg-gray-800/50 cursor-not-allowed' : 'bg-white/5'}`}
              />
              <label htmlFor="content" className="absolute text-lg text-gray-400 duration-300 transform -translate-y-4 scale-75 top-5 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4">
                {generationHistory.length > 0 ? 'Raw Content (Locked for Regeneration)' : 'Paste your raw content here...'}
              </label>
            </div>

            {/* Parameter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:items-start">
              {/* Target Audience */}
              <div className="relative">
                <input type="text" id="target_audience" name="target_audience" value={formData.target_audience} onChange={handleChange} className="block px-4 pb-2.5 pt-5 w-full text-lg text-white bg-white/5 rounded-lg border border-white/20 appearance-none focus:outline-none focus:ring-0 focus:border-blue-400 peer transition-colors" placeholder=" " />
                <label htmlFor="target_audience" className="absolute text-lg text-gray-400 duration-300 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4">Target Audience</label>
              </div>

              {/* Tone */}
              <div className="relative">
                {isCustomTone ? (
                  <div className="relative">
                    <input 
                      type="text" 
                      id="tone" 
                      name="tone" 
                      value={formData.tone} 
                      onChange={handleChange} 
                      className="block px-4 pb-2.5 pt-5 w-full text-lg text-white bg-white/5 rounded-lg border border-white/20 appearance-none focus:outline-none focus:ring-0 focus:border-blue-400 peer transition-colors" 
                      placeholder=" "
                      autoFocus
                    />
                    <label htmlFor="tone" className="absolute text-lg text-gray-400 duration-300 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4">
                      Custom Tone
                    </label>
                    <button 
                      type="button" 
                      onClick={() => { setIsCustomTone(false); setFormData(prev => ({...prev, tone: Tone.PROFESSIONAL}))}}
                      className="absolute top-1/2 right-3 -translate-y-1/2 text-xs text-blue-300 hover:text-blue-200 bg-white/5 px-2 py-1 rounded-md transition-colors"
                      title="Select from presets"
                    >
                      Presets
                    </button>
                  </div>
                ) : (
                  <>
                    <select 
                      id="tone" 
                      name="tone" 
                      value={formData.tone} 
                      onChange={(e) => {
                        if (e.target.value === 'custom') {
                          setIsCustomTone(true);
                          setFormData(prev => ({ ...prev, tone: '' }));
                        } else {
                          handleChange(e);
                        }
                      }} 
                      className="block px-4 pb-2.5 pt-5 w-full text-lg text-white bg-white/5 rounded-lg border border-white/20 appearance-none focus:outline-none focus:ring-0 focus:border-blue-400 peer transition-colors bg-transparent"
                    >
                      {Object.values(Tone).map(toneValue => (
                        <option key={toneValue} value={toneValue} className="bg-gray-800 text-white">{toneValue}</option>
                      ))}
                      <option value="custom" className="bg-gray-700 text-blue-300 font-semibold">Custom...</option>
                    </select>
                    <label htmlFor="tone" className="absolute text-lg text-gray-400 duration-300 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4">Tone</label>
                  </>
                )}
              </div>

              {/* Word Count */}
              <div className="relative">
                <input 
                  type="number" 
                  id="word_count" 
                  name="word_count" 
                  value={formData.word_count} 
                  onChange={handleChange} 
                  className="block px-4 pr-10 pb-2.5 pt-5 w-full text-lg text-white bg-white/5 rounded-lg border border-white/20 appearance-none focus:outline-none focus:ring-0 focus:border-blue-400 peer transition-colors hide-number-spinner"
                  placeholder=" " 
                />
                <label htmlFor="word_count" className="absolute text-lg text-gray-400 duration-300 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4">Word Count</label>
                <div className="absolute top-0 right-0 h-full flex flex-col justify-center pr-3">
                    <button type="button" aria-label="Increase word count" onClick={handleWordCountIncrease} className="h-1/2 flex items-end pb-1 text-gray-500 hover:text-white transition-colors focus:outline-none">
                        <ChevronUpIcon className="w-4 h-4" />
                    </button>
                    <button type="button" aria-label="Decrease word count" onClick={handleWordCountDecrease} className="h-1/2 flex items-start pt-1 text-gray-500 hover:text-white transition-colors focus:outline-none">
                        <ChevronDownIcon className="w-4 h-4" />
                    </button>
                </div>
              </div>

              {/* Toggles Container */}
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                    {/* SEO Checkbox */}
                    <div className="flex items-center justify-center bg-white/5 rounded-lg border border-white/20 p-4">
                    <label htmlFor="include_seo" className="flex items-center cursor-pointer group">
                        <div className="relative">
                        <input type="checkbox" id="include_seo" name="include_seo" checked={formData.include_seo} onChange={handleChange} className="sr-only peer" />
                        <div className="w-14 h-8 bg-gray-700 rounded-full peer-checked:bg-blue-500 transition-colors duration-300 ease-in-out"></div>
                        <div className="absolute left-1 top-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 ease-in-out peer-checked:translate-x-6 flex items-center justify-center shadow-md">
                            <MagnifyingGlassIcon className="w-4 h-4 text-gray-700 peer-checked:text-blue-500 transition-colors" />
                        </div>
                        </div>
                        <span className="ml-4 text-lg text-gray-300 font-semibold group-hover:text-white transition-colors">SEO</span>
                    </label>
                    </div>
                    {/* HackerNews Checkbox */}
                    <div className="flex items-center justify-center bg-white/5 rounded-lg border border-white/20 p-4">
                    <label htmlFor="is_hackernews" className="flex items-center cursor-pointer group">
                        <div className="relative">
                        <input type="checkbox" id="is_hackernews" name="is_hackernews" checked={formData.is_hackernews} onChange={handleChange} className="sr-only peer" />
                        <div className="w-14 h-8 bg-gray-700 rounded-full peer-checked:bg-orange-500 transition-colors duration-300 ease-in-out"></div>
                        <div className="absolute left-1 top-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 ease-in-out peer-checked:translate-x-6 flex items-center justify-center shadow-md">
                            <FireIcon className="w-4 h-4 text-gray-700 peer-checked:text-orange-500 transition-colors" />
                        </div>
                        </div>
                        <span className="ml-4 text-lg text-gray-300 font-semibold group-hover:text-white transition-colors">HackerNews</span>
                    </label>
                    </div>
                </div>
                 {/* DuckDuckGo Checkbox */}
                 <div className="flex items-center justify-center bg-white/5 rounded-lg border border-white/20 p-4">
                  <label htmlFor="is_duckduckgo" className="flex items-center cursor-pointer group">
                    <div className="relative">
                      <input type="checkbox" id="is_duckduckgo" name="is_duckduckgo" checked={formData.is_duckduckgo} onChange={handleChange} className="sr-only peer" />
                      <div className="w-14 h-8 bg-gray-700 rounded-full peer-checked:bg-red-500 transition-colors duration-300 ease-in-out"></div>
                      <div className="absolute left-1 top-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 ease-in-out peer-checked:translate-x-6 flex items-center justify-center shadow-md">
                        <img src="/assets/icons8-duckduckgo.svg" alt="DuckDuckGo logo" className="w-4 h-4" />
                      </div>
                    </div>
                    <span className="ml-4 text-lg text-gray-300 font-semibold group-hover:text-white transition-colors">DuckDuckGo</span>
                  </label>
                </div>
              </div>

            </div>
            
             {/* Feedback - Only show after the first generation */}
             {generationHistory.length > 0 && (
                <div className="relative animate-fade-in">
                    <textarea
                        name="feedback"
                        id="feedback"
                        rows={3}
                        value={formData.feedback}
                        onChange={handleChange}
                        placeholder=" "
                        className="block px-4 pb-4 pt-6 w-full text-lg text-white bg-white/5 rounded-lg border border-white/20 appearance-none focus:outline-none focus:ring-0 focus:border-blue-400 peer transition-colors"
                    />
                    <label htmlFor="feedback" className="absolute text-lg text-gray-400 duration-300 transform -translate-y-4 scale-75 top-5 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4">
                        Provide feedback for regeneration...
                    </label>
                </div>
             )}

            {/* Submit Button */}
            <div className="flex justify-center pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center justify-center gap-3 w-full md:w-auto bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white font-bold py-4 px-12 rounded-lg shadow-lg shadow-blue-500/30 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <LoaderIcon className="w-6 h-6 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-6 h-6" />
                    <span>{generationHistory.length === 0 ? 'Generate Blog' : 'Regenerate Blog'}</span>
                  </>
                )}
              </button>
            </div>
            {error && <p className="text-center text-red-400 mt-4">{error}</p>}
          </form>
        </div>
      )}
    </div>
  );
};

export default BlogAgentWorkspace;