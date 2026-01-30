import React from 'react';
import type { NetworkStatus } from '../types';
import { KITE_CONFIG } from '../services/kiteService';

interface NetworkIndicatorProps {
  status: NetworkStatus | null;
  className?: string;
}

/**
 * 网络状态指示器组件
 * 显示当前连接的区块链网络状态
 */
export const NetworkIndicator: React.FC<NetworkIndicatorProps> = ({ status, className = '' }) => {
  if (!status) {
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-800/50 border border-gray-700 ${className}`}>
        <span className="w-2 h-2 rounded-full bg-gray-500 animate-pulse" />
        <span className="text-xs text-gray-500 font-mono">Connecting...</span>
      </div>
    );
  }

  const { isConnected, isCorrectNetwork, chainName } = status;

  // 状态颜色
  const statusColor = !isConnected 
    ? 'bg-red-500' 
    : isCorrectNetwork 
      ? 'bg-green-500' 
      : 'bg-yellow-500';

  // 状态文字
  const statusText = !isConnected 
    ? 'Disconnected' 
    : isCorrectNetwork 
      ? chainName 
      : `Wrong Network (${chainName})`;

  // 边框颜色
  const borderColor = !isConnected 
    ? 'border-red-500/30' 
    : isCorrectNetwork 
      ? 'border-green-500/30' 
      : 'border-yellow-500/30';

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-800/50 border ${borderColor} ${className}`}>
      <span className={`w-2 h-2 rounded-full ${statusColor} ${isConnected ? '' : 'animate-pulse'}`} />
      <span className={`text-xs font-mono ${isCorrectNetwork ? 'text-green-400' : isConnected ? 'text-yellow-400' : 'text-red-400'}`}>
        {statusText}
      </span>
      {isCorrectNetwork && status.blockNumber && (
        <span className="text-[10px] text-gray-600 font-mono">
          #{status.blockNumber}
        </span>
      )}
    </div>
  );
};

export default NetworkIndicator;
