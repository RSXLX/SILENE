import React, { useState, useEffect } from 'react';
import { X, Search, AlertTriangle, ArrowRight, RefreshCw, Zap, Wifi, TrendingUp, TrendingDown, Globe } from 'lucide-react';
import { Beneficiary, SimulationResult } from '../types';
import { simulateExecution } from '../services/agentService';
import { useLanguage } from '../contexts/LanguageContext';

interface SimulatorProps {
  isOpen: boolean;
  onClose: () => void;
  originalManifesto: string;
  initialHandle?: string;
  onSimulateComplete: (result: any) => void;
}

export const Simulator: React.FC<SimulatorProps> = ({ isOpen, onClose, originalManifesto, initialHandle, onSimulateComplete }) => {
  const [days, setDays] = useState(200);
  const [handle, setHandle] = useState(initialHandle || "https://x.com/crypto_Reeeece");
  const [portfolioChange, setPortfolioChange] = useState(0); // Percentage change
  const [customEvent, setCustomEvent] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);
  
  const { language, t } = useLanguage();

  // Update handle if initialHandle changes
  useEffect(() => {
    if (initialHandle) {
      setHandle(initialHandle);
    }
  }, [initialHandle]);

  const runSimulation = async () => {
    setLoading(true);
    setResult(null);
    
    // Artificial delay for "Crawling" effect
    setTimeout(async () => {
      const simResult = await simulateExecution(originalManifesto, days, handle, portfolioChange, customEvent, language);
      setResult(simResult);
      setLoading(false);
      onSimulateComplete(simResult);
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-kite-900 border border-kite-neon/30 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-kite-800/50">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
               <Zap size={20} />
             </div>
             <div>
               <h3 className="text-xl font-bold text-white tracking-tight">{t('simulator.title')}</h3>
               <p className="text-xs text-purple-400 font-mono">{t('simulator.subtitle')}</p>
             </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-col md:flex-row flex-grow overflow-hidden">
          
          {/* Controls - Left Panel */}
          <div className="w-full md:w-1/3 p-6 border-r border-gray-800 bg-black/20 overflow-y-auto custom-scrollbar">
            <div className="space-y-8">
              
              {/* Time */}
              <div>
                <label className="block text-xs font-mono text-gray-400 mb-2 uppercase flex justify-between">
                  <span>{t('simulator.inactivity')}</span>
                  <span className="text-kite-neon">{days} {t('common.days')}</span>
                </label>
                <input 
                  type="range" 
                  min="1" 
                  max="1000" 
                  value={days} 
                  onChange={(e) => setDays(Number(e.target.value))}
                  className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-kite-neon"
                />
              </div>

              {/* Portfolio Value */}
              <div>
                 <label className="block text-xs font-mono text-gray-400 mb-2 uppercase flex justify-between">
                    <span>{t('simulator.portfolioImpact')}</span>
                    <span className={`${portfolioChange < 0 ? 'text-kite-danger' : portfolioChange > 0 ? 'text-green-400' : 'text-gray-400'}`}>
                      {portfolioChange > 0 ? '+' : ''}{portfolioChange}%
                    </span>
                 </label>
                 <div className="relative flex items-center gap-2">
                    <TrendingDown size={14} className="text-gray-600" />
                    <input 
                      type="range" 
                      min="-99" 
                      max="500" 
                      value={portfolioChange} 
                      onChange={(e) => setPortfolioChange(Number(e.target.value))}
                      className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                    <TrendingUp size={14} className="text-gray-600" />
                 </div>
                 <div className="flex justify-between text-[9px] text-gray-600 font-mono mt-1">
                    <span>{t('simulator.crash')}</span>
                    <span>{t('simulator.stable')}</span>
                    <span>{t('simulator.moon')}</span>
                 </div>
              </div>

              {/* Custom Event */}
              <div>
                <label className="block text-xs font-mono text-gray-400 mb-2 uppercase flex items-center gap-2">
                   <Globe size={12} /> {t('simulator.globalEvent')}
                </label>
                <textarea 
                  value={customEvent}
                  onChange={(e) => setCustomEvent(e.target.value)}
                  className="w-full bg-black/50 border border-gray-700 rounded p-3 text-sm text-white placeholder-gray-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-mono h-20 resize-none"
                  placeholder={t('simulator.eventPlaceholder')}
                />
              </div>

              {/* Handle */}
              <div>
                <label className="block text-xs font-mono text-gray-400 mb-2 uppercase">{t('simulator.crawlLabel')}</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={14} className="text-gray-500 group-focus-within:text-purple-400" />
                  </div>
                  <input 
                    type="text" 
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    className="w-full bg-black/50 border border-gray-700 rounded p-3 pl-9 text-sm text-white placeholder-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-mono"
                    placeholder="@username or URL"
                  />
                </div>
              </div>

              <button 
                onClick={runSimulation} 
                disabled={loading}
                className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded shadow-[0_0_20px_rgba(147,51,234,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-wait"
              >
                {loading ? <RefreshCw className="animate-spin" size={16} /> : <Zap size={16} />}
                {loading ? t('simulator.simulating') : t('simulator.runBtn')}
              </button>

            </div>
          </div>

          {/* Results - Right Panel */}
          <div className="w-full md:w-2/3 p-6 bg-kite-900/50 overflow-y-auto relative custom-scrollbar">
            
            {!result && !loading && (
              <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-4">
                <Wifi size={48} className="opacity-20" />
                <p className="font-mono text-sm">{t('simulator.configurePrompt')}</p>
              </div>
            )}

            {loading && (
              <div className="h-full flex flex-col items-center justify-center space-y-8">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Zap size={24} className="text-purple-400 animate-pulse" />
                  </div>
                </div>
                <div className="space-y-2 text-center font-mono text-xs text-purple-400">
                  <p className="animate-pulse">{t('simulator.accessing')} {handle}...</p>
                  <p className="animate-pulse delay-75">{t('simulator.simulatingMarket')}...</p>
                  <p className="animate-pulse delay-150">{t('simulator.resolvingParadox')}...</p>
                </div>
              </div>
            )}

            {result && !loading && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* Status Banner */}
                <div className={`p-4 rounded border flex items-start gap-3 ${
                  result.sentimentShift === 'CONFLICT_DETECTED' 
                    ? 'bg-red-500/10 border-red-500/30 text-red-200' 
                    : result.sentimentShift === 'ADAPTIVE_REBALANCING'
                    ? 'bg-blue-500/10 border-blue-500/30 text-blue-200'
                    : 'bg-green-500/10 border-green-500/30 text-green-200'
                }`}>
                  <AlertTriangle size={20} className="mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-bold text-sm uppercase mb-1">
                      {result.sentimentShift.replace('_', ' ')}
                    </h4>
                    <p className="text-xs opacity-80 leading-relaxed font-mono">{result.narrative}</p>
                  </div>
                </div>

                {/* Evidence Card */}
                <div className="bg-black/40 rounded border border-gray-800 p-4">
                   <h5 className="text-xs font-mono text-gray-500 uppercase mb-3 flex items-center gap-2">
                     <Wifi size={12} /> {t('simulator.evidence')}
                   </h5>
                   <div className="font-serif text-lg italic text-gray-300 pl-4 border-l-2 border-purple-500">
                     "{result.detectedLastWords || "No distinct final words found. Relying on will."}"
                   </div>
                </div>

                {/* Outcome Table */}
                <div>
                  <h5 className="text-xs font-mono text-gray-500 uppercase mb-3">{t('simulator.outcome')}</h5>
                  <div className="space-y-2">
                    {result.adjustedBeneficiaries.map((b, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded border border-white/10 hover:border-purple-500/50 transition-colors">
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-gray-200">{b.name}</span>
                          <span className="text-[10px] text-gray-500 font-mono">{b.category}</span>
                        </div>
                        <div className="text-right">
                          <div className={`font-mono font-bold ${
                            b.percentage > 50 ? 'text-purple-300' : 'text-purple-400'
                          }`}>{b.percentage}%</div>
                          <span className="text-[10px] text-gray-600 block max-w-[200px] truncate">{b.reason}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};