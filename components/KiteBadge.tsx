import React from 'react';
import { ExternalLink } from 'lucide-react';
import { EXPLORER_URL } from '../services/kiteService';

interface KiteBadgeProps {
  className?: string;
}

/**
 * Kite Chain 徽章组件
 * 显示 "Powered by Kite AI Chain" 标识
 */
export const KiteBadge: React.FC<KiteBadgeProps> = ({ className = '' }) => {
  const handleClick = () => {
    window.open('https://gokite.ai', '_blank');
  };

  return (
    <button
      onClick={handleClick}
      className={`
        fixed bottom-4 right-4 z-50
        flex items-center gap-2 px-4 py-2
        bg-gradient-to-r from-cyan-900/80 to-purple-900/80
        border border-cyan-500/30
        rounded-full backdrop-blur-md
        text-xs font-mono text-cyan-300
        hover:border-cyan-400/50 hover:text-cyan-200
        transition-all duration-200
        shadow-lg shadow-cyan-500/10
        ${className}
      `}
    >
      <span className="text-cyan-400">⚡</span>
      <span>Powered by</span>
      <span className="font-bold text-white">Kite AI Chain</span>
      <ExternalLink size={12} className="text-cyan-400" />
    </button>
  );
};

export default KiteBadge;
