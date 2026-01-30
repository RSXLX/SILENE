import React from 'react';
import { AlertTriangle, CheckCircle, ExternalLink, X, Coins } from 'lucide-react';
import type { DistributionPlan } from '../types';
import { formatBalance, shortenAddress } from '../services/kiteService';
import { useLanguage } from '../contexts/LanguageContext';

interface ExecutePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  plan: DistributionPlan | null;
  isLoading: boolean;
  balance: string;
}

/**
 * 遗嘱执行预览弹窗
 * 显示即将执行的转账详情
 */
export const ExecutePreviewModal: React.FC<ExecutePreviewModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  plan,
  isLoading,
  balance,
}) => {
  const { t } = useLanguage();
  
  if (!isOpen || !plan) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 弹窗内容 */}
      <div className="relative bg-kite-900 border border-gray-700 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl shadow-cyan-500/10">
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-300 transition-colors"
        >
          <X size={20} />
        </button>

        {/* 标题 */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center border border-cyan-500/30">
            <Coins size={32} className="text-cyan-400" />
          </div>
          <h2 className="text-xl font-bold text-white">{t('modals.previewTitle')}</h2>
          <p className="text-sm text-gray-400 mt-1">{t('modals.previewSubtitle')}</p>
        </div>

        {/* 余额信息 */}
        <div className="bg-black/40 rounded-lg p-4 mb-4 border border-gray-800">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">{t('modals.totalBalance')}</span>
            <span className="text-lg font-bold text-kite-neon">
              {formatBalance(balance)} KITE
            </span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-500">{t('modals.gasReserve')} (5%)</span>
            <span className="text-sm text-gray-400">
              -{formatBalance(plan.gasReserve)} KITE
            </span>
          </div>
        </div>

        {/* 分配详情 */}
        {plan.isValid ? (
          <div className="space-y-2 mb-6">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">
              {t('modals.distributable')}
            </div>
            {plan.distributions.map((d, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-black/30 rounded-lg p-3 border border-gray-800/50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                    {d.beneficiary.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">
                      {d.beneficiary.name}
                    </div>
                    <div className="text-[10px] text-gray-500 font-mono">
                      {shortenAddress(d.beneficiary.walletAddress)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-cyan-400">
                    {d.amountFormatted} KITE
                  </div>
                  <div className="text-[10px] text-gray-500">
                    {d.beneficiary.percentage}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-red-400">
              <AlertTriangle size={20} />
              <span className="font-medium">{plan.errorMessage}</span>
            </div>
            <a
              href="https://faucet.gokite.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-cyan-400 hover:text-cyan-300 mt-2"
            >
              Get Test Tokens <ExternalLink size={12} />
            </a>
          </div>
        )}

        {/* 按钮 */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-lg border border-gray-600 text-gray-300 hover:border-gray-500 transition-colors"
          >
            {t('modals.cancel')}
          </button>
          <button
            onClick={onConfirm}
            disabled={!plan.isValid || isLoading}
            className={`
              flex-1 px-4 py-3 rounded-lg font-bold
              flex items-center justify-center gap-2
              transition-all duration-200
              ${plan.isValid 
                ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:opacity-90' 
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'}
            `}
          >
            {isLoading ? (
              <>
                <span className="animate-spin">⏳</span>
                {t('common.loading')}...
              </>
            ) : (
              <>
                <CheckCircle size={18} />
                {t('modals.confirmExecute')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExecutePreviewModal;
