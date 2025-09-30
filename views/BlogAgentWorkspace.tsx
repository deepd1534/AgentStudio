import React, { useState, useCallback, useEffect } from 'react';
import { Tone, BlogAgentRequest, BlogAgentResponse } from '../types';
import { ArrowLeftIcon, SparklesIcon, EditIcon, LoaderIcon, PlusCircleIcon } from '../components/IconComponents';
import BlogOutputDisplay from '../components/BlogOutputDisplay';

const BlogAgentWorkspace: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [sessionId, setSessionId] = useState('');
  const [formData, setFormData] = useState<Omit<BlogAgentRequest, 'session_id'>>({
    content: '',
    target_audience: '',
    tone: Tone.PROFESSIONAL,
    word_count: 1000,
    include_seo: true,
    feedback: '',
  });

  const [blogOutput, setBlogOutput] = useState<BlogAgentResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFirstGeneration, setIsFirstGeneration] = useState(true);

  // Generate initial session ID on component mount
  useEffect(() => {
    setSessionId(crypto.randomUUID());
  }, []);

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

    const requestBody: BlogAgentRequest = {
      ...formData,
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
      setBlogOutput(data);
      setIsFirstGeneration(false);
    } catch (err) {
      setError('Failed to generate blog. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [formData, sessionId]);
  
  const handleRegenerate = () => {
    setBlogOutput(null);
    window.scrollTo(0, 0);
  }

  const handleNewSession = () => {
    setSessionId(crypto.randomUUID());
    setFormData({
        content: '',
        target_audience: '',
        tone: Tone.PROFESSIONAL,
        word_count: 1000,
        include_seo: true,
        feedback: '',
    });
    setBlogOutput(null);
    setError(null);
    setIsFirstGeneration(true);
    window.scrollTo(0, 0);
  };

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

      {blogOutput ? (
        <>
            <BlogOutputDisplay blogData={blogOutput.blog_content} traceId={blogOutput.traceId} generatedAt={blogOutput.generated_at} />
             <button
                onClick={handleRegenerate}
                className="fixed bottom-8 right-8 z-50 flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-full shadow-lg shadow-blue-500/30 transform hover:scale-105 transition-all duration-300"
            >
                <EditIcon className="w-5 h-5" />
                <span>Tweak & Regenerate</span>
            </button>
        </>
      ) : (
        <div className="flex flex-col items-center">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Blog Agent Workspace</h1>
          <p className="text-gray-400 text-center mb-12">Fill in the details below to generate your next masterpiece.</p>

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
                className="block px-4 pb-4 pt-6 w-full text-lg text-white bg-white/5 rounded-lg border border-white/20 appearance-none focus:outline-none focus:ring-0 focus:border-blue-400 peer transition-colors"
              />
              <label htmlFor="content" className="absolute text-lg text-gray-400 duration-300 transform -translate-y-4 scale-75 top-5 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4">
                Paste your raw content here...
              </label>
            </div>

            {/* Parameter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Target Audience */}
              <div className="relative">
                <input type="text" id="target_audience" name="target_audience" value={formData.target_audience} onChange={handleChange} className="block px-4 pb-2.5 pt-5 w-full text-lg text-white bg-white/5 rounded-lg border border-white/20 appearance-none focus:outline-none focus:ring-0 focus:border-blue-400 peer transition-colors" placeholder=" " />
                <label htmlFor="target_audience" className="absolute text-lg text-gray-400 duration-300 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4">Target Audience</label>
              </div>

              {/* Tone */}
              <div className="relative">
                <select id="tone" name="tone" value={formData.tone} onChange={handleChange} className="block px-4 pb-2.5 pt-5 w-full text-lg text-white bg-white/5 rounded-lg border border-white/20 appearance-none focus:outline-none focus:ring-0 focus:border-blue-400 peer transition-colors bg-transparent">
                  {Object.values(Tone).map(toneValue => (
                    <option key={toneValue} value={toneValue} className="bg-gray-800 text-white">{toneValue}</option>
                  ))}
                </select>
                <label htmlFor="tone" className="absolute text-lg text-gray-400 duration-300 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4">Tone</label>
              </div>

              {/* Word Count */}
              <div className="relative">
                <input type="number" id="word_count" name="word_count" value={formData.word_count} onChange={handleChange} className="block px-4 pb-2.5 pt-5 w-full text-lg text-white bg-white/5 rounded-lg border border-white/20 appearance-none focus:outline-none focus:ring-0 focus:border-blue-400 peer transition-colors" placeholder=" " />
                <label htmlFor="word_count" className="absolute text-lg text-gray-400 duration-300 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4">Word Count</label>
              </div>

              {/* SEO Checkbox */}
              <div className="flex items-center justify-center bg-white/5 rounded-lg border border-white/20 p-4">
                <label htmlFor="include_seo" className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input type="checkbox" id="include_seo" name="include_seo" checked={formData.include_seo} onChange={handleChange} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                  </div>
                  <span className="ml-3 text-lg text-gray-300">Include SEO?</span>
                </label>
              </div>
            </div>
            
             {/* Feedback - Only show after the first generation */}
             {!isFirstGeneration && (
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
                    <span>{isFirstGeneration ? 'Generate Blog' : 'Regenerate Blog'}</span>
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