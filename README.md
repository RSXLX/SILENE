<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Sileme (死了么) - AI Digital Legacy Protocol

> 基于 Kite AI Chain 的数字遗产智能分配协议

## 项目简介

Sileme 是一个 **Dead Man's Switch (死人开关)** 应用，结合 AI 遗嘱解析和链上自动执行能力：

- 🤖 **AI 遗嘱解析**: 使用 Gemini AI 将自然语言遗嘱转换为可执行的受益人分配
- ⛓️ **链上支付**: 基于 Kite Chain 测试网执行真实稳定币转账
- 🔐 **Agent 身份**: 使用 Account Abstraction (AA) 钱包作为 AI Agent 身份
- ⏰ **自动触发**: 用户超过设定天数未活动时自动执行资产分配

---

## Kite AI 集成

本项目使用 **Kite Chain Testnet** 实现 AI Agent 链上支付能力。

### 核心功能

| 功能           | 实现方式                              |
| -------------- | ------------------------------------- |
| **Agent 身份** | 使用 `gokite-aa-sdk` 创建 AA Wallet   |
| **链上支付**   | 触发 Dead Man Switch 后执行稳定币转账 |
| **权限控制**   | 通过 Spending Rules 限制支付额度      |

### 测试网配置

| 配置项         | 值                              |
| -------------- | ------------------------------- |
| Chain Name     | KiteAI Testnet                  |
| Chain ID       | `2368`                          |
| RPC URL        | `https://rpc-testnet.gokite.ai` |
| Block Explorer | https://testnet.kitescan.ai     |
| Faucet         | https://faucet.gokite.ai        |

---

## 快速开始

### 前置条件

- Node.js 18+
- MetaMask 或兼容钱包
- Kite 测试网代币 (从 Faucet 获取)

### 安装依赖

```bash
npm install
```

### 环境配置

编辑 `.env.local` 文件：

```env
# Gemini API (用于 AI 遗嘱解析)
GEMINI_API_KEY=your-gemini-api-key

# Kite Testnet (已预配置)
VITE_KITE_RPC=https://rpc-testnet.gokite.ai
VITE_KITE_BUNDLER=https://bundler-service.staging.gokite.ai/rpc/
VITE_KITE_CHAIN_ID=2368
VITE_SETTLEMENT_TOKEN=0x0fF5393387ad2f9f691FD6Fd28e07E3969e27e63
```

### 获取测试代币

1. 访问 https://faucet.gokite.ai
2. 输入你的钱包地址
3. 领取 KITE 测试代币

### 运行应用

```bash
npm run dev
```

访问 http://localhost:5173

---

## 使用流程

1. **连接钱包**: 点击 "Connect Wallet" 使用 MetaMask 连接
2. **创建 Agent**: 系统自动创建 Kite AA Wallet 作为 Agent 身份
3. **编写遗嘱**: 用自然语言描述你的资产分配意愿
4. **AI 解析**: Gemini AI 将遗嘱解析为受益人列表
5. **激活监控**: 系统开始监控用户活动
6. **触发分配**: 用户超时未活动后自动执行链上转账

---

## 技术栈

| 层级   | 技术                  |
| ------ | --------------------- |
| 前端   | React 19 + TypeScript |
| 构建   | Vite 6                |
| AI     | Google Gemini API     |
| 区块链 | Kite Chain (EVM)      |
| AA SDK | gokite-aa-sdk         |

---

## 项目结构

```
sileme/
├── App.tsx              # 主应用
├── services/
│   ├── geminiService.ts # AI 遗嘱解析
│   └── kiteService.ts   # Kite 链上服务
├── components/          # UI 组件
├── types.ts             # 类型定义
└── docs/                # 项目文档
```

---

## 验证链上交易

触发 Dead Man Switch 后，可在区块浏览器查看交易：

https://testnet.kitescan.ai

---

## License

MIT
