import { getDefaultWallets } from '@rainbow-me/rainbowkit'
import { configureChains, createConfig } from 'wagmi'
import { mainnet, sepolia, goerli } from 'wagmi/chains'
import { publicProvider } from 'wagmi/providers/public'
import { infuraProvider } from 'wagmi/providers/infura'

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [mainnet, sepolia, goerli],
  [
    infuraProvider({ 
      apiKey: import.meta.env.VITE_INFURA_API_KEY || 'demo' 
    }),
    publicProvider(),
  ]
)

const { connectors } = getDefaultWallets({
  appName: 'Atomic Swap Protocol',
  projectId: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || 'atomic-swap-demo',
  chains,
})

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
})

export { wagmiConfig, chains }
