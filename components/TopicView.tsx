
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Topic, QuizData, ContentType, ContentBlock, Group } from '../types';
import { generateQuiz, analyzeVideoContent, generateSpeech, askQuestionAboutTopic } from '../services/geminiService';
import { decode, decodeAudioData } from '../utils/audio';
import Quiz from './Quiz';
import { SparklesIcon, LoaderIcon, FileTextIcon, VideoIcon, PlayIcon, PauseIcon, UsersIcon, CheckIcon, MessageSquareIcon, SendIcon, ClipboardListIcon } from './icons';

interface TopicViewProps {
  topic: Topic;
  onMarkComplete: (topicId: string) => void;
  groups: Group[];
}

const TopicView: React.FC<TopicViewProps> = ({ topic, onMarkComplete, groups }) => {
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [quizCompleted, setQuizCompleted] = useState(false);

  // Video Analysis State
  const [analysis, setAnalysis] = useState<Record<string, string>>({});
  const [isAnalyzing, setIsAnalyzing] = useState<Record<string, boolean>>({});
  
  // TTS State
  const [isGeneratingSpeech, setIsGeneratingSpeech] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  
  // Ask AI State
  const [askQuestion, setAskQuestion] = useState('');
  const [askAnswer, setAskAnswer] = useState<string | null>(null);
  const [isAsking, setIsAsking] = useState(false);
  
  const sharedWithGroupNames = useMemo(() => {
    return topic.sharedWith
      .map(groupId => groups.find(g => g.id === groupId)?.name)
      .filter(Boolean) as string[];
  }, [topic.sharedWith, groups]);


  useEffect(() => {
    // Cleanup audio on component unmount
    return () => {
      audioSourceRef.current?.stop();
      audioContextRef.current?.close();
    };
  }, []);

  const handleGenerateQuiz = async () => {
    setIsLoadingQuiz(true);
    setQuizError(null);
    setQuizData(null);
    try {
      // Pass the ENTIRE content array so the service can extract PDFs and Images
      const data = await generateQuiz(topic.content);
      setQuizData(data);
    } catch (error) {
      setQuizError(error instanceof Error ? error.message : "An unknown error occurred.");
    } finally {
      setIsLoadingQuiz(false);
    }
  };
  
  const handleQuizComplete = (score: number) => {
    // Only allow completion if score > 0
    if (score > 0) {
        setQuizCompleted(true);
    } else {
        setQuizCompleted(false);
    }
  };

  const handleRetryQuiz = () => {
    setQuizData(null);
    setQuizCompleted(false);
    // Smooth scroll to top content to encourage reviewing
    const contentElement = document.getElementById('topic-content');
    if (contentElement) {
        contentElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleAnalyzeVideo = async (block: ContentBlock) => {
    const videoId = block.content;
    setIsAnalyzing(prev => ({ ...prev, [videoId]: true }));
    try {
      const result = await analyzeVideoContent(block.title || 'this video');
      setAnalysis(prev => ({ ...prev, [videoId]: result }));
    } catch (error) {
      setAnalysis(prev => ({ ...prev, [videoId]: 'Error: Could not analyze the video.' }));
    } finally {
      setIsAnalyzing(prev => ({ ...prev, [videoId]: false }));
    }
  };

  const handleTogglePlay = async () => {
    if (isPlaying) {
      audioSourceRef.current?.stop();
      setIsPlaying(false);
      return;
    }

    setIsGeneratingSpeech(true);
    try {
      const textContent = topic.content
        .filter(block => block.type === ContentType.Paragraph)
        .map(block => block.content)
        .join(' ');
        
      if (!textContent) {
          return; // Nothing to read
      }

      const base64Audio = await generateSpeech(textContent);

      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const ctx = audioContextRef.current;
      
      const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
      
      if (audioSourceRef.current) {
        audioSourceRef.current.disconnect();
      }
      
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.start();
      source.onended = () => setIsPlaying(false);
      
      audioSourceRef.current = source;
      setIsPlaying(true);
    } catch (error) {
      console.error("Error playing audio:", error);
      setIsPlaying(false);
    } finally {
      setIsGeneratingSpeech(false);
    }
  };
  
  const handleAskQuestion = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!askQuestion.trim()) return;
      
      setIsAsking(true);
      setAskAnswer(null);
      
      try {
          // Pass full content to allow PDF/Image analysis
          const answer = await askQuestionAboutTopic(topic.content, askQuestion);
          setAskAnswer(answer);
      } catch (err) {
          setAskAnswer("I'm having trouble connecting right now. Please try again.");
      } finally {
          setIsAsking(false);
      }
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto" id="topic-content">
        <div className="flex justify-between items-start mb-4">
            <div>
                <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold text-primary uppercase">{topic.category}</span>
                    {topic.isSop && (
                        <span className="flex items-center px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-bold border border-purple-200">
                            <ClipboardListIcon className="h-3 w-3 mr-1" />
                            SOP Reference
                        </span>
                    )}
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">{topic.title}</h1>
                 {sharedWithGroupNames.length > 0 && (
                    <div className="mt-3 flex items-center text-sm text-gray-500">
                        <UsersIcon className="h-4 w-4 mr-2" />
                        Shared with: <span className="font-medium text-gray-600 ml-1">{sharedWithGroupNames.join(', ')}</span>
                    </div>
                )}
            </div>
            <button 
              onClick={handleTogglePlay}
              disabled={isGeneratingSpeech}
              className="mt-4 ml-4 flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 flex-shrink-0"
            >
              {isGeneratingSpeech ? <LoaderIcon className="animate-spin h-5 w-5 mr-2" /> : (isPlaying ? <PauseIcon className="h-5 w-5 mr-2"/> : <PlayIcon className="h-5 w-5 mr-2" />)}
              {isGeneratingSpeech ? 'Loading...' : (isPlaying ? 'Pause' : 'Read Aloud')}
            </button>
        </div>
        <p className="text-gray-500 mb-6">{topic.readTime} min read</p>
        
        {topic.imageUrl && (
             <div className="mb-8">
               <img src={topic.imageUrl} alt={topic.title} className="w-full h-64 md:h-80 object-cover rounded-lg shadow-sm"/>
             </div>
        )}

        <div className="prose lg:prose-xl max-w-none text-gray-700 space-y-6">
            {topic.content.map((block, index) => {
              if (!block.content) return null; // Don't render empty blocks

              switch (block.type) {
                case ContentType.Paragraph:
                  return <p key={index} className="whitespace-pre-line leading-relaxed">{block.content}</p>;
                case ContentType.Image:
                  return (
                    <figure key={index} className="my-8">
                        <img src={block.content} alt={block.title || 'Topic Image'} className="w-full rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300" />
                        {block.title && <figcaption className="text-center text-sm text-gray-500 mt-3 italic">{block.title}</figcaption>}
                    </figure>
                  );
                case ContentType.Video:
                  const videoId = block.content;
                  // Handle YouTube embed specifically if it's a URL
                  const isYouTube = block.content.includes('youtube.com') || block.content.includes('youtu.be');
                  return (
                    <div key={index} className="my-8 p-4 bg-gray-50 rounded-xl">
                        <h4 className="flex items-center font-bold text-gray-800 mb-3"><VideoIcon className="h-5 w-5 mr-2 text-primary" /> {block.title || 'Instructional Video'}</h4>
                        <div className="aspect-w-16 aspect-h-9 not-prose mb-4">
                            {isYouTube ? (
                                <iframe src={block.content} title={block.title || 'Video'} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="rounded-lg shadow-md w-full h-full"></iframe>
                            ) : (
                                <p className="p-4 text-gray-500 border border-gray-300 rounded bg-white">Video preview not available for raw file uploads in this demo view.</p>
                            )}
                        </div>
                         <div className="not-prose">
                            <button
                                onClick={() => handleAnalyzeVideo(block)}
                                disabled={isAnalyzing[videoId]}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full shadow-sm text-white bg-gradient-to-r from-secondary to-purple-600 hover:from-purple-500 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-60 transition-all"
                            >
                                {isAnalyzing[videoId] ? <LoaderIcon className="animate-spin -ml-1 mr-2 h-4 w-4" /> : <SparklesIcon className="-ml-1 mr-2 h-4 w-4" />}
                                {isAnalyzing[videoId] ? 'Analyzing...' : 'Analyze Key Points with AI'}
                            </button>
                            {analysis[videoId] && (
                                <div className="mt-4 p-5 bg-indigo-50 border border-indigo-100 rounded-xl animate-fade-in">
                                    <h5 className="font-bold text-indigo-900 flex items-center mb-2">
                                        <SparklesIcon className="h-4 w-4 mr-2 text-indigo-600"/> 
                                        AI Summary
                                    </h5>
                                    <div className="prose prose-sm prose-indigo whitespace-pre-wrap">{analysis[videoId]}</div>
                                </div>
                            )}
                        </div>
                    </div>
                  );
                case ContentType.Document:
                  return (
                    <div key={index} className="not-prose my-6">
                        <a href={block.content} target="_blank" rel="noopener noreferrer" className="flex items-center p-4 bg-white rounded-xl border border-gray-200 hover:border-primary hover:shadow-md transition-all no-underline group">
                           <div className="p-3 bg-indigo-50 rounded-lg group-hover:bg-indigo-100 transition-colors">
                                <FileTextIcon className="h-8 w-8 text-primary" />
                           </div>
                           <div className="ml-4">
                                <span className="block font-bold text-gray-800 group-hover:text-primary transition-colors">Reference Document</span>
                                <span className="block text-sm text-gray-500 mt-0.5">{block.title || 'Download PDF'}</span>
                                {block.content.startsWith('data:') && (
                                     <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-bold">Uploaded File (AI Readable)</span>
                                )}
                           </div>
                        </a>
                    </div>
                  );
                default:
                  return null;
              }
            })}
        </div>
      </div>
      
      {/* Ask AI Section */}
      <div className="max-w-4xl mx-auto mt-12 mb-8 bg-sky-50 rounded-xl p-6 border border-sky-100">
          <h3 className="text-lg font-bold text-gray-900 flex items-center mb-3">
              <MessageSquareIcon className="h-5 w-5 mr-2 text-primary" />
              Have a question about this topic?
          </h3>
          <p className="text-sm text-gray-600 mb-4">Ask our AI tutor anything related to the content above (including PDFs and Images).</p>
          
          <form onSubmit={handleAskQuestion} className="flex gap-2">
              <input 
                type="text" 
                value={askQuestion}
                onChange={(e) => setAskQuestion(e.target.value)}
                placeholder="E.g., What is the main safety protocol mentioned?"
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 !bg-white !text-gray-900 focus:ring-2 focus:ring-primary focus:border-primary"
                disabled={isAsking}
              />
              <button 
                type="submit" 
                disabled={isAsking || !askQuestion.trim()}
                className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-sky-600 disabled:opacity-50 flex items-center"
              >
                  {isAsking ? <LoaderIcon className="animate-spin h-5 w-5" /> : <SendIcon className="h-5 w-5" />}
              </button>
          </form>
          
          {askAnswer && (
              <div className="mt-4 bg-white p-4 rounded-lg border border-gray-200 animate-fade-in">
                  <p className="text-gray-800 whitespace-pre-line text-sm leading-relaxed">
                      <span className="font-bold text-primary mr-1">AI Answer:</span> {askAnswer}
                  </p>
              </div>
          )}
      </div>

      <div className="max-w-4xl mx-auto mt-12 border-t pt-10">
        <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Check Your Understanding</h2>
            {!quizData && (
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">Auto-generated</span>
            )}
        </div>
        
        {!quizData && (
          <div className="text-center py-10 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <p className="text-gray-600 mb-6 max-w-md mx-auto">Generate a personalized AI quiz based on the content above to test your knowledge.</p>
            <button
              onClick={handleGenerateQuiz}
              disabled={isLoadingQuiz}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-bold rounded-full shadow-md text-white bg-primary hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all transform hover:scale-105"
            >
              {isLoadingQuiz ? (
                <>
                  <LoaderIcon className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                  Generating Quiz...
                </>
              ) : (
                <>
                  <SparklesIcon className="-ml-1 mr-2 h-5 w-5" />
                  Generate AI Quiz
                </>
              )}
            </button>
            {quizError && <p className="text-error mt-4 font-medium">{quizError}</p>}
          </div>
        )}
        
        {quizData && <Quiz quizData={quizData} onComplete={handleQuizComplete} onRetry={handleRetryQuiz} />}
      </div>

      <div className="mt-12 text-center pb-8">
        <button
          onClick={() => onMarkComplete(topic.id)}
          disabled={topic.status === 'Completed' || !quizCompleted}
          className="px-10 py-4 bg-success text-white font-bold text-lg rounded-full shadow-lg hover:bg-emerald-600 transition-all disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed disabled:shadow-none transform active:scale-95"
        >
          {topic.status === 'Completed' ? (
              <span className="flex items-center"><CheckIcon className="h-6 w-6 mr-2"/> Completed</span>
          ) : (!quizCompleted ? 'Pass Quiz to Finish' : 'Mark as Complete')}
        </button>
        {!quizCompleted && topic.status !== 'Completed' && quizData && (
            <p className="text-xs text-gray-400 mt-3">You must get at least 1 answer correct.</p>
        )}
      </div>
    </div>
  );
};

export default TopicView;
