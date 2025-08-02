/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_INFURA_API_KEY: string
  readonly VITE_WALLET_CONNECT_PROJECT_ID: string
  readonly VITE_SUI_RPC_URL: string
  readonly VITE_ETHEREUM_RPC_URL: string
  readonly VITE_ATOMIC_VAULT_ADDRESS: string
  readonly VITE_INTERCHAIN_ORDER_BOOK_ADDRESS: string
  readonly VITE_SUI_PACKAGE_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
