import { useState, useEffect, useCallback } from 'react';
import type { PendingWill, Beneficiary, PendingWillStatus } from '../types';

// 默认延迟时间：30秒（模拟180天）
const DEFAULT_DELAY_MS = 30 * 1000;

interface UsePendingWillReturn {
  pendingWill: PendingWill | null;
  remaining: number; // 剩余毫秒
  remainingSeconds: number; // 剩余秒数（向上取整）
  progress: number; // 进度百分比 0-100
  isExpired: boolean;
  sealWill: (beneficiaries: Beneficiary[], manifesto: string, balance: string) => void;
  triggerNow: () => void;
  cancelWill: () => void;
  setExecuting: () => void;
  setCompleted: () => void;
  reset: () => void;
}

/**
 * 待执行遗嘱状态管理 Hook
 * 提供倒计时、状态管理和触发功能
 */
export const usePendingWill = (
  delayMs: number = DEFAULT_DELAY_MS,
  onExpired?: () => void
): UsePendingWillReturn => {
  const [pendingWill, setPendingWill] = useState<PendingWill | null>(null);
  const [remaining, setRemaining] = useState<number>(0);
  const [hasTriggered, setHasTriggered] = useState<boolean>(false);

  // 封存遗嘱
  const sealWill = useCallback((
    beneficiaries: Beneficiary[],
    manifesto: string,
    balance: string
  ) => {
    const now = Date.now();
    const newWill: PendingWill = {
      id: crypto.randomUUID(),
      createdAt: now,
      triggerAt: now + delayMs,
      status: 'pending',
      beneficiaries,
      manifesto,
      balance,
    };
    setPendingWill(newWill);
    setRemaining(delayMs);
    setHasTriggered(false);
  }, [delayMs]);

  // 立即触发
  const triggerNow = useCallback(() => {
    if (pendingWill && pendingWill.status === 'pending') {
      setRemaining(0);
      setHasTriggered(true);
    }
  }, [pendingWill]);

  // 取消遗嘱
  const cancelWill = useCallback(() => {
    if (pendingWill) {
      setPendingWill({ ...pendingWill, status: 'cancelled' });
      setRemaining(0);
    }
  }, [pendingWill]);

  // 设置为执行中
  const setExecuting = useCallback(() => {
    if (pendingWill) {
      setPendingWill({ ...pendingWill, status: 'executing' });
    }
  }, [pendingWill]);

  // 设置为已完成
  const setCompleted = useCallback(() => {
    if (pendingWill) {
      setPendingWill({ ...pendingWill, status: 'completed' });
    }
  }, [pendingWill]);

  // 重置状态
  const reset = useCallback(() => {
    setPendingWill(null);
    setRemaining(0);
    setHasTriggered(false);
  }, []);

  // 倒计时逻辑
  useEffect(() => {
    if (!pendingWill || pendingWill.status !== 'pending') return;

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, pendingWill.triggerAt - now);
      setRemaining(diff);

      if (diff === 0 && !hasTriggered) {
        setHasTriggered(true);
        clearInterval(interval);
        onExpired?.();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [pendingWill, hasTriggered, onExpired]);

  // 计算派生值
  const remainingSeconds = Math.ceil(remaining / 1000);
  const progress = pendingWill 
    ? Math.max(0, Math.min(100, ((delayMs - remaining) / delayMs) * 100))
    : 0;
  const isExpired = remaining === 0 && hasTriggered;

  return {
    pendingWill,
    remaining,
    remainingSeconds,
    progress,
    isExpired,
    sealWill,
    triggerNow,
    cancelWill,
    setExecuting,
    setCompleted,
    reset,
  };
};

export default usePendingWill;
