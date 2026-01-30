import React, { useEffect, useRef } from 'react';
import { TransactionLog } from '../types';
import { Activity, Heart, AlertTriangle, Shield, Zap, Wallet, Link, Radio, Cpu, Hash } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface TerminalLogProps {
  logs: TransactionLog[];
}

export const TerminalLog: React.FC<TerminalLogProps> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const getLogStyle = (type: TransactionLog['type']) => {
    switch (type) {
      case 'HEARTBEAT': return { icon: Heart, color: 'text-kite-neon', bg: 'bg-kite-neon/10', border: 'border-kite-neon/20' };
      case 'ALERT': return { icon: AlertTriangle, color: 'text-kite-danger', bg: 'bg-kite-danger/10', border: 'border-kite-danger/20' };
      case 'DISTRIBUTION': return { icon: Wallet, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' };
      case 'SENTINEL': return { icon: Shield, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' };
      case 'SIMULATION': return { icon: Zap, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' };
      case 'WALLET_LINK': return { icon: Link, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' };
      case 'AI_THINKING': return { icon: Cpu, color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20', animate: true };
      case 'CHAIN_TX': return { icon: Hash, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' };
      default: return { icon: Activity, color: 'text-gray-400', bg: 'bg-gray-800', border: 'border-gray-700' };
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-[#08080a] rounded-xl border border-gray-800/60 overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800 bg-[#0c0c12] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Radio size={14} className="text-kite-neon animate-pulse" />
          <h3 className="text-xs font-bold text-gray-300 uppercase tracking-widest">{t('logs.title')}</h3>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gray-900 border border-gray-800">
           <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
           <span className="text-[10px] text-gray-500 font-mono">LIVE_NET</span>
        </div>
      </div>

      {/* Timeline Feed */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-0 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent"
      >
        {logs.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-30 text-center space-y-2">
            <Activity size={32} />
            <p className="text-xs font-mono">{t('logs.waiting')}</p>
          </div>
        )}

        {logs.map((log, index) => {
          const style = getLogStyle(log.type);
          const Icon = style.icon;
          const isLast = index === logs.length - 1;

          return (
            <div key={log.id} className="relative flex gap-3 group animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Timeline Line */}
              {!isLast && (
                <div className="absolute left-[11px] top-7 bottom-[-8px] w-px bg-gray-800/50 group-hover:bg-gray-700 transition-colors"></div>
              )}

              {/* Icon Marker */}
              <div className={`relative z-10 shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${style.bg} border ${style.border} mt-0.5`}>
                <Icon size={12} className={`${style.color} ${(style as any).animate ? 'animate-pulse' : ''}`} />
              </div>

              {/* Content */}
              <div className="flex-1 pb-6 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-bold tracking-wider ${style.color}`}>
                    {log.type}
                  </span>
                  <span className="text-[10px] text-gray-600 font-mono tabular-nums">
                    {new Date(log.timestamp).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
                
                <p className="text-xs text-gray-400 leading-relaxed font-mono break-words">
                  {log.details}
                </p>
                
                <div className="mt-1.5 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <span className="text-[9px] text-gray-700 font-mono bg-gray-900 px-1 rounded border border-gray-800">
                     hash: {log.hash}
                   </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};