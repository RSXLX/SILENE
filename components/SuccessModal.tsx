import React, { useEffect, useState } from 'react';
import { CheckCircle, ExternalLink, X, PartyPopper } from 'lucide-react';
import type { TransactionRecord } from '../types';
import { formatBalance, getExplorerUrl, shortenAddress } from '../services/kiteService';
import { useLanguage } from '../contexts/LanguageContext';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: TransactionRecord[];
  totalAmount: string;
  autoCloseSeconds?: number;
}

/**
 * 交易成功弹窗
 * 显示庆祝动画和交易详情
 */
export const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  transactions,
  totalAmount,
  autoCloseSeconds = 10,
}) => {
  const { t } = useLanguage();
  const [countdown, setCountdown] = useState(autoCloseSeconds);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(autoCloseSeconds);
      return;
    }

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          onClose();
          return autoCloseSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, onClose, autoCloseSeconds]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 + 庆祝效果 */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 彩带动画效果 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-8 animate-fall"
            style={{
              left: `${Math.random() * 100}%`,
              top: `-${Math.random() * 20}%`,
              backgroundColor: ['#00F0FF', '#8B5CF6', '#F59E0B', '#10B981', '#EC4899'][i % 5],
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
              transform: `rotate(${Math.random() * 360}deg)`,
            }}
          />
        ))}
      </div>
      
      {/* 弹窗内容 */}
      <div className="relative bg-gradient-to-br from-kite-900 to-purple-900/50 border border-cyan-500/30 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl shadow-cyan-500/20">
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-300 transition-colors"
        >
          <X size={20} />
        </button>

        {/* 成功动画 */}
        <div className="text-center mb-6">
          <div className="relative w-24 h-24 mx-auto mb-4">
            {/* 光环效果 */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 animate-pulse opacity-30" />
            <div className="absolute inset-2 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 animate-pulse opacity-20" style={{ animationDelay: '0.2s' }} />
            <div className="absolute inset-4 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 animate-pulse opacity-10" style={{ animationDelay: '0.4s' }} />
            
            {/* 勾选图标 */}
            <div className="absolute inset-0 flex items-center justify-center">
              <CheckCircle size={48} className="text-green-400 animate-bounce" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
            <PartyPopper className="text-yellow-400" size={24} />
            {t('modals.successTitle')}
            <PartyPopper className="text-yellow-400 transform scale-x-[-1]" size={24} />
          </h2>
          <p className="text-gray-400 mt-2">
            {t('modals.successSubtitle')} ({transactions.length})
          </p>
        </div>

        {/* 总金额 */}
        <div className="bg-black/40 rounded-xl p-4 mb-4 border border-cyan-500/20 text-center">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">
            {t('modals.totalBalance')}
          </div>
          <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            {formatBalance(totalAmount)} KITE
          </div>
        </div>

        {/* 交易列表 */}
        <div className="space-y-2 mb-6 max-h-40 overflow-y-auto">
          {transactions.map((tx, index) => (
            <div
              key={tx.txHash || index}
              className="flex items-center justify-between bg-black/30 rounded-lg p-2 text-sm"
            >
              <div className="flex items-center gap-2">
                <span className="text-gray-400">
                  {tx.beneficiaryName || shortenAddress(tx.to)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-cyan-400 font-mono">
                  {formatBalance(tx.amount)}
                </span>
                {tx.txHash && (
                  <a
                    href={getExplorerUrl(tx.txHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-cyan-400 transition-colors"
                  >
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 按钮 */}
        <button
          onClick={() => {
            if (transactions[0]?.txHash) {
              window.open(getExplorerUrl(transactions[0].txHash), '_blank');
            }
          }}
          className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
        >
          <ExternalLink size={18} />
          {t('modals.viewOnExplorer')}
        </button>

        {/* 自动关闭倒计时 */}
        <p className="text-center text-xs text-gray-600 mt-4">
          {countdown}s - {t('modals.close')}
        </p>
      </div>

      {/* CSS for falling animation */}
      <style>{`
        @keyframes fall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-fall {
          animation: fall linear infinite;
        }
      `}</style>
    </div>
  );
};

export default SuccessModal;
