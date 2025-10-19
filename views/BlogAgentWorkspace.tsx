import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Tone, Audience, BlogAgentRequest, BlogAgentResponse } from '../types';
import { ArrowLeftIcon, SparklesIcon, EditIcon, LoaderIcon, PlusCircleIcon, ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon, ChevronDownIcon, MagnifyingGlassIcon, FireIcon, GoogleIcon, PlusIcon, LinkIcon, XMarkIcon, BookmarkIcon } from '../components/IconComponents';
import BlogOutputDisplay from '../components/BlogOutputDisplay';

interface BlogAgentFormState {
  content: string;
  target_audience: string;
  tone: string;
  word_count: number;
  include_seo: boolean;
  is_hackernews: boolean;
  is_duckduckgo: boolean;
  is_google_search: boolean;
  urls: string[];
  feedback: string;
}

const BlogAgentWorkspace: React.FC<{ onBack: () => void; onGoToSaved: () => void; }> = ({ onBack, onGoToSaved }) => {
  const [sessionId, setSessionId] = useState('');
  const [formData, setFormData] = useState<BlogAgentFormState>({
    content: '',
    target_audience: Audience.GENERAL,
    tone: Tone.PROFESSIONAL,
    word_count: 1000,
    include_seo: true,
    is_hackernews: false,
    is_duckduckgo: false,
    is_google_search: false,
    urls: [],
    feedback: '',
  });
  const [currentUrl, setCurrentUrl] = useState('');
  const [isCustomTone, setIsCustomTone] = useState(false);
  const [isCustomAudience, setIsCustomAudience] = useState(false);
  
  const [generationHistory, setGenerationHistory] = useState<BlogAgentResponse[]>([]);
  const [currentGenerationIndex, setCurrentGenerationIndex] = useState(0);
  const [showForm, setShowForm] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formRef = useRef<HTMLDivElement>(null);
  const prevGenerationCount = useRef(generationHistory.length);

  // Generate initial session ID on component mount
  useEffect(() => {
    setSessionId(crypto.randomUUID());
  }, []);

  // Scroll to form when user clicks "Tweak & Regenerate"
  useEffect(() => {
    if (showForm && generationHistory.length > 0) {
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [showForm, generationHistory.length]);
  
  // Scroll to top when a new blog is generated
  useEffect(() => {
    if (generationHistory.length > prevGenerationCount.current) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    prevGenerationCount.current = generationHistory.length;
  }, [generationHistory.length]);


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
      session_id: sessionId,
      content: isRegeneration ? '' : formData.content,
      target_audience: formData.target_audience,
      tone: formData.tone,
      word_count: formData.word_count,
      include_seo: formData.include_seo,
      is_hackernews: formData.is_hackernews,
      is_duckduckgo: formData.is_duckduckgo,
      is_google_search: formData.is_google_search,
      feedback: formData.feedback,
    };

    if (formData.urls && formData.urls.length > 0) {
      requestBody.url_context = formData.urls;
    }

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
        target_audience: Audience.GENERAL,
        tone: Tone.PROFESSIONAL,
        word_count: 1000,
        include_seo: true,
        is_hackernews: false,
        is_duckduckgo: false,
        is_google_search: false,
        urls: [],
        feedback: '',
    });
    setCurrentUrl('');
    setGenerationHistory([]);
    setCurrentGenerationIndex(0);
    setError(null);
    setShowForm(true);
    setIsCustomTone(false);
    setIsCustomAudience(false);
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

  const handleAddUrl = () => {
    let urlToAdd = currentUrl.trim();
    if (urlToAdd) {
      // Prepend https:// if no protocol is present to make URL validation more robust
      if (!/^https?:\/\//i.test(urlToAdd)) {
        urlToAdd = 'https://' + urlToAdd;
      }

      try {
        // Add URL if it's not already in the list
        if (!formData.urls.includes(urlToAdd)) {
          setFormData(prev => ({ ...prev, urls: [...prev.urls, urlToAdd] }));
        }
        
        setCurrentUrl('');
      } catch (e) {
        // If URL is still invalid after prepending protocol, log error.
        // In a future iteration, we could show a user-facing error message.
        console.error("Invalid URL provided:", currentUrl);
      }
    }
  };

  const handleRemoveUrl = (indexToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      urls: prev.urls.filter((_, index) => index !== indexToRemove),
    }));
  };
  
  const handleUrlInputKeydown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddUrl();
    }
  }


  const currentGeneration = generationHistory[currentGenerationIndex];

  return (
    <div className="min-h-screen w-full max-w-5xl mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-8">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group">
            <ArrowLeftIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Back to Studio
        </button>
        <div className="flex items-center gap-6">
          <button onClick={onGoToSaved} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group">
            <BookmarkIcon className="w-6 h-6" />
            Saved Blogs
          </button>
          <button onClick={handleNewSession} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group">
              <PlusCircleIcon className="w-6 h-6" />
              New Session
          </button>
        </div>
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
        <>
          <div className="fixed bottom-0 left-0 w-full h-2/3 bg-gradient-to-t from-gray-900 via-gray-900/90 to-transparent pointer-events-none z-20" />
          <div ref={formRef} className="relative z-30 flex flex-col items-center">
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
                  {generationHistory.length > 0 ? 'Raw Content (Locked for Regeneration)' : 'Enter a topic or paste your raw content...'}
                </label>
              </div>

              {/* Parameter Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:items-start">
                {/* Left Column */}
                <div className="space-y-8 flex flex-col h-full">
                  {/* Target Audience */}
                  <div className="relative">
                    {isCustomAudience ? (
                      <div className="relative">
                        <input 
                          type="text" 
                          id="target_audience" 
                          name="target_audience" 
                          value={formData.target_audience} 
                          onChange={handleChange} 
                          className="block px-4 pb-2.5 pt-6 w-full text-lg text-white bg-white/5 rounded-lg border border-white/20 appearance-none focus:outline-none focus:ring-0 focus:border-blue-400 peer transition-colors" 
                          placeholder=" "
                          autoFocus
                        />
                        <label htmlFor="target_audience" className="absolute text-lg text-gray-400 duration-300 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4">
                          Custom Audience
                        </label>
                        <button 
                          type="button" 
                          onClick={() => { setIsCustomAudience(false); setFormData(prev => ({...prev, target_audience: Audience.GENERAL}))}}
                          className="absolute top-1/2 right-3 -translate-y-1/2 text-xs text-blue-300 hover:text-blue-200 bg-white/5 px-2 py-1 rounded-md transition-colors"
                          title="Select from presets"
                        >
                          Presets
                        </button>
                      </div>
                    ) : (
                      <>
                        <select 
                          id="target_audience" 
                          name="target_audience" 
                          value={formData.target_audience} 
                          onChange={(e) => {
                            if (e.target.value === 'custom') {
                              setIsCustomAudience(true);
                              setFormData(prev => ({ ...prev, target_audience: '' }));
                            } else {
                              handleChange(e);
                            }
                          }} 
                          className="block px-4 pb-2.5 pt-6 w-full text-lg text-white bg-white/5 rounded-lg border border-white/20 appearance-none focus:outline-none focus:ring-0 focus:border-blue-400 peer transition-colors bg-transparent"
                        >
                          {Object.values(Audience).map(audienceValue => (
                            <option key={audienceValue} value={audienceValue} className="bg-gray-800 text-white">{audienceValue}</option>
                          ))}
                          <option value="custom" className="bg-gray-700 text-blue-300 font-semibold">Custom...</option>
                        </select>
                        <label htmlFor="target_audience" className="absolute text-lg text-gray-400 duration-300 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4">Target Audience</label>
                      </>
                    )}
                  </div>
                  
                  {/* URL Context */}
                  <fieldset className="bg-white/5 rounded-lg border border-white/20 p-6 flex flex-col flex-grow min-w-0">
                      <legend className="px-2 text-lg font-semibold text-gray-400">URL Context</legend>
                      <div className="space-y-4 pt-2 flex flex-col flex-grow">
                          <div className="relative flex items-center">
                              <input 
                                  type="url" 
                                  id="url_context" 
                                  value={currentUrl}
                                  onChange={(e) => setCurrentUrl(e.target.value)}
                                  onKeyDown={handleUrlInputKeydown}
                                  className="block pl-4 pr-12 pb-2.5 pt-6 w-full text-lg text-white bg-black/20 rounded-lg border border-white/20 appearance-none focus:outline-none focus:ring-0 focus:border-blue-400 peer transition-colors" 
                                  placeholder=" "
                              />
                              <label htmlFor="url_context" className="absolute text-lg text-gray-400 duration-300 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4">
                                  Add a URL for context...
                              </label>
                              <button
                                  type="button"
                                  onClick={handleAddUrl}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-blue-600 hover:bg-blue-500 transition-colors disabled:opacity-50"
                                  aria-label="Add URL"
                                  disabled={!currentUrl.trim()}
                              >
                                  <PlusIcon className="w-5 h-5 text-white" />
                              </button>
                          </div>

                          {formData.urls && formData.urls.length > 0 && (
                              <div className="max-h-48 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                  {formData.urls.map((url, index) => (
                                      <div key={index} className="flex items-center gap-3 p-3 bg-black/30 rounded-md animate-fade-in">
                                          <LinkIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                          <a href={url} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-0 text-gray-300 truncate hover:text-blue-300 transition-colors" title={url}>
                                              {url}
                                          </a>
                                          <button 
                                              type="button" 
                                              onClick={() => handleRemoveUrl(index)}
                                              className="p-1 rounded-full hover:bg-white/10 transition-colors flex-shrink-0"
                                              aria-label={`Remove ${url}`}
                                          >
                                              <XMarkIcon className="w-4 h-4 text-gray-500 hover:text-red-400" />
                                          </button>
                                      </div>
                                  ))}
                              </div>
                          )}
                      </div>
                  </fieldset>
                </div>

                {/* Right Column */}
                <div className="space-y-8 flex flex-col">
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
                          className="block px-4 pb-2.5 pt-6 w-full text-lg text-white bg-white/5 rounded-lg border border-white/20 appearance-none focus:outline-none focus:ring-0 focus:border-blue-400 peer transition-colors" 
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
                          className="block px-4 pb-2.5 pt-6 w-full text-lg text-white bg-white/5 rounded-lg border border-white/20 appearance-none focus:outline-none focus:ring-0 focus:border-blue-400 peer transition-colors bg-transparent"
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
                      className="block px-4 pr-10 pb-2.5 pt-6 w-full text-lg text-white bg-white/5 rounded-lg border border-white/20 appearance-none focus:outline-none focus:ring-0 focus:border-blue-400 peer transition-colors hide-number-spinner"
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

                  {/* Sources & Optimization */}
                  <fieldset className="bg-white/5 rounded-lg border border-white/20 p-6">
                    <legend className="px-2 text-lg font-semibold text-gray-400">Sources & Optimization</legend>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-5 pt-2">
                      {/* SEO Checkbox */}
                      <label htmlFor="include_seo" className="flex items-center cursor-pointer group">
                        <div className="relative">
                          <input type="checkbox" id="include_seo" name="include_seo" checked={formData.include_seo} onChange={handleChange} className="sr-only peer" />
                          <div className="w-10 h-6 bg-gray-700 rounded-full peer-checked:bg-blue-500 transition-colors duration-300 ease-in-out"></div>
                          <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-300 ease-in-out peer-checked:translate-x-4 flex items-center justify-center shadow-md">
                            <MagnifyingGlassIcon className="w-3 h-3 text-gray-700 peer-checked:text-blue-500 transition-colors" />
                          </div>
                        </div>
                        <span className="ml-3 text-sm text-gray-300 font-semibold group-hover:text-white transition-colors">SEO</span>
                      </label>

                      {/* HackerNews Checkbox */}
                      <label htmlFor="is_hackernews" className="flex items-center cursor-pointer group">
                          <div className="relative">
                          <input type="checkbox" id="is_hackernews" name="is_hackernews" checked={formData.is_hackernews} onChange={handleChange} className="sr-only peer" />
                          <div className="w-10 h-6 bg-gray-700 rounded-full peer-checked:bg-orange-500 transition-colors duration-300 ease-in-out"></div>
                          <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-300 ease-in-out peer-checked:translate-x-4 flex items-center justify-center shadow-md">
                              <FireIcon className="w-3 h-3 text-gray-700 peer-checked:text-orange-500 transition-colors" />
                          </div>
                          </div>
                          <span className="ml-3 text-sm text-gray-300 font-semibold group-hover:text-white transition-colors">HackerNews</span>
                      </label>
                      
                      {/* DuckDuckGo Checkbox */}
                      <label htmlFor="is_duckduckgo" className="flex items-center cursor-pointer group">
                        <div className="relative">
                          <input type="checkbox" id="is_duckduckgo" name="is_duckduckgo" checked={formData.is_duckduckgo} onChange={handleChange} className="sr-only peer" />
                          <div className="w-10 h-6 bg-gray-700 rounded-full peer-checked:bg-red-500 transition-colors duration-300 ease-in-out"></div>
                          <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-300 ease-in-out peer-checked:translate-x-4 flex items-center justify-center shadow-md">
                            <img src="/assets/icons8-duckduckgo.svg" alt="DuckDuckGo logo" className="w-3 h-3" />
                          </div>
                        </div>
                        <span className="ml-3 text-sm text-gray-300 font-semibold group-hover:text-white transition-colors">DuckDuckGo</span>
                      </label>

                      {/* Google Search Checkbox */}
                      <label htmlFor="is_google_search" className="flex items-center cursor-pointer group">
                        <div className="relative">
                          <input type="checkbox" id="is_google_search" name="is_google_search" checked={formData.is_google_search} onChange={handleChange} className="sr-only peer" />
                          <div className="w-10 h-6 bg-gray-700 rounded-full peer-checked:bg-blue-500 transition-colors duration-300 ease-in-out"></div>
                          <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-300 ease-in-out peer-checked:translate-x-4 flex items-center justify-center shadow-md p-0.5">
                            <GoogleIcon className="w-full h-full" />
                          </div>
                        </div>
                        <span className="ml-3 text-sm text-gray-300 font-semibold group-hover:text-white transition-colors">Google Search</span>
                      </label>
                    </div>
                  </fieldset>
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
                  className="group flex items-center justify-center gap-3 w-full md:w-auto bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold py-4 px-12 rounded-lg shadow-lg shadow-indigo-500/40 transform hover:scale-105 hover:shadow-indigo-400/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <LoaderIcon className="w-6 h-6 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="w-6 h-6 group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300" />
                      <span>{generationHistory.length === 0 ? 'Generate Blog' : 'Regenerate Blog'}</span>
                    </>
                  )}
                </button>
              </div>
              {error && <p className="text-center text-red-400 mt-4">{error}</p>}
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default BlogAgentWorkspace;
