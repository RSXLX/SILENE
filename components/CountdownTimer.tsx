import React from 'react';
import { Timer, Zap, XCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface CountdownTimerProps {
  remainingSeconds: number;
  progress: number;
  status: 'pending' | 'executing' | 'completed' | 'cancelled';
  onTriggerNow: () => void;
  onCancel?: () => void;
}

/**
 * 30秒倒计时组件
 * 显示剩余时间、进度条和快进按钮
 */
export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  remainingSeconds,
  progress,
  status,
  onTriggerNow,
  onCancel,
}) => {
  const { t } = useLanguage();

  // 格式化时间显示
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (status === 'completed') {
    return (
      <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 text-center">
        <div className="text-4xl mb-2">✅</div>
        <div className="text-lg font-bold text-green-400">{t('countdown.completed')}</div>
      </div>
    );
  }

  if (status === 'cancelled') {
    return (
      <div className="bg-gray-500/10 border border-gray-500/30 rounded-xl p-6 text-center">
        <div className="text-4xl mb-2">❌</div>
        <div className="text-lg font-bold text-gray-400">{t('countdown.cancelled')}</div>
      </div>
    );
  }

  if (status === 'executing') {
    return (
      <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-6 text-center">
        <div className="text-4xl mb-2 animate-pulse">⚡</div>
        <div className="text-lg font-bold text-purple-400">{t('countdown.executing')}</div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-kite-900 to-purple-900/30 border border-cyan-500/30 rounded-xl p-6">
      {/* 标题 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-cyan-400">
          <Timer size={20} className="animate-pulse" />
          <span className="text-sm font-medium uppercase tracking-wider">
            {t('countdown.title')}
          </span>
        </div>
        <span className="text-xs text-gray-500 bg-black/30 px-2 py-1 rounded">
          {t('countdown.simulating')}
        </span>
      </div>

      {/* 大字体倒计时 */}
      <div className="text-center mb-4">
        <div className="text-5xl font-mono font-bold text-white tracking-wider">
          {formatTime(remainingSeconds)}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {t('countdown.remaining')}
        </div>
      </div>

      {/* 进度条 */}
      <div className="w-full h-2 bg-black/30 rounded-full overflow-hidden mb-4">
        <div 
          className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* 按钮区 */}
      <div className="flex gap-3">
        <button
          onClick={onTriggerNow}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold hover:opacity-90 transition-opacity"
        >
          <Zap size={18} />
          {t('countdown.triggerNow')}
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-3 rounded-lg border border-gray-600 text-gray-400 hover:border-gray-500 transition-colors"
          >
            <XCircle size={18} />
          </button>
        )}
      </div>

      {/* 提示文字 */}
      <div className="text-center mt-4 text-xs text-gray-600">
        {t('countdown.hint')}
      </div>
    </div>
  );
};

export default CountdownTimer;
