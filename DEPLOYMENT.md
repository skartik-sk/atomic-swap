# Deployment Guide

## Quick Deployment Commands

### 1. Ethereum Contracts Deployment

```bash
cd protocols/ethereum_side

# Deploy AtomicVault
forge create --rpc-url $ETHEREUM_RPC_URL \
  --private-key $ETHEREUM_PRIVATE_KEY \
  contracts/core/AtomicVault.sol:AtomicVault \
  --constructor-args $WRAPPED_ETHER_ADDRESS

# Deploy InterchainOrderBook  
forge create --rpc-url $ETHEREUM_RPC_URL \
  --private-key $ETHEREUM_PRIVATE_KEY \
  contracts/core/InterchainOrderBook.sol:InterchainOrderBook

# Deploy PriceDiscoveryEngine
forge create --rpc-url $ETHEREUM_RPC_URL \
  --private-key $ETHEREUM_PRIVATE_KEY \
  contracts/core/PriceDiscoveryEngine.sol:PriceDiscoveryEngine

# Deploy ValidatorNetwork
forge create --rpc-url $ETHEREUM_RPC_URL \
  --private-key $ETHEREUM_PRIVATE_KEY \
  contracts/core/ValidatorNetwork.sol:ValidatorNetwork
```

### 2. Sui Package Deployment

```bash
cd protocols/sui_side

# Build and deploy
sui client publish --gas-budget 100000000

# Alternative with specific keypair
sui client publish --gas-budget 100000000 --keypair-path ~/.sui/sui_config/sui.keystore
```

### 3. Toolkit Setup

```bash
cd toolkit

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your contract addresses
nano .env

# Run verification
npm run verify-bilateral-swap
```

## Environment Configuration

Update your `.env` file with deployed contract addresses:

```env
# Update these after deployment
ATOMIC_VAULT_ADDRESS=0x... # From step 1
INTERCHAIN_ORDER_BOOK_ADDRESS=0x... # From step 1  
SUI_PACKAGE_ID=0x... # From step 2
```
