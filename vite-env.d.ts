/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_KITE_RPC: string;
  readonly VITE_KITE_BUNDLER: string;
  readonly VITE_KITE_CHAIN_ID: string;
  readonly VITE_SETTLEMENT_TOKEN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// MetaMask ethereum 对象
interface Window {
  ethereum?: {
    isMetaMask?: boolean;
    request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    on: (event: string, callback: (...args: unknown[]) => void) => void;
    removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
  };
}
