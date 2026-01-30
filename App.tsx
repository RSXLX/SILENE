import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Layout } from './components/Layout';
import { TerminalLog } from './components/TerminalLog';
import { Simulator } from './components/Simulator';
import { NetworkIndicator } from './components/NetworkIndicator';
import { KiteBadge } from './components/KiteBadge';
import { TransactionHistory } from './components/TransactionHistory';
import { ExecutePreviewModal } from './components/ExecutePreviewModal';
import { SuccessModal } from './components/SuccessModal';
import { CountdownTimer } from './components/CountdownTimer';
import { usePendingWill } from './hooks/usePendingWill';
import { interpretSoul, scanSocialSentinel } from './services/agentService';
import { 
  initKiteSDK, 
  getWalletSigner, 
  getAAWalletAddress, 
  sendPayment, 
  getExplorerUrl,
  KITE_CONFIG,
  getNativeBalance,
  formatBalance,
  saveTransaction,
  getTransactions,
  calculateDistribution,
  getNetworkStatus,
  shortenAddress,
  getAddressExplorerUrl,
  isValidAddress
} from './services/kiteService';
import { AppStatus, SarcophagusState, TransactionLog, Beneficiary, Wallet, Token, KiteAgent, TransactionRecord, DistributionPlan, NetworkStatus } from './types';
import { Signer, BrowserProvider } from 'ethers';
import { Circle, Heart, Skull, Shield, Activity, Lock, Wallet as WalletIcon, Clock, Zap, Play, Share2, Link, Plus, Coins, User, RefreshCw, ExternalLink } from 'lucide-react';
import { useLanguage } from './contexts/LanguageContext';

// --- Helper Components ---

const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'danger' | 'outline' | 'purple' | 'twitter' }> = ({ className, variant = 'primary', ...props }) => {
  const baseStyle = "px-6 py-3 rounded font-mono uppercase tracking-wider text-sm font-bold transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-kite-neon text-black hover:bg-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.4)]",
    danger: "bg-kite-danger text-white hover:bg-red-600 shadow-[0_0_15px_rgba(255,0,60,0.4)]",
    purple: "bg-purple-600 text-white hover:bg-purple-500 shadow-[0_0_15px_rgba(147,51,234,0.4)]",
    twitter: "bg-[#1DA1F2] text-white hover:bg-[#1a91da] shadow-[0_0_15px_rgba(29,161,242,0.4)]",
    outline: "border border-gray-600 text-gray-300 hover:border-kite-neon hover:text-kite-neon bg-transparent"
  };
  return <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props} />;
};

const Card: React.FC<{ children: React.ReactNode; title: string; icon?: React.ReactNode, className?: string, action?: React.ReactNode }> = ({ children, title, icon, className, action }) => (
  <div className={`bg-kite-800/50 border border-gray-700/50 rounded-xl p-6 backdrop-blur-md ${className}`}>
    <div className="flex items-center justify-between mb-4 border-b border-gray-700/50 pb-2">
      <div className="flex items-center gap-2 text-gray-400 uppercase text-xs font-bold tracking-widest">
        {icon}
        <span>{title}</span>
      </div>
      {action}
    </div>
    {children}
  </div>
);

// --- Mock Generators ---

const generateMockWallet = (index: number): Wallet => {
  const ethAmount = Number((Math.random() * 5).toFixed(4));
  const usdcAmount = Math.floor(Math.random() * 10000) + 500;
  const kiteAmount = Math.floor(Math.random() * 50000);
  
  return {
    id: `w-${Date.now()}-${index}`,
    address: `0x${Math.random().toString(16).substr(2, 4)}...${Math.random().toString(16).substr(2, 4)}`,
    label: index === 0 ? "Primary Vault" : `Sub-Account ${index}`,
    tokens: [
      { symbol: 'ETH', amount: ethAmount, price: 3200 },
      { symbol: 'USDC', amount: usdcAmount, price: 1 },
      { symbol: 'KITE', amount: kiteAmount, price: 0.15 },
    ]
  };
};

const calculateNetWorth = (wallets: Wallet[]) => {
  return wallets.reduce((total, wallet) => {
    return total + wallet.tokens.reduce((wTotal, t) => wTotal + (t.amount * t.price), 0);
  }, 0);
};

// --- Main App Component ---

const App: React.FC = () => {
  const { t, language } = useLanguage();
  
  // --- State ---
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  
  // 系统初始化日志
  useEffect(() => {
    // 延迟一点显示，模拟系统启动
    const timer = setTimeout(() => {
        addLog('HEARTBEAT', 'SYSTEM INITIALIZED: Sileme Protocol v1.0.0');
        addLog('HEARTBEAT', 'Connecting to Kite Chain Testnet...');
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const [data, setData] = useState<SarcophagusState>({
    userProfile: null,
    wallets: [],
    lastActiveTimestamp: Date.now(),
    timeThresholdDays: 180,
    manifesto: "",
    beneficiaries: [],
    status: AppStatus.IDLE
  });
  const [logs, setLogs] = useState<TransactionLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isWalletConnecting, setIsWalletConnecting] = useState(false); // Specific loading state for wallet
  const [isWatcherChecking, setIsWatcherChecking] = useState(false);
  const [draftManifesto, setDraftManifesto] = useState("");
  const [simulatedDate, setSimulatedDate] = useState(new Date());
  
  // Simulator State
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  
  // Kite Agent State
  const [kiteAgent, setKiteAgent] = useState<KiteAgent | null>(null);
  const [walletSigner, setWalletSigner] = useState<Signer | null>(null);
  const [walletProvider, setWalletProvider] = useState<BrowserProvider | null>(null);

  // 产品体验优化状态
  const [realBalance, setRealBalance] = useState<string>("0");
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus | null>(null);
  const [transactionHistory, setTransactionHistory] = useState<TransactionRecord[]>([]);
  const [distributionPlan, setDistributionPlan] = useState<DistributionPlan | null>(null);
  
  // 弹窗状态
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isDistributing, setIsDistributing] = useState(false);
  const [completedTransactions, setCompletedTransactions] = useState<TransactionRecord[]>([]);

  // 延迟转账 MVP: 待执行遗嘱状态管理
  const handleWillExpired = useCallback(async () => {
    // 倒计时结束，自动触发执行流程
    addLog('CHAIN_TX', '⏰ Countdown complete. Initiating will execution...');
    
    if (kiteAgent && walletProvider && data.beneficiaries.length > 0) {
      addLog('AI_THINKING', 'Agent validating distribution plan...');
      
      // 刷新余额
      const currentBalance = await getNativeBalance(kiteAgent.aaAddress, walletProvider);
      setRealBalance(currentBalance);
      
      // 计算分配计划
      const plan = calculateDistribution(currentBalance, data.beneficiaries);
      setDistributionPlan(plan);
      
      // 显示预览弹窗
      addLog('DISTRIBUTION', `Plan Ready: ${formatBalance(plan.totalAmount)} KITE to ${plan.distributions.length} beneficiaries.`);
      setIsPreviewModalOpen(true);
    } else {
      addLog('ALERT', 'Cannot execute: No wallet or beneficiaries configured.');
    }
  }, [kiteAgent, walletProvider, data.beneficiaries]);

  const {
    pendingWill,
    remainingSeconds,
    progress: countdownProgress,
    isExpired,
    sealWill,
    triggerNow,
    cancelWill,
    setExecuting: setWillExecuting,
    setCompleted: setWillCompleted,
    reset: resetPendingWill,
  } = usePendingWill(30 * 1000, handleWillExpired);

  // 封存遗嘱处理函数
  const handleSealWill = async () => {
    if (!kiteAgent || !walletProvider) {
      addLog('ALERT', 'Please connect wallet first.');
      return;
    }
    
    if (data.beneficiaries.length === 0) {
      addLog('ALERT', 'No beneficiaries configured.');
      return;
    }
    
    // 检查余额
    const balance = await getNativeBalance(kiteAgent.aaAddress, walletProvider);
    if (BigInt(balance) <= 0) {
      addLog('ALERT', 'Insufficient balance. Please fund your wallet.');
      return;
    }
    
    // 封存遗嘱，启动倒计时
    sealWill(data.beneficiaries, data.manifesto, balance);
    addLog('CHAIN_TX', `🔏 Will sealed. 30-second countdown started (simulating 180 days).`);
    addLog('AI_THINKING', 'Agent monitoring for vital signs...');
  };

  // --- Derived State ---
  const netWorth = useMemo(() => calculateNetWorth(data.wallets), [data.wallets]);
  const aggregatedTokens = useMemo(() => {
    const totals: Record<string, number> = {};
    data.wallets.forEach(w => {
      w.tokens.forEach(t => {
        totals[t.symbol] = (totals[t.symbol] || 0) + t.amount;
      });
    });
    return totals;
  }, [data.wallets]);

  // --- Helpers ---
  const addLog = (type: TransactionLog['type'], details: string) => {
    const hash = '0x' + Math.random().toString(16).substr(2, 8) + '...';
    setLogs(prev => [...prev, {
      id: Math.random().toString(36),
      timestamp: simulatedDate.getTime(),
      type,
      details,
      hash
    }]);
  };

  // --- Handlers ---

  const handleSocialLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      // Create Mock Profile
      const mockProfile = {
        id: 'user-twitter-123',
        handle: '@crypto_Reeeece',
        platform: 'twitter' as const,
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'
      };
      
      // Social login starts with NO wallets to force the "Link" step
      setData(prev => ({ 
        ...prev, 
        userProfile: mockProfile,
        wallets: [], 
        status: AppStatus.ONBOARDING
      }));
      setStatus(AppStatus.ONBOARDING);
      
      addLog('HEARTBEAT', `Identity Verified: ${mockProfile.handle}`);
      setIsLoading(false);
    }, 1500);
  };

  const handleWalletLogin = async () => {
    setIsLoading(true);
    try {
      // 初始化 Kite SDK
      initKiteSDK();
      
      // 获取钱包 Signer 和 Provider
      const { provider, signer, address } = await getWalletSigner();
      setWalletSigner(signer);
      setWalletProvider(provider);
      
      // 获取 AA Wallet 地址 (Agent 身份)
      let aaAddress: string;
      try {
        aaAddress = await getAAWalletAddress(signer);
      } catch (aaError) {
        // 如果 AA 获取失败，使用 EOA 地址作为后备
        console.warn('AA Wallet creation fallback to EOA:', aaError);
        aaAddress = address;
      }
      
      // 创建 Kite Agent
      const agent: KiteAgent = {
        aaAddress: aaAddress,
        ownerAddress: address,
        createdAt: Date.now(),
      };
      setKiteAgent(agent);
      
      // 获取真实余额 (新增)
      const balance = await getNativeBalance(aaAddress, provider);
      setRealBalance(balance);
      
      // 获取网络状态 (新增)
      const netStatus = await getNetworkStatus(provider);
      setNetworkStatus(netStatus);
      
      // 加载交易历史 (新增)
      const savedTxs = getTransactions();
      setTransactionHistory(savedTxs);
      
      // 创建用户档案
      const shortAddress = shortenAddress(aaAddress);
      const mockProfile = {
        id: `agent-${aaAddress.slice(0, 8)}`,
        handle: shortAddress,
        platform: 'wallet' as const,
        avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${aaAddress}`
      };
      
      // 创建初始钱包 (Mock 资产展示 + 真实 KITE 余额)
      const initialWallet = generateMockWallet(0);
      initialWallet.address = shortAddress;
      // 添加真实 KITE 余额
      const kiteBalance = parseFloat(formatBalance(balance));
      initialWallet.tokens.push({ symbol: 'KITE (Real)', amount: kiteBalance, price: 0.15 });

      setData(prev => ({ 
        ...prev, 
        userProfile: mockProfile,
        wallets: [initialWallet],
        status: AppStatus.ONBOARDING
      }));
      setStatus(AppStatus.ONBOARDING);
      
      addLog('HEARTBEAT', `Kite Agent Created: ${shortAddress}`);
      addLog('WALLET_LINK', `AA Wallet Linked: ${aaAddress}`);
      addLog('CHAIN_TX', `Balance Synced: ${formatBalance(balance)} KITE`);
      addLog('HEARTBEAT', `Network Connected: ${KITE_CONFIG.chainId} (Testnet)`);
      
    } catch (error: any) {
      console.error('Wallet login failed:', error);
      if (error.message === 'WALLET_NOT_FOUND') {
        addLog('ALERT', 'Error: Please install MetaMask or a compatible wallet');
      } else if (error.code === 4001 || error.message?.includes('rejected')) {
        addLog('ALERT', 'Error: Wallet connection was rejected by user');
      } else {
        addLog('ALERT', `Error: ${error.message || 'Failed to connect wallet'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkNewWallet = () => {
    setIsWalletConnecting(true);
    // Simulate Metamask/WalletConnect delay
    setTimeout(() => {
        const isFirstWallet = data.wallets.length === 0;
        // Fix index logic: if 0 wallets, use index 0 (Primary), otherwise next index
        const newWallet = generateMockWallet(data.wallets.length);
        
        setData(prev => ({
          ...prev,
          wallets: [...prev.wallets, newWallet]
        }));

        if (data.userProfile?.platform === 'twitter' && isFirstWallet) {
            addLog('WALLET_LINK', `PROTOCOL BINDING COMPLETE: ${data.userProfile.handle} + ${newWallet.address}`);
        } else {
            addLog('WALLET_LINK', `New Wallet Stacked: ${newWallet.address} (+${newWallet.tokens.length} assets)`);
        }
        
        setIsWalletConnecting(false);
    }, 1200);
  };

  const handleAnalyzeSoul = async () => {
    if (!draftManifesto) return;
    setIsLoading(true);
    
    // AI 思考日志
    addLog('AI_THINKING', 'Connecting to Agent AI via KITE_ORACLE_NODE...');
    addLog('AI_THINKING', 'Parsing natural language intent to Solidity bytecode...');

    try {
      // Pass current language to Agent AI
      const beneficiaries = await interpretSoul(draftManifesto, language);
      
      addLog('AI_THINKING', `Analysis Complete: Identified ${beneficiaries.length} beneficiaries with 98.5% confidence.`);
      
      setData(prev => ({
        ...prev,
        manifesto: draftManifesto,
        beneficiaries,
        status: AppStatus.MONITORING,
        lastActiveTimestamp: simulatedDate.getTime()
      }));
      setStatus(AppStatus.MONITORING);
      addLog('HEARTBEAT', 'Sarcophagus Sealed. Watcher Agent Deployed.');
      addLog('ALERT', `Intent Parsed: ${beneficiaries.length} beneficiaries identified.`);
    } catch (e) {
      console.error(e);
      addLog('ALERT', 'Soul Interpretation Failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForceScan = async () => {
    if (!data.userProfile?.handle) return;
    addLog('SENTINEL', 'Manual Scan Triggered...');
    // Pass current language to Agent AI
    const result = await scanSocialSentinel(data.userProfile.handle, data.manifesto, language);
    setData(prev => ({ ...prev, sentinel: result }));
    if (result.status === 'THREAT_DETECTED') {
      addLog('ALERT', `SENTINEL THREAT: ${result.evidence}`);
    } else {
      addLog('SENTINEL', 'Status Secure. No contradictions found.');
    }
  };

  const handleHeartbeat = () => {
    setData(prev => ({ ...prev, lastActiveTimestamp: simulatedDate.getTime() }));
    addLog('HEARTBEAT', 'Proof of Life verified via Activity. Timer reset.');
  };

  const handleManualWatcherCheck = () => {
    if (status !== AppStatus.MONITORING) return;
    setIsWatcherChecking(true);
    addLog('SENTINEL', 'Watcher Agent: Manual verification requested...');

    setTimeout(() => {
        const daysSinceActive = (simulatedDate.getTime() - data.lastActiveTimestamp) / (1000 * 60 * 60 * 24);
        
        if (daysSinceActive > data.timeThresholdDays) {
             setStatus(AppStatus.ACTIVATED);
             addLog('ALERT', 'CRITICAL: Dead Man Switch Triggered by Manual Check.');
             setTimeout(() => {
               setStatus(AppStatus.EXECUTED);
               addLog('DISTRIBUTION', 'Executor Agent Activated. Liquidation started.');
               data.beneficiaries.forEach(b => {
                  addLog('DISTRIBUTION', `Sent ${(netWorth * (b.percentage/100)).toFixed(2)} USD value to ${b.name} (${b.walletAddress}). Memo: ${b.reason}`);
               });
             }, 3000);
        } else {
             addLog('SENTINEL', `Watcher Agent: STATUS OK. Subject dormant for ${daysSinceActive.toFixed(1)} days (Threshold: ${data.timeThresholdDays}).`);
        }
        setIsWatcherChecking(false);
    }, 1000);
  };

  // Simulate Time Travel for Demo purposes
  const advanceTime = (days: number) => {
    const newDate = new Date(simulatedDate);
    newDate.setDate(newDate.getDate() + days);
    setSimulatedDate(newDate);
    addLog('ALERT', `Simulation: Time jumped ${days} days forward.`);
  };

  const handleSimulationComplete = (result: any) => {
    addLog('SIMULATION', `Scenario Run: ${result.sentimentShift} - ${result.narrative.substring(0, 50)}...`);
  };

  // --- Effects ---

  // Watcher Logic
  useEffect(() => {
    if (status !== AppStatus.MONITORING) return;

    const checkVitalSigns = async () => {
      const daysSinceActive = (simulatedDate.getTime() - data.lastActiveTimestamp) / (1000 * 60 * 60 * 24);
      
      if (daysSinceActive > data.timeThresholdDays) {
        setStatus(AppStatus.ACTIVATED);
        addLog('AI_THINKING', `Vital Signs Monitor: HEARTBEAT_LOST for ${daysSinceActive.toFixed(1)} days (Threshold: ${data.timeThresholdDays})`);
        addLog('ALERT', 'CRITICAL: Dead Man Switch Triggered (Protocol 0xDEAD).');
        
        // 计算分配方案
        if (walletProvider && kiteAgent) {
          addLog('AI_THINKING', 'Executor Agent: Constructing liquidation plan...');
          
          // 刷新余额
          const currentBalance = await getNativeBalance(kiteAgent.aaAddress, walletProvider);
          setRealBalance(currentBalance);
          
          // 计算分配计划
          const plan = calculateDistribution(currentBalance, data.beneficiaries);
          setDistributionPlan(plan);
          
          // 显示预览弹窗
          addLog('DISTRIBUTION', `Plan Ready: Distributed ${formatBalance(plan.totalAmount)} KITE to ${plan.distributions.length} beneficiaries.`);
          setIsPreviewModalOpen(true);
        } else {
          addLog('ALERT', 'No active wallet connection found for execution.');
        }
      }
    };

    checkVitalSigns();
  }, [simulatedDate, data.lastActiveTimestamp, status, data.timeThresholdDays, walletProvider, kiteAgent, data.beneficiaries]);

  // 执行实际分配（从预览弹窗确认后调用）
  const executeDistribution = async () => {
    if (!walletSigner || !kiteAgent || !distributionPlan || !distributionPlan.isValid) {
      addLog('ALERT', 'Cannot execute distribution: invalid state');
      return;
    }

    setIsDistributing(true);
    setIsPreviewModalOpen(false);
    
    const completedTxs: TransactionRecord[] = [];
    let totalSent = BigInt(0);

    addLog('DISTRIBUTION', 'Executor Agent Activated. Initiating liquidation...');
    addLog('CHAIN_TX', 'Preparing Proof-of-Death transaction batch...');

    for (const dist of distributionPlan.distributions) {
      try {
        addLog('CHAIN_TX', `Constructing tx for ${dist.beneficiary.name} (${dist.amountFormatted} KITE)...`);
        addLog('DISTRIBUTION', `Broadcasting to Kite Mempool...`);
        
        const result = await sendPayment(dist.beneficiary.walletAddress, dist.amount, walletSigner);
        
        if (result.success && result.txHash) {
          const txRecord: TransactionRecord = {
            txHash: result.txHash,
            from: kiteAgent.aaAddress,
            to: dist.beneficiary.walletAddress,
            amount: dist.amount,
            timestamp: Date.now(),
            status: 'success',
            beneficiaryName: dist.beneficiary.name,
          };
          
          // 保存交易记录
          saveTransaction(txRecord);
          completedTxs.push(txRecord);
          totalSent += BigInt(dist.amount);
          
          addLog('DISTRIBUTION', `✓ TX Success: ${result.txHash}`);
        } else {
          addLog('ALERT', `✗ Failed to send to ${dist.beneficiary.name}: ${result.error}`);
        }
      } catch (error: any) {
        addLog('ALERT', `Payment error for ${dist.beneficiary.name}: ${error.message}`);
      }
    }

    // 更新状态
    setCompletedTransactions(completedTxs);
    setTransactionHistory(getTransactions());
    setStatus(AppStatus.EXECUTED);
    setIsDistributing(false);
    
    // 显示成功弹窗
    if (completedTxs.length > 0) {
      setIsSuccessModalOpen(true);
    }
    
    addLog('DISTRIBUTION', `Distribution complete. ${completedTxs.length} transactions executed.`);
  };

  // Social Sentinel Auto-Scan
  useEffect(() => {
    if (status === AppStatus.MONITORING && data.userProfile?.handle) {
      const interval = setInterval(async () => {
        // Only 10% chance to random scan to not spam logs in demo
        if (Math.random() > 0.9) {
           addLog('AI_THINKING', `Sentinel System: Scanning social feed for @${data.userProfile?.handle}...`);
           const result = await scanSocialSentinel(data.userProfile!.handle, data.manifesto, language);
           setData(prev => ({ ...prev, sentinel: result }));
           if (result.status === 'THREAT_DETECTED') {
             addLog('ALERT', `SENTINEL THREAT: ${result.evidence}`);
           } else {
             addLog('SENTINEL', `Scan Clear. No duress signals found.`);
           }
        }
      }, 30000); 
      return () => clearInterval(interval);
    }
  }, [status, data.userProfile, data.manifesto, language]);


  // --- Render Views ---

  if (status === AppStatus.IDLE) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-kite-neon to-purple-600 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative w-32 h-32 rounded-full bg-black border-2 border-kite-neon/50 flex items-center justify-center text-4xl">
               <Skull className="text-gray-300" size={48} />
            </div>
          </div>
          <div className="space-y-4 max-w-lg">
            <h2 className="text-4xl font-bold text-white tracking-tighter whitespace-pre-line">{t('home.title')}</h2>
            <p className="text-gray-400 text-lg whitespace-pre-line">
              {t('home.subtitle')}
            </p>
            <div className="flex flex-col gap-4 mt-8 w-full max-w-xs mx-auto">
               <Button variant="twitter" onClick={handleSocialLogin} disabled={isLoading}>
                 {isLoading ? <Activity className="animate-spin" /> : <Share2 size={16} />}
                 {t('home.login')}
               </Button>
               <Button variant="outline" onClick={handleWalletLogin} disabled={isLoading} className="border-gray-500 hover:border-white text-white">
                 {isLoading ? <Activity className="animate-spin" /> : <WalletIcon size={16} />} 
                 {t('home.connect')}
               </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Shared Account Header for logged in states
  const AccountHeader = () => (
    <div className="flex items-center justify-between bg-black/40 border-b border-gray-800 p-4 mb-6 rounded-lg">
       <div className="flex items-center gap-3">
          {data.userProfile?.avatarUrl && (
            <img src={data.userProfile.avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full border border-gray-700" />
          )}
          <div>
            <div className="flex items-center gap-2">
               <h3 className="font-bold text-white text-sm">{data.userProfile?.handle}</h3>
               <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${data.userProfile?.platform === 'twitter' ? 'bg-[#1DA1F2]/20 text-[#1DA1F2]' : 'bg-kite-neon/20 text-kite-neon'}`}>
                 {data.userProfile?.platform === 'twitter' 
                    ? (data.wallets.length > 0 ? t('dashboard.socialLinked') : t('dashboard.socialVerified')) 
                    : t('dashboard.walletAuth')}
               </span>
            </div>
            <p className="text-xs text-gray-500 font-mono">UID: {data.userProfile?.id}</p>
          </div>
       </div>
       {/* 中间区域：网络状态 + 真实余额 */}
       <div className="flex items-center gap-4">
         <NetworkIndicator status={networkStatus} />
         {kiteAgent && (
           <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30">
             <Coins size={14} className="text-cyan-400" />
             <span className="text-sm font-bold text-cyan-400">
               {formatBalance(realBalance)} KITE
             </span>
             <a
               href={getAddressExplorerUrl(kiteAgent.aaAddress)}
               target="_blank"
               rel="noopener noreferrer"
               className="text-cyan-500 hover:text-cyan-300 transition-colors"
             >
               <ExternalLink size={12} />
             </a>
           </div>
         )}
       </div>
       <div className="text-right">
          <div className="text-xs text-gray-500 font-mono uppercase">{t('dashboard.totalNetWorth')}</div>
          <div className="text-xl font-bold text-kite-neon">${netWorth.toLocaleString()}</div>
       </div>
    </div>
  );

  if (status === AppStatus.ONBOARDING) {
    return (
      <Layout>
        <AccountHeader />
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">{t('onboarding.header')}</h2>
            <p className="text-gray-400">{t('onboarding.subHeader')}</p>
            
            <div className="space-y-4">
              {/* Manifesto Input */}
              <div>
                <label className="block text-xs font-mono text-kite-neon mb-2 uppercase">{t('onboarding.manifestoLabel')}</label>
                <textarea 
                  value={draftManifesto}
                  onChange={(e) => setDraftManifesto(e.target.value)}
                  className="w-full h-48 bg-kite-800/50 border border-gray-700 rounded-lg p-4 text-white placeholder-gray-600 focus:border-kite-neon focus:ring-1 focus:ring-kite-neon transition-all resize-none"
                  placeholder={t('onboarding.manifestoPlaceholder')}
                />
              </div>

              <div className="flex items-center justify-between bg-kite-800/30 p-4 rounded border border-gray-700">
                 <div className="flex items-center gap-3">
                   <Clock className="text-kite-warning" />
                   <div>
                     <p className="text-sm font-bold text-gray-200">{t('onboarding.triggerTitle')}</p>
                     <p className="text-xs text-gray-500">{t('onboarding.triggerSub')}</p>
                   </div>
                 </div>
                 <div className="text-xl font-mono text-kite-neon">180 {t('common.days')}</div>
              </div>
              <Button onClick={handleAnalyzeSoul} disabled={!draftManifesto || isLoading || data.wallets.length === 0} className="w-full flex items-center justify-center gap-2">
                {isLoading ? (
                  <>{t('common.loading')} <Activity className="animate-spin" size={16}/></>
                ) : (
                  <>{t('onboarding.analyzeBtn')} <Lock size={16}/></>
                )}
              </Button>
              {data.wallets.length === 0 && (
                <p className="text-center text-xs text-kite-danger animate-pulse">{t('onboarding.linkWalletErr')}</p>
              )}
            </div>
          </div>

          <div className="space-y-6">
             <Card 
               title={t('onboarding.portfolioTitle')} 
               icon={<WalletIcon size={16}/>} 
               action={
                  data.wallets.length > 0 ? (
                    <button 
                        onClick={handleLinkNewWallet} 
                        disabled={isWalletConnecting}
                        className="text-xs text-kite-neon hover:underline flex items-center gap-1 bg-kite-neon/10 px-2 py-1 rounded transition-colors"
                    >
                        {isWalletConnecting ? <RefreshCw className="animate-spin" size={12}/> : <Plus size={12}/>} 
                        {isWalletConnecting ? t('common.connecting') : t('onboarding.linkWallet')}
                    </button>
                  ) : null
                }
             >
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                   {data.wallets.length === 0 && (
                     <div className="flex flex-col items-center justify-center py-8 border border-dashed border-gray-700 rounded bg-white/5 space-y-3">
                       <div className="p-3 bg-kite-neon/10 rounded-full">
                         <WalletIcon className="text-kite-neon" size={24} />
                       </div>
                       <div className="text-center">
                         <p className="text-sm font-bold text-gray-200">{t('onboarding.noWalletTitle')}</p>
                         <p className="text-[10px] text-gray-500 mb-3">{t('onboarding.noWalletSub')}</p>
                         <Button variant="outline" onClick={handleLinkNewWallet} disabled={isWalletConnecting} className="py-2 px-4 text-xs h-auto w-full">
                           {isWalletConnecting ? <RefreshCw className="animate-spin" size={12}/> : <Link size={12}/>}
                           {t('onboarding.connectPrimary')}
                         </Button>
                       </div>
                     </div>
                   )}
                   {data.wallets.map((wallet) => (
                     <div key={wallet.id} className="bg-black/40 p-3 rounded border border-gray-800/50">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-bold text-gray-300 flex items-center gap-2">
                            <WalletIcon size={10} className="text-gray-500"/>
                            {wallet.label}
                          </span>
                          <span className="text-[10px] text-gray-600 font-mono bg-black px-1 rounded">{wallet.address}</span>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {wallet.tokens.map((t, idx) => (
                             <span key={idx} className="text-[10px] bg-white/5 px-2 py-1 rounded text-gray-400 font-mono border border-white/5">
                               {t.amount.toFixed(2)} {t.symbol}
                             </span>
                          ))}
                        </div>
                     </div>
                   ))}
                </div>
                
                {/* Aggregated Totals */}
                <div className="mt-4 pt-4 border-t border-gray-700/50">
                   <div className="flex items-center justify-between mb-3">
                      <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">{t('onboarding.superposition')}</div>
                      <Coins size={14} className="text-gray-600" />
                   </div>
                   <div className="grid grid-cols-3 gap-2">
                      {Object.entries(aggregatedTokens).map(([symbol, amount]) => (
                        <div key={symbol} className="bg-kite-900/40 p-2 rounded text-center border border-gray-800">
                           <div className="text-lg font-bold text-white leading-none mb-1">{amount.toFixed(2)}</div>
                           <div className="text-[9px] text-gray-500 font-mono">{symbol}</div>
                        </div>
                      ))}
                      {Object.keys(aggregatedTokens).length === 0 && <div className="col-span-3 text-[10px] text-gray-600 text-center">{t('onboarding.noAssets')}</div>}
                   </div>
                </div>
             </Card>
          </div>
        </div>
      </Layout>
    );
  }

  // --- Dashboard / Monitoring View ---
  const daysInactive = Math.floor((simulatedDate.getTime() - data.lastActiveTimestamp) / (1000 * 60 * 60 * 24));
  const progress = Math.min((daysInactive / data.timeThresholdDays) * 100, 100);
  const isDead = status === AppStatus.ACTIVATED || status === AppStatus.EXECUTED;

  return (
    <Layout>
      <AccountHeader />
      <div className="grid lg:grid-cols-3 gap-6 h-full">
        {/* Left Column: Status */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
             <Card 
                title={t('dashboard.sarcophagusStatus')} 
                icon={<Activity size={16} />} 
                className="relative overflow-hidden"
                action={
                    !isDead && (
                        <button 
                          onClick={handleManualWatcherCheck}
                          disabled={isWatcherChecking}
                          className="text-[10px] font-mono uppercase border border-kite-neon/50 text-kite-neon px-2 py-1 rounded hover:bg-kite-neon/10 flex items-center gap-1 disabled:opacity-50 transition-colors"
                        >
                           <RefreshCw size={10} className={isWatcherChecking ? "animate-spin" : ""} /> 
                           {t('dashboard.pingAgent')}
                        </button>
                    )
                }
             >
                {isDead && (
                   <div className="absolute inset-0 bg-kite-danger/10 z-0 animate-pulse"></div>
                )}
                <div className="relative z-10">
                   <div className={`text-4xl font-bold font-mono mb-2 ${isDead ? 'text-kite-danger animate-glitch' : 'text-kite-neon'}`}>
                      {status === AppStatus.MONITORING ? t('dashboard.alive') : status}
                   </div>
                   <p className="text-xs text-gray-400 font-mono">
                      WATCHER AGENT: {isDead ? t('dashboard.watcherTriggered') : t('dashboard.watcherListening')}
                   </p>
                </div>
             </Card>
             
             {/* Social Sentinel Card */}
             {data.userProfile?.handle && (
               <Card 
                  title={t('dashboard.socialSentinel')} 
                  icon={<Share2 size={16} />} 
                  className={`transition-colors duration-500 ${data.sentinel?.status === 'THREAT_DETECTED' ? 'border-kite-danger bg-kite-danger/5' : 'border-gray-700/50'}`}
                  action={<button onClick={handleForceScan} className="text-[10px] uppercase border border-gray-600 px-2 py-1 rounded hover:bg-white/10">{t('dashboard.forceScan')}</button>}
               >
                  <div className="flex flex-col h-full justify-between">
                    <div>
                      <div className={`text-xl font-bold font-mono mb-1 ${data.sentinel?.status === 'THREAT_DETECTED' ? 'text-kite-danger' : 'text-green-400'}`}>
                         {data.sentinel?.status === 'THREAT_DETECTED' ? t('dashboard.threatDetected') : t('dashboard.secure')}
                      </div>
                      <div className="text-xs text-gray-500 mb-2">{t('dashboard.target')}: {data.userProfile.handle}</div>
                    </div>
                    
                    {data.sentinel?.evidence ? (
                      <div className="text-[10px] p-2 bg-black/40 rounded border border-gray-700 italic text-gray-300">
                        "{data.sentinel.evidence}"
                      </div>
                    ) : (
                      <div className="text-[10px] text-gray-600">{t('dashboard.noContradictions')}</div>
                    )}
                  </div>
               </Card>
             )}
          </div>

          <Card title={t('dashboard.deadManSwitch')} icon={<Clock size={16} />}>
             <div className="mb-2 flex justify-between items-end">
               <span className="text-5xl font-mono font-bold text-white">{daysInactive}</span>
               <span className="text-sm text-gray-500 mb-2 font-mono">/ {data.timeThresholdDays} {t('dashboard.daysOfSilence')}</span>
             </div>
             
             {/* Progress Bar */}
             <div className="h-4 w-full bg-gray-900 rounded-full overflow-hidden border border-gray-700 relative">
               <div 
                  className={`h-full transition-all duration-500 ${isDead ? 'bg-kite-danger' : 'bg-kite-neon'}`}
                  style={{ width: `${progress}%` }}
               ></div>
             </div>

             <div className="mt-6 flex flex-col md:flex-row gap-4">
               <Button 
                 onClick={handleHeartbeat} 
                 disabled={isDead}
                 className="flex-1 flex items-center justify-center gap-2"
               >
                 <Heart size={16} className={!isDead ? "animate-pulse" : ""} />
                 {t('dashboard.stillBreathing')}
               </Button>
               
               {/* Simulation Controls */}
               <div className="flex border border-gray-700 rounded bg-black/30">
                 <button onClick={() => advanceTime(30)} disabled={isDead} className="px-3 hover:bg-white/10 text-xs text-gray-400 border-r border-gray-700" title="Skip 30 Days">+30d</button>
                 <button onClick={() => advanceTime(180)} disabled={isDead} className="px-3 hover:bg-white/10 text-xs text-gray-400 hover:text-kite-danger" title="Trigger Death">{t('dashboard.triggerDeath')}</button>
               </div>
             </div>
          </Card>

          {/* 延迟转账 MVP: 倒计时卡片 */}
          {pendingWill && pendingWill.status === 'pending' && (
            <CountdownTimer
              remainingSeconds={remainingSeconds}
              progress={countdownProgress}
              status={pendingWill.status}
              onTriggerNow={triggerNow}
              onCancel={cancelWill}
            />
          )}

          {/* 封存遗嘱按钮 - 仅在有受益人且未封存时显示 */}
          {!pendingWill && data.beneficiaries.length > 0 && kiteAgent && (
            <div className="bg-gradient-to-br from-purple-900/30 to-kite-900 border border-purple-500/30 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Lock size={20} className="text-purple-400" />
                <div>
                  <h3 className="text-lg font-bold text-white">{t('countdown.sealed')}</h3>
                  <p className="text-xs text-gray-500">Lock your will and start the 30-second countdown (simulates 180 days)</p>
                </div>
              </div>
              <Button 
                variant="purple" 
                onClick={handleSealWill}
                className="w-full flex items-center justify-center gap-2"
              >
                <Lock size={16} />
                Seal My Will
              </Button>
            </div>
          )}

          <Card 
            title={t('dashboard.connectedVaults')} 
            icon={<WalletIcon size={16} />} 
            action={
               <button onClick={handleLinkNewWallet} disabled={isWalletConnecting} className="text-xs text-kite-neon hover:underline flex items-center gap-1">
                 {isWalletConnecting ? <RefreshCw className="animate-spin" size={10}/> : <Plus size={12}/>} {t('dashboard.link')}
               </button>
            }
          >
             <div className="grid grid-cols-2 gap-4">
                {data.wallets.map((w) => (
                  <div key={w.id} className="bg-black/30 p-3 rounded border border-gray-800 flex flex-col">
                     <span className="text-xs font-bold text-gray-300">{w.label}</span>
                     <span className="text-[10px] text-gray-600 mb-2">{w.address}</span>
                     <div className="mt-auto flex gap-1 flex-wrap">
                        {w.tokens.map(t => (
                          <span key={t.symbol} className="text-[9px] bg-white/5 px-1 rounded text-gray-500">{t.amount.toFixed(1)} {t.symbol}</span>
                        ))}
                     </div>
                  </div>
                ))}
             </div>
          </Card>

          <div className="flex justify-end">
            <Button variant="purple" onClick={() => setIsSimulatorOpen(true)} className="flex items-center gap-2">
               <Zap size={16} /> {t('dashboard.simulatorBtn')}
            </Button>
          </div>

          <Card title={t('dashboard.theWill')} icon={<Shield size={16}/>}>
             <div className="space-y-3">
               {data.beneficiaries.map((b, idx) => (
                 <div key={idx} className="p-3 bg-black/40 rounded border border-gray-800">
                    <div className="flex items-center justify-between mb-2">
                       <div className="flex flex-col">
                          <span className="font-bold text-gray-200">{b.name}</span>
                          <span className="text-xs text-gray-500 font-mono">{b.category} • {b.reason.substring(0, 40)}...</span>
                       </div>
                       <div className="text-kite-neon font-mono font-bold">
                          {b.percentage}%
                       </div>
                    </div>
                    {/* 显示受益人地址 */}
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-800">
                       <span className="text-[10px] text-gray-600">地址:</span>
                       <span className="text-xs text-gray-400 font-mono bg-black/30 px-2 py-0.5 rounded">
                         {shortenAddress(b.walletAddress)}
                       </span>
                       {isValidAddress(b.walletAddress) && (
                         <a
                           href={getAddressExplorerUrl(b.walletAddress)}
                           target="_blank"
                           rel="noopener noreferrer"
                           className="text-cyan-500 hover:text-cyan-300 transition-colors"
                         >
                           <ExternalLink size={10} />
                         </a>
                       )}
                    </div>
                 </div>
               ))}
             </div>
          </Card>
        </div>

        {/* Right Column: Logs + Transaction History */}
        <div className="space-y-6">
          <TerminalLog logs={logs} />
          
          {/* 交易历史 */}
          {transactionHistory.length > 0 && (
            <Card title="链上交易历史" icon={<Coins size={16} />}>
              <TransactionHistory transactions={transactionHistory} />
            </Card>
          )}
          
          <div className="p-4 rounded border border-gray-800 bg-kite-900/50 text-xs text-gray-500 font-mono leading-relaxed">
            <h4 className="text-gray-400 font-bold mb-2 uppercase">{t('dashboard.systemArch')}</h4>
            <p className="mb-2">{t('dashboard.arch1')}</p>
            <p className="mb-2">{t('dashboard.arch2')}</p>
            <p>{t('dashboard.arch3')}</p>
          </div>
        </div>
      </div>

      <Simulator 
        isOpen={isSimulatorOpen} 
        onClose={() => setIsSimulatorOpen(false)} 
        originalManifesto={data.manifesto}
        initialHandle={data.userProfile?.handle} 
        onSimulateComplete={handleSimulationComplete}
      />

      {/* 执行预览弹窗 */}
      <ExecutePreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => {
          setIsPreviewModalOpen(false);
          // 如果取消，恢复到 MONITORING 状态
          if (status === AppStatus.ACTIVATED) {
            setStatus(AppStatus.MONITORING);
          }
        }}
        onConfirm={executeDistribution}
        plan={distributionPlan}
        isLoading={isDistributing}
        balance={realBalance}
      />

      {/* 成功弹窗 */}
      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        transactions={completedTransactions}
        totalAmount={distributionPlan?.totalAmount || "0"}
      />

      {/* Kite Chain 徽章 */}
      <KiteBadge />
    </Layout>
  );
};

export default App;