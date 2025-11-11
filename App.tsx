import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { createChatWithGoogleSearch, continueChat } from './services/geminiService';
import type { GroundingChunk, ChatMessage } from './types';
import type { Chat } from '@google/genai';


// --- THEME DEFINITIONS ---
interface Theme {
  name: string;
  styles: React.CSSProperties;
}

const themes: Record<string, Theme> = {
  'cyan-dream': {
    name: 'Cyan Dream',
    styles: {
      '--color-primary': '#67e8f9',
      '--color-text-primary': '#67e8f9',
      '--color-accent': '#06b6d4',
      '--color-focus': '#22d3ee',
      '--color-background': '#020617',
      '--color-surface': '#0f172a',
      '--color-border': '#334155',
      '--gradient-text': 'var(--color-text-primary)',
      '--gradient-button': 'var(--color-accent)',
    },
  },
  'violet-storm': {
    name: 'Violet Storm',
    styles: {
      '--color-primary': '#c084fc',
      '--color-text-primary': '#c084fc',
      '--color-accent': '#9333ea',
      '--color-focus': '#a855f7',
      '--color-background': '#0f0f1f',
      '--color-surface': '#1d1b31',
      '--color-border': '#3c3752',
      '--gradient-text': 'var(--color-text-primary)',
      '--gradient-button': 'var(--color-accent)',
    },
  },
  'sunset-flare': {
    name: 'Sunset Flare',
    styles: {
      '--color-primary': '#fb923c',
      '--color-text-primary': 'transparent',
      '--color-accent': '#f97316',
      '--color-focus': '#fb923c',
      '--color-background': '#1c0c02',
      '--color-surface': '#2d1606',
      '--color-border': '#4e2a10',
      '--gradient-text': 'linear-gradient(to right, #fcd34d, #fb923c, #ef4444)',
      '--gradient-button': 'linear-gradient(to right, #f97316, #ea580c)',
    },
  },
  'emerald-matrix': {
    name: 'Emerald Matrix',
    styles: {
      '--color-primary': '#4ade80',
      '--color-text-primary': '#4ade80',
      '--color-accent': '#16a34a',
      '--color-focus': '#22c55e',
      '--color-background': '#05140b',
      '--color-surface': '#0b2014',
      '--color-border': '#1a3b2a',
      '--gradient-text': 'var(--color-text-primary)',
      '--gradient-button': 'var(--color-accent)',
    },
  },
  'cosmic-fusion': {
    name: 'Cosmic Fusion',
    styles: {
      '--color-primary': '#d8b4fe',
      '--color-text-primary': 'transparent',
      '--color-accent': '#d946ef',
      '--color-focus': '#d946ef',
      '--color-background': '#0f041a',
      '--color-surface': '#1e0a33',
      '--color-border': '#3a1a5c',
      '--gradient-text': 'linear-gradient(to right, #a855f7, #d946ef, #22d3ee)',
      '--gradient-button': 'linear-gradient(to right, #a855f7, #d946ef)',
    },
  },
};


// --- HELPER COMPONENTS ---

const SearchIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
  </svg>
);

const LinkIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
    </svg>
);

const PaletteIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 0 0 5.304 0l6.401-6.402a3.75 3.75 0 0 0-.625-6.25a3.75 3.75 0 0 0-6.25-.625l-6.402 6.401a3.75 3.75 0 0 0 0 5.304Zm1.13-1.13a2.25 2.25 0 0 1 0-3.182l6.401-6.402a2.25 2.25 0 0 1 3.182 0l.53-.53a2.25 2.25 0 0 0-3.182-3.182l-6.401 6.402a2.25 2.25 0 0 0 0 3.182l.53.53Zm.707.707a2.25 2.25 0 0 1-3.182 0l-1.414-1.414a2.25 2.25 0 1 1 3.182 3.182l1.414 1.414Zm-3.182 0a2.25 2.25 0 0 1 0-3.182l.53.53a2.25 2.25 0 0 0 0 3.182l-.53.53Z" />
  </svg>
);

interface SourceListProps {
    sources: GroundingChunk[];
}
const SourceList: React.FC<SourceListProps> = ({ sources }) => {
    if (!sources || sources.length === 0) return null;
    return (
        <div className="mt-6">
            <h3 className="text-sm font-semibold text-[var(--color-primary)] mb-3">Sources</h3>
            <div className="flex flex-col space-y-3">
                {sources.map((source, index) => (
                    <a
                        key={index}
                        href={source.web.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-black/20 hover:bg-white/10 p-3 rounded-lg border border-transparent hover:border-[var(--color-border)] transition-all duration-300 group flex items-start space-x-3"
                    >
                        <LinkIcon className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                        <div className="overflow-hidden">
                          <p className="text-[var(--color-primary)] truncate group-hover:underline text-sm font-medium">{source.web.title}</p>
                          <p className="text-gray-500 truncate text-xs">{source.web.uri}</p>
                        </div>
                    </a>
                ))}
            </div>
        </div>
    );
};

interface ResponseDisplayProps {
    text: string;
}
const ResponseDisplay: React.FC<ResponseDisplayProps> = ({ text }) => {
    const formattedText = text.split('\n').filter(p => p.trim() !== '').map((paragraph, index) => (
        <p key={index} className="mb-4 last:mb-0">{paragraph}</p>
    ));

    return (
        <div className="text-gray-300 leading-relaxed max-w-none">
            {formattedText}
        </div>
    );
};

const ModelThinking: React.FC = () => (
    <div className="flex justify-start animate-fade-in">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-r-2xl rounded-tl-2xl p-4 sm:p-6 shadow-md">
            <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-[var(--color-primary)] rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-[var(--color-primary)] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-[var(--color-primary)] rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
        </div>
    </div>
);


const ChatMessageDisplay: React.FC<{ message: ChatMessage }> = ({ message }) => {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end animate-fade-in">
        <div className="bg-[var(--color-accent)]/30 text-white p-4 rounded-l-2xl rounded-tr-2xl max-w-xl shadow-md">
          <p className="text-gray-200 leading-relaxed">{message.text}</p>
        </div>
      </div>
    );
  }

  // Model's message
  return (
    <div className="flex justify-start animate-fade-in">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-r-2xl rounded-tl-2xl p-4 sm:p-6 max-w-xl shadow-md">
        <ResponseDisplay text={message.text} />
        <SourceList sources={message.sources ?? []} />
      </div>
    </div>
  );
};


interface ThemeSelectorProps {
  currentTheme: string;
  setTheme: (theme: string) => void;
}
const ThemeSelector: React.FC<ThemeSelectorProps> = ({ currentTheme, setTheme }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Select theme"
            >
                <PaletteIcon className="w-6 h-6 text-[var(--color-primary)]"/>
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-xl z-10 p-2">
                    {Object.entries(themes).map(([key, themeData]) => (
                        <button
                            key={key}
                            onClick={() => { setTheme(key); setIsOpen(false); }}
                            className={`w-full text-left px-3 py-2 text-sm rounded-md flex items-center space-x-3 ${currentTheme === key ? 'bg-white/20' : 'hover:bg-white/10'}`}
                        >
                            <span 
                                className="w-5 h-5 rounded-full border border-white/20"
                                style={{ background: themeData.styles['--gradient-button'] as string || themeData.styles['--color-accent'] as string }}
                            ></span>
                            <span className="text-gray-200">{themeData.name}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};


// --- MAIN APP COMPONENT ---
const App: React.FC = () => {
  const [query, setQuery] = useState<string>('');
  const chatRef = useRef<Chat | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const [theme, setTheme] = useState<string>(() => {
    return localStorage.getItem('nexus-theme') || 'cyan-dream';
  });

  useEffect(() => {
    chatRef.current = createChatWithGoogleSearch();
  }, []);

  useEffect(() => {
    localStorage.setItem('nexus-theme', theme);
  }, [theme]);
  
  const currentThemeStyles = useMemo(() => themes[theme]?.styles || themes['cyan-dream'].styles, [theme]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isLoading]);

  const handleSearch = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    if (!query.trim() || isLoading || !chatRef.current) return;

    const userMessage: ChatMessage = { role: 'user', text: query };
    setChatHistory(prev => [...prev, userMessage]);
    const currentQuery = query;
    setQuery('');
    setIsLoading(true);
    setError(null);

    try {
      const result = await continueChat(chatRef.current, currentQuery);
      const modelMessage: ChatMessage = { role: 'model', text: result.text, sources: result.sources };
      setChatHistory(prev => [...prev, modelMessage]);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
      setError(errorMessage);
      setChatHistory(prev => [...prev, { role: 'model', text: `Error: ${errorMessage}` }]);
    } finally {
      setIsLoading(false);
    }
  }, [query, isLoading]);

  return (
    <div style={currentThemeStyles} className="min-h-screen bg-[var(--color-background)] text-white font-sans p-4 sm:p-6 lg:p-8 flex flex-col transition-colors duration-500">
      <div className="w-full max-w-4xl mx-auto flex flex-col flex-1">
        <header className="flex justify-between items-center my-8 md:my-12">
          <div className="text-left">
             <h1 className="text-4xl md:text-5xl font-bold tracking-wider" style={{ background: currentThemeStyles['--gradient-text'], WebkitBackgroundClip: 'text', backgroundClip: 'text', color: currentThemeStyles['--color-text-primary'] }}>
              Nexus Search
            </h1>
            <p className="text-gray-400 mt-2 text-md md:text-lg">Your AI Gateway to the Web's Depths</p>
          </div>
          <ThemeSelector currentTheme={theme} setTheme={setTheme} />
        </header>

        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-6 pr-4 -mr-4 pb-4">
            {chatHistory.map((msg, idx) => (
              <ChatMessageDisplay key={idx} message={msg} />
            ))}
            {isLoading && <ModelThinking />}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSearch} className="relative mt-auto pt-6">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything..."
              disabled={isLoading}
              className="w-full pl-5 pr-16 py-4 bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-full focus:ring-2 focus:ring-[var(--color-focus)] focus:border-[var(--color-focus)] transition-all duration-300 text-lg placeholder-gray-500 text-gray-200 outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              style={{ background: currentThemeStyles['--gradient-button']}}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center hover:brightness-110 active:brightness-95"
            >
              <SearchIcon className="w-6 h-6 text-white" />
            </button>
          </form>
        </main>
        
        <footer className="text-center mt-auto pt-8 text-gray-600 text-sm">
            <p>Powered by Google Gemini</p>
        </footer>
      </div>
    </div>
  );
};

// Add a simple fade-in animation using a global style tag
const style = document.createElement('style');
style.innerHTML = `
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
  animation: fadeIn 0.5s ease-out forwards;
}
`;
document.head.appendChild(style);


export default App;
