# Atomic Swap Protocol - Applications

This directory contains complete application implementations showcasing the Atomic Swap Protocol.

## 🌐 Applications Overview

### 1. Atomic Swap DApp (`atomic-swap-dapp/`)
A comprehensive React-based decentralized application for cross-chain atomic swaps.

### 2. Atomic Swap Demo (`atomic-swap-demo/`)
An interactive Node.js demonstration showcasing the protocol capabilities.

**Atomic Swap DApp Features:**
- 🔐 **Atomic Vault Creation**: Create secure vaults with cryptographic commitments
- 🌉 **Bilateral Swap Interface**: Execute cross-chain atomic swaps between Ethereum and Sui
- 📊 **Vault Dashboard**: Monitor and manage active vaults and swap history
- ⚡ **Real-time Progress Tracking**: Live swap status and progress visualization
- 🔗 **Multi-Chain Connectivity**: Integrated Ethereum (via RainbowKit) and Sui wallet connections

**Atomic Swap Demo Features:**
- 🎪 **Interactive CLI**: Menu-driven demonstration of protocol capabilities
- 🔐 **Vault Creation Demo**: Experience both Ethereum and Sui vault establishment
- ⚡ **Bilateral Swap Simulation**: Complete atomic swap execution walkthrough
- 🔍 **Cross-Chain Verification**: Real-time state consistency checking
- 📊 **Protocol Statistics**: Transformation metrics and performance data

**Technology Stack:**

**DApp (React Application):**
- React 18 with TypeScript
- Vite for fast development and building
- Tailwind CSS for styling
- Framer Motion for animations
- Zustand for state management
- ethers.js for Ethereum integration
- @mysten/sui.js for Sui integration
- RainbowKit for wallet connections

**Demo (Node.js CLI):**
- Node.js 18+ with ES modules
- ethers.js for Ethereum simulation
- @mysten/sui.js for Sui integration
- chalk for colorful console output
- inquirer for interactive menus
- ora for progress indicators

## 🚀 Quick Start

### Prerequisites
```bash
node --version  # v18.0.0+
npm --version   # v8.0.0+
```

### Installation & Setup

#### Option 1: Atomic Swap DApp (React Web Application)

1. **Navigate to the DApp directory**
   ```bash
   cd applications/atomic-swap-dapp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:3000
   ```

#### Option 2: Atomic Swap Demo (Interactive CLI)

1. **Navigate to the demo directory**
   ```bash
   cd applications/atomic-swap-demo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run interactive demonstration**
   ```bash
   npm start
   ```

## 📁 Application Structure

```
atomic-swap-dapp/
├── src/
│   ├── components/           # React components
│   │   ├── AtomicSwapApp.tsx        # Main application
│   │   ├── AtomicVaultCreator.tsx   # Vault creation interface
│   │   ├── BilateralSwapInterface.tsx # Swap execution interface
│   │   ├── VaultDashboard.tsx       # Management dashboard
│   │   └── SwapProgressTracker.tsx  # Progress visualization
│   ├── stores/              # State management
│   │   └── AtomicSwapStore.tsx      # Zustand store
│   ├── config/              # Configuration
│   │   └── wagmi.ts         # Ethereum wallet configuration
│   ├── hooks/               # Custom React hooks
│   ├── utils/               # Utility functions
│   └── types/               # TypeScript type definitions
├── public/                  # Static assets
├── package.json            # Dependencies and scripts
├── vite.config.ts          # Vite configuration
├── tailwind.config.js      # Tailwind CSS configuration
└── README.md               # Application documentation
```

## 🎯 Key Features

### Atomic Vault Creation
- **Multi-Asset Support**: ETH, ERC-20 tokens, SUI, and Sui objects
- **Cryptographic Security**: Advanced hash-based commitment schemes
- **Temporal Controls**: Configurable expiration timestamps
- **Gas Optimization**: Efficient contract interactions

### Bilateral Swap Execution
- **Cross-Chain Coordination**: Synchronized vault creation across networks
- **Atomic Settlement**: Guaranteed atomic execution or reversion
- **Progress Tracking**: Real-time swap status updates
- **Error Handling**: Comprehensive error recovery mechanisms

### Vault Management
- **Active Vault Monitoring**: Real-time vault status tracking
- **Historical Records**: Complete swap history and analytics
- **Emergency Controls**: Vault cancellation and asset recovery
- **Multi-Wallet Support**: Seamless wallet switching and management

## 🔧 Configuration

### Environment Variables

Create `.env` file with the following configuration:

```env
# API Keys
VITE_INFURA_API_KEY=your_infura_project_id
VITE_WALLET_CONNECT_PROJECT_ID=your_wallet_connect_id

# Network Endpoints
VITE_ETHEREUM_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
VITE_SUI_RPC_URL=https://fullnode.testnet.sui.io:443

# Contract Addresses (Update after deployment)
VITE_ATOMIC_VAULT_ADDRESS=0x...
VITE_INTERCHAIN_ORDER_BOOK_ADDRESS=0x...
VITE_SUI_PACKAGE_ID=0x...
```

### Build Configuration

The application uses Vite for optimal performance:

- **Development**: Hot module replacement for instant updates
- **Production**: Optimized bundles with code splitting
- **TypeScript**: Full type checking and IntelliSense
- **CSS**: Tailwind CSS with custom Atomic Swap theme

## 🛡️ Security Features

### Client-Side Security
- **Private Key Protection**: Never exposes private keys to the application
- **Secure Storage**: Encrypted local storage for sensitive data
- **Input Validation**: Comprehensive validation for all user inputs
- **XSS Protection**: Sanitized outputs and secure rendering

### Blockchain Security
- **Cryptographic Commitments**: Secure hash-based secret schemes
- **Temporal Validation**: Time-based security controls
- **Multi-Signature Support**: Optional multi-sig vault creation
- **Emergency Recovery**: Fail-safe mechanisms for fund recovery

## 📱 User Interface

### Responsive Design
- **Mobile-First**: Optimized for mobile devices
- **Progressive Enhancement**: Enhanced features for larger screens
- **Accessibility**: WCAG 2.1 compliant interface
- **Dark Mode**: Professional dark theme design

### User Experience
- **Intuitive Workflow**: Step-by-step swap guidance
- **Real-Time Feedback**: Instant status updates and confirmations
- **Error Recovery**: Clear error messages and recovery options
- **Performance**: Optimized for fast loading and smooth interactions

## 🧪 Testing

### Development Testing
```bash
npm run test          # Run unit tests
npm run test:e2e      # Run end-to-end tests
npm run lint          # Code quality checks
npm run type-check    # TypeScript validation
```

### Manual Testing
1. **Wallet Connection**: Test Ethereum and Sui wallet connections
2. **Vault Creation**: Create vaults with various parameters
3. **Swap Execution**: Execute complete bilateral swaps
4. **Error Scenarios**: Test error handling and recovery

## 🚀 Deployment

### Production Build
```bash
npm run build         # Create production build
npm run preview       # Preview production build locally
```

### Deployment Options
- **Vercel**: Optimized for React applications
- **Netlify**: Simple static site deployment
- **AWS S3**: Scalable cloud hosting
- **IPFS**: Decentralized hosting option

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

Licensed under the Apache License 2.0 - see the [LICENSE](../../LICENSE) file for details.

## 🙏 Acknowledgments

- React team for the excellent framework
- Ethereum Foundation for blockchain infrastructure
- Sui Network for innovative Move programming
- Open source community for amazing tools and libraries

---

*Built with ❤️ by the Atomic Swap Protocol Team*
