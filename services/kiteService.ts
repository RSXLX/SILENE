/**
 * Kite AI Chain Service
 * 直接使用 ethers.js 与 Kite Chain 交互 (绕过有浏览器兼容问题的 SDK)
 */

import { BrowserProvider, Signer, Contract, ethers } from "ethers";
import type { 
  KiteConfig, 
  PaymentResult, 
  TransactionRecord, 
  DistributionPlan, 
  DistributionItem,
  NetworkStatus, 
  Beneficiary 
} from "../types";

// Kite 测试网常量配置
const DEFAULT_KITE_RPC = "https://rpc-testnet.gokite.ai";
const DEFAULT_CHAIN_ID = 2368;
const DEFAULT_SETTLEMENT_TOKEN = "0x0fF5393387ad2f9f691FD6Fd28e07E3969e27e63";

// Kite 测试网配置
export const KITE_CONFIG: KiteConfig = {
  network: "kite_testnet",
  rpc: DEFAULT_KITE_RPC,
  bundler: "https://bundler-service.staging.gokite.ai/rpc/",
  settlementToken: DEFAULT_SETTLEMENT_TOKEN,
  chainId: DEFAULT_CHAIN_ID,
};

// 区块浏览器 URL
export const EXPLORER_URL = "https://testnet.kitescan.ai";

// SimpleAccount Factory 地址 (Kite Testnet)
const SIMPLE_ACCOUNT_FACTORY = "0x9406Cc6185a346906296840746125a0E44976454";

// ERC20 ABI (仅需要 transfer 和 balanceOf)
const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
];

// Provider 缓存
let cachedProvider: BrowserProvider | null = null;

/**
 * 初始化 Kite SDK (简化版，仅记录日志)
 */
export const initKiteSDK = (): void => {
  console.log("Kite Service initialized with config:", KITE_CONFIG);
};

/**
 * 获取浏览器钱包 Provider 和 Signer
 */
export const getWalletSigner = async (): Promise<{
  provider: BrowserProvider;
  signer: Signer;
  address: string;
}> => {
  // 检查 MetaMask 是否安装
  if (typeof window === "undefined" || !(window as any).ethereum) {
    throw new Error("WALLET_NOT_FOUND");
  }

  const ethereum = (window as any).ethereum;
  
  // 请求切换到 Kite Testnet
  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: `0x${KITE_CONFIG.chainId.toString(16)}` }],
    });
  } catch (switchError: any) {
    // 如果链不存在，添加它
    if (switchError.code === 4902) {
      await ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: `0x${KITE_CONFIG.chainId.toString(16)}`,
            chainName: "KiteAI Testnet",
            nativeCurrency: {
              name: "KITE",
              symbol: "KITE",
              decimals: 18,
            },
            rpcUrls: [KITE_CONFIG.rpc],
            blockExplorerUrls: [EXPLORER_URL],
          },
        ],
      });
    } else if (switchError.code !== 4001) {
      // 4001 是用户拒绝，其他错误继续抛出
      console.warn("Failed to switch network:", switchError);
    }
  }

  const provider = new BrowserProvider(ethereum);
  cachedProvider = provider;

  // 请求连接钱包
  await provider.send("eth_requestAccounts", []);

  const signer = await provider.getSigner();
  const address = await signer.getAddress();

  return { provider, signer, address };
};

/**
 * 计算 SimpleAccount AA 钱包地址
 * 使用 CREATE2 预测地址
 * @param owner EOA 所有者地址
 * @param salt 盐值
 */
export const calculateAAAddress = (owner: string, salt: bigint = BigInt(0)): string => {
  // 简化实现：直接返回 owner 地址作为 "Agent ID"
  // 完整实现需要调用 Factory 合约的 getAddress 方法
  // 由于 SDK 有兼容性问题，MVP 阶段使用 EOA 地址作为 Agent 身份
  return owner;
};

/**
 * 获取或创建 AA Wallet 地址 (Agent 身份)
 * @param signer 用户签名器
 * @returns AA Wallet 地址 (MVP: 使用 EOA 地址)
 */
export const getAAWalletAddress = async (signer: Signer): Promise<string> => {
  try {
    // 获取 EOA 地址作为 Agent 身份
    const ownerAddress = await signer.getAddress();
    
    // MVP: 直接使用 EOA 地址
    // 完整版可以调用 SimpleAccountFactory 计算真正的 AA 地址
    return ownerAddress;
  } catch (error) {
    console.error("Failed to get AA Wallet address:", error);
    throw error;
  }
};

/**
 * 发送原生代币 (KITE) 转账
 * @param to 接收地址
 * @param amount 金额 (wei 单位)
 * @param signer 用户签名器
 * @returns 支付结果
 */
export const sendPayment = async (
  to: string,
  amount: string,
  signer: Signer
): Promise<PaymentResult> => {
  try {
    console.log(`Sending ${amount} wei to ${to}`);
    
    // 发送普通交易 (非 AA UserOperation, MVP 简化版)
    const tx = await signer.sendTransaction({
      to: to,
      value: BigInt(amount),
    });

    console.log("Transaction sent:", tx.hash);
    
    // 等待交易确认
    const receipt = await tx.wait();
    
    return {
      success: true,
      txHash: tx.hash,
      explorerUrl: `${EXPLORER_URL}/tx/${tx.hash}`,
    };
  } catch (error: any) {
    console.error("Payment failed:", error);
    return {
      success: false,
      error: error.message || "Payment failed",
    };
  }
};

/**
 * 发送 ERC20 代币转账
 * @param tokenAddress 代币合约地址
 * @param to 接收地址
 * @param amount 金额 (最小单位)
 * @param signer 用户签名器
 * @returns 支付结果
 */
export const sendTokenPayment = async (
  tokenAddress: string,
  to: string,
  amount: string,
  signer: Signer
): Promise<PaymentResult> => {
  try {
    const tokenContract = new Contract(tokenAddress, ERC20_ABI, signer);
    
    console.log(`Sending ${amount} tokens to ${to}`);
    
    const tx = await tokenContract.transfer(to, BigInt(amount));
    console.log("Token transfer sent:", tx.hash);
    
    const receipt = await tx.wait();
    
    return {
      success: true,
      txHash: tx.hash,
      explorerUrl: `${EXPLORER_URL}/tx/${tx.hash}`,
    };
  } catch (error: any) {
    console.error("Token payment failed:", error);
    return {
      success: false,
      error: error.message || "Token payment failed",
    };
  }
};

/**
 * 获取代币余额
 */
export const getTokenBalance = async (
  tokenAddress: string,
  walletAddress: string,
  provider: BrowserProvider
): Promise<string> => {
  try {
    const tokenContract = new Contract(tokenAddress, ERC20_ABI, provider);
    const balance = await tokenContract.balanceOf(walletAddress);
    return balance.toString();
  } catch (error) {
    console.error("Failed to get token balance:", error);
    return "0";
  }
};

/**
 * 获取原生代币余额
 */
export const getNativeBalance = async (
  walletAddress: string,
  provider: BrowserProvider
): Promise<string> => {
  try {
    const balance = await provider.getBalance(walletAddress);
    return balance.toString();
  } catch (error) {
    console.error("Failed to get native balance:", error);
    return "0";
  }
};

/**
 * 获取交易 Explorer 链接
 */
export const getExplorerUrl = (txHash: string): string => {
  return `${EXPLORER_URL}/tx/${txHash}`;
};

/**
 * 获取地址 Explorer 链接
 */
export const getAddressExplorerUrl = (address: string): string => {
  return `${EXPLORER_URL}/address/${address}`;
};

// ==================== 产品体验优化函数 ====================

const TRANSACTIONS_STORAGE_KEY = "sileme_transactions";
const MAX_TRANSACTIONS = 50;

/**
 * 格式化 wei 余额为可读字符串
 * @param weiBalance wei 字符串
 * @param decimals 小数位数，默认 4
 */
export const formatBalance = (weiBalance: string, decimals: number = 4): string => {
  try {
    const balanceBigInt = BigInt(weiBalance);
    const divisor = BigInt(10 ** 18);
    const integerPart = balanceBigInt / divisor;
    const remainder = balanceBigInt % divisor;
    
    // 计算小数部分
    const decimalStr = remainder.toString().padStart(18, '0').slice(0, decimals);
    
    return `${integerPart}.${decimalStr}`;
  } catch (error) {
    console.error("Failed to format balance:", error);
    return "0.0000";
  }
};

/**
 * 保存交易记录到 localStorage
 */
export const saveTransaction = (tx: TransactionRecord): void => {
  try {
    const existing = getTransactions();
    const updated = [tx, ...existing].slice(0, MAX_TRANSACTIONS);
    localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Failed to save transaction:", error);
  }
};

/**
 * 获取存储的交易历史
 */
export const getTransactions = (): TransactionRecord[] => {
  try {
    const stored = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as TransactionRecord[];
  } catch (error) {
    console.error("Failed to get transactions:", error);
    return [];
  }
};

/**
 * 计算遗产分配方案
 * @param balance 可用余额 (wei)
 * @param beneficiaries 受益人列表
 * @param gasReservePercent Gas 预留百分比，默认 5%
 */
export const calculateDistribution = (
  balance: string,
  beneficiaries: Beneficiary[],
  gasReservePercent: number = 5
): DistributionPlan => {
  try {
    const balanceBigInt = BigInt(balance);
    
    // 检查余额是否为 0
    if (balanceBigInt === BigInt(0)) {
      return {
        totalAmount: "0",
        gasReserve: "0",
        distributions: [],
        isValid: false,
        errorMessage: "余额不足，请先获取测试代币",
      };
    }
    
    // 计算 Gas 预留
    const gasReserve = (balanceBigInt * BigInt(gasReservePercent)) / BigInt(100);
    const distributableAmount = balanceBigInt - gasReserve;
    
    // 计算每个受益人的分配金额
    const distributions: DistributionItem[] = beneficiaries.map(beneficiary => {
      const amount = (distributableAmount * BigInt(beneficiary.percentage)) / BigInt(100);
      return {
        beneficiary,
        amount: amount.toString(),
        amountFormatted: formatBalance(amount.toString()),
      };
    });
    
    // 计算总分配金额
    const totalAmount = distributions.reduce(
      (sum, d) => sum + BigInt(d.amount),
      BigInt(0)
    );
    
    return {
      totalAmount: totalAmount.toString(),
      gasReserve: gasReserve.toString(),
      distributions,
      isValid: true,
    };
  } catch (error: any) {
    console.error("Failed to calculate distribution:", error);
    return {
      totalAmount: "0",
      gasReserve: "0",
      distributions: [],
      isValid: false,
      errorMessage: error.message || "计算分配方案失败",
    };
  }
};

/**
 * 获取网络连接状态
 */
export const getNetworkStatus = async (
  provider: BrowserProvider | null
): Promise<NetworkStatus> => {
  if (!provider) {
    return {
      chainId: 0,
      chainName: "Unknown",
      isConnected: false,
      isCorrectNetwork: false,
    };
  }
  
  try {
    const network = await provider.getNetwork();
    const chainId = Number(network.chainId);
    const blockNumber = await provider.getBlockNumber();
    
    const isCorrectNetwork = chainId === KITE_CONFIG.chainId;
    const chainName = isCorrectNetwork ? "Kite Testnet" : `Chain ${chainId}`;
    
    return {
      chainId,
      chainName,
      isConnected: true,
      isCorrectNetwork,
      blockNumber,
    };
  } catch (error) {
    console.error("Failed to get network status:", error);
    return {
      chainId: 0,
      chainName: "Unknown",
      isConnected: false,
      isCorrectNetwork: false,
    };
  }
};

/**
 * 检查地址格式是否有效
 */
export const isValidAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

/**
 * 缩短地址显示
 */
export const shortenAddress = (address: string, chars: number = 4): string => {
  if (!address) return "";
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
};
