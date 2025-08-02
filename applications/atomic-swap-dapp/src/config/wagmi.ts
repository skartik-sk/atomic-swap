import { configureChains, createConfig } from 'wagmi'
import { mainnet, sepolia, goerli } from 'wagmi/chains'
import { publicProvider } from 'wagmi/providers/public'
import { infuraProvider } from 'wagmi/providers/infura'
import { 
  injectedWallet,
  metaMaskWallet,
  walletConnectWallet,
  coinbaseWallet,
  rainbowWallet,
} from '@rainbow-me/rainbowkit/wallets'
import { connectorsForWallets } from '@rainbow-me/rainbowkit'

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [mainnet, sepolia, goerli],
  [
    infuraProvider({ 
      apiKey: import.meta.env.VITE_INFURA_API_KEY || 'demo' 
    }),
    publicProvider(),
  ]
)

// Manually configure connectors without Safe wallet to avoid build issues
const connectors = connectorsForWallets([
  {
    groupName: 'Recommended',
    wallets: [
      injectedWallet({ chains }),
      metaMaskWallet({ 
        projectId: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || 'atomic-swap-demo',
        chains 
      }),
      walletConnectWallet({ 
        projectId: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || 'atomic-swap-demo',
        chains 
      }),
      rainbowWallet({ 
        projectId: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || 'atomic-swap-demo',
        chains 
      }),
      coinbaseWallet({ 
        appName: 'Atomic Swap Protocol',
        chains 
      }),
    ],
  },
])

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
})

export { wagmiConfig, chains }
