import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Globe } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { language, setLanguage, t } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'zh' : 'en');
  };

  return (
    <div className="min-h-screen bg-kite-900 text-gray-200 font-sans selection:bg-kite-neon selection:text-black overflow-hidden relative">
      {/* Background Grid Effect */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20" 
           style={{
             backgroundImage: 'linear-gradient(#1c1c2e 1px, transparent 1px), linear-gradient(90deg, #1c1c2e 1px, transparent 1px)',
             backgroundSize: '40px 40px'
           }}>
      </div>
      
      {/* Glow Orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-kite-neon rounded-full mix-blend-screen filter blur-[128px] opacity-10 animate-pulse"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-kite-danger rounded-full mix-blend-screen filter blur-[128px] opacity-10 animate-pulse"></div>

      {/* Main Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8 flex flex-col min-h-screen">
        <header className="flex justify-between items-center mb-12 border-b border-gray-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-kite-neon to-blue-600 rounded flex items-center justify-center font-bold text-black text-xl">S</div>
            <div>
              <h1 className="text-2xl font-bold tracking-tighter text-white">SILEME <span className="text-xs text-gray-500 font-mono align-top ml-1">v0.1.0-alpha</span></h1>
              <p className="text-xs text-gray-500 font-mono uppercase tracking-widest">{t('layout.subtitle')}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <button 
               onClick={toggleLanguage}
               className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-gray-700 bg-black/40 text-xs hover:border-kite-neon hover:text-kite-neon transition-all"
             >
               <Globe size={12} />
               <span className="font-mono">{language === 'en' ? 'EN' : '中文'}</span>
             </button>

             <div className="flex items-center gap-2 text-xs font-mono text-kite-neon border border-kite-neon/30 px-3 py-1 rounded-full bg-kite-neon/5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-kite-neon opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-kite-neon"></span>
                </span>
                {t('layout.net')}
             </div>
          </div>
        </header>

        <main className="flex-grow">
          {children}
        </main>

        <footer className="mt-12 py-6 border-t border-gray-800 text-center text-xs text-gray-600 font-mono">
          <p>© {new Date().getFullYear()} {t('layout.footer')}</p>
        </footer>
      </div>
    </div>
  );
};