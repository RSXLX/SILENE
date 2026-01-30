
export enum AppStatus {
  IDLE = 'IDLE', // Not connected
  ONBOARDING = 'ONBOARDING', // Setting up will
  MONITORING = 'MONITORING', // Active, waiting for user heartbeat
  ACTIVATED = 'ACTIVATED', // Dead man switch triggered
  EXECUTED = 'EXECUTED', // Assets distributed
}

export interface Beneficiary {
  name: string;
  category: string; // e.g., "Charity", "Family", "Developer"
  percentage: number;
  walletAddress: string; // Mock address
  reason: string;
}

export interface Token {
  symbol: string;
  amount: number;
  price: number; // USD Price
}

export interface Wallet {
  id: string;
  address: string;
  label: string; // e.g., "Main Vault", "Hot Wallet"
  tokens: Token[];
}

export interface UserProfile {
  id: string;
  handle: string; // @username or 0xAddress
  platform: 'twitter' | 'google' | 'wallet';
  avatarUrl?: string;
}

export interface SentinelAnalysis {
  status: 'SECURE' | 'THREAT_DETECTED';
  evidence?: string; // The tweet text
  timestamp: number;
}

export interface SarcophagusState {
  userProfile: UserProfile | null;
  wallets: Wallet[]; // Multiple linked wallets
  lastActiveTimestamp: number;
  timeThresholdDays: number; // e.g., 180 days
  manifesto: string; // Natural language will
  sentinel?: SentinelAnalysis; // Real-time threat data
  beneficiaries: Beneficiary[]; // Parsed intent
  status: AppStatus;
}

export interface TransactionLog {
  id: string;
  timestamp: number;
  type: 'HEARTBEAT' | 'DEPOSIT' | 'DISTRIBUTION' | 'ALERT' | 'SIMULATION' | 'SENTINEL' | 'WALLET_LINK' | 'AI_THINKING' | 'CHAIN_TX';
  details: string;
  hash: string;
}

export interface SimulationResult {
  narrative: string;
  detectedLastWords: string;
  sentimentShift: 'CONSISTENT' | 'CONFLICT_DETECTED' | 'UNCERTAIN' | 'ADAPTIVE_REBALANCING';
  adjustedBeneficiaries: Beneficiary[];
}

// ==================== Kite AI Types ====================

/**
 * Kite 测试网配置
 */
export interface KiteConfig {
  network: string;
  rpc: string;
  bundler: string;
  settlementToken: string;
  chainId: number;
}

/**
 * 支付额度规则
 */
export interface SpendingRules {
  dailyLimit: string;
  perTxLimit: string;
  tokenAddress: string;
  validUntil: number;
}

/**
 * 支付结果
 */
export interface PaymentResult {
  success: boolean;
  txHash?: string;
  error?: string;
  explorerUrl?: string;
}

/**
 * Kite Agent 信息
 */
export interface KiteAgent {
  aaAddress: string;       // AA Wallet 地址
  ownerAddress: string;    // EOA 所有者地址
  createdAt: number;       // 创建时间戳
}

// ==================== 产品体验优化类型 ====================

/**
 * 交易记录 (localStorage 存储)
 */
export interface TransactionRecord {
  txHash: string;
  from: string;
  to: string;
  amount: string;          // wei 字符串
  timestamp: number;
  status: 'pending' | 'success' | 'failed';
  beneficiaryName?: string;
}

/**
 * 单个受益人分配详情
 */
export interface DistributionItem {
  beneficiary: Beneficiary;
  amount: string;          // wei 字符串
  amountFormatted: string; // 格式化金额 (如 "3.5")
}

/**
 * 分配计划
 */
export interface DistributionPlan {
  totalAmount: string;     // 总分配金额 (wei)
  gasReserve: string;      // Gas 预留金额 (wei)
  distributions: DistributionItem[];
  isValid: boolean;        // 余额是否足够
  errorMessage?: string;   // 错误信息
}

/**
 * 网络连接状态
 */
export interface NetworkStatus {
  chainId: number;
  chainName: string;
  isConnected: boolean;
  isCorrectNetwork: boolean;
  blockNumber?: number;
}

// ==================== 延迟转账 MVP 类型 ====================

/**
 * 待执行遗嘱状态
 */
export type PendingWillStatus = 'pending' | 'executing' | 'completed' | 'cancelled';

export interface PendingWill {
  id: string;                    // 唯一 ID
  createdAt: number;             // 创建时间戳
  triggerAt: number;             // 触发时间戳 (createdAt + delay)
  status: PendingWillStatus;
  beneficiaries: Beneficiary[];  // 受益人列表
  manifesto: string;             // 遗嘱原文
  balance: string;               // 创建时的余额快照
}

/**
 * 执行日志
 */
export type ExecutionAction = 'SEALED' | 'TRIGGERED' | 'TX_SENT' | 'COMPLETED' | 'FAILED';

export interface ExecutionLog {
  willId: string;
  timestamp: number;
  action: ExecutionAction;
  details: string;
  txHash?: string;
}
