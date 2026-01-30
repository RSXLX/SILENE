import React from 'react';
import { ExternalLink, Clock } from 'lucide-react';
import type { TransactionRecord } from '../types';
import { formatBalance, getExplorerUrl, shortenAddress } from '../services/kiteService';

interface TransactionHistoryProps {
  transactions: TransactionRecord[];
  className?: string;
}

/**
 * 交易历史列表组件
 */
export const TransactionHistory: React.FC<TransactionHistoryProps> = ({ transactions, className = '' }) => {
  if (transactions.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <Clock size={24} className="mx-auto mb-2 opacity-50" />
        <p className="text-sm">暂无交易记录</p>
        <p className="text-xs text-gray-600">执行遗产分配后将显示在这里</p>
      </div>
    );
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: TransactionRecord['status']) => {
    switch (status) {
      case 'success':
        return <span className="px-2 py-0.5 rounded text-[10px] bg-green-500/20 text-green-400">成功</span>;
      case 'pending':
        return <span className="px-2 py-0.5 rounded text-[10px] bg-yellow-500/20 text-yellow-400 animate-pulse">处理中</span>;
      case 'failed':
        return <span className="px-2 py-0.5 rounded text-[10px] bg-red-500/20 text-red-400">失败</span>;
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {transactions.map((tx, index) => (
        <div
          key={tx.txHash || index}
          className="bg-black/40 border border-gray-800/50 rounded-lg p-3 hover:border-gray-700 transition-colors"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {getStatusBadge(tx.status)}
              {tx.beneficiaryName && (
                <span className="text-xs text-gray-400">→ {tx.beneficiaryName}</span>
              )}
            </div>
            <span className="text-[10px] text-gray-600 font-mono">
              {formatTime(tx.timestamp)}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-kite-neon">
                {formatBalance(tx.amount)} KITE
              </span>
              <span className="text-[10px] text-gray-600">→</span>
              <span className="text-xs text-gray-400 font-mono">
                {shortenAddress(tx.to)}
              </span>
            </div>
            
            {tx.txHash && (
              <a
                href={getExplorerUrl(tx.txHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <span className="font-mono">{shortenAddress(tx.txHash, 6)}</span>
                <ExternalLink size={10} />
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TransactionHistory;
