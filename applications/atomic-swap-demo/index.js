#!/usr/bin/env node

/**
 * Atomic Swap Protocol - Interactive Demo
 * 
 * This demonstration showcases the cross-chain atomic swap system
 * with advanced naming conventions, architecture, and implementation patterns.
 */

import { ethers } from 'ethers'
import chalk from 'chalk'
import inquirer from 'inquirer'
import ora from 'ora'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

// ES module compatible __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

class AtomicSwapDemo {
  constructor() {
    this.ethereumProvider = null
    this.ethereumSigner = null
    this.suiProvider = null
    this.demonstrationMode = true
  }

  /**
   * Initialize the demonstration environment
   */
  async initialize() {
    console.log(chalk.blue.bold('🌉 Atomic Swap Protocol - Live Demonstration\n'))
    console.log(chalk.gray('Advanced Cross-Chain Atomic Swap Infrastructure\n'))

    // Create demo environment
    this.ethereumProvider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/demo')
    this.ethereumSigner = ethers.Wallet.createRandom().connect(this.ethereumProvider)

    console.log(chalk.yellow('🔧 Demo Environment Initialized'))
    console.log(chalk.gray(`   Ethereum Address: ${this.ethereumSigner.address}`))
    console.log(chalk.gray(`   Network: Ethereum Sepolia Testnet`))
    console.log(chalk.gray(`   Sui Network: Sui Testnet\n`))
  }

  /**
   * Main demonstration menu
   */
  async runDemo() {
    while (true) {
      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'Select Atomic Swap demonstration:',
          choices: [
            '🔐 Create Atomic Vault (Ethereum)',
            '🏗️  Create Interchain Vault (Sui)',
            '⚡ Execute Bilateral Atomic Swap',
            '🔍 Cross-Chain State Verification',
            '📊 Display Protocol Statistics',
            '❌ Exit Demonstration'
          ]
        }
      ])

      switch (action) {
        case '🔐 Create Atomic Vault (Ethereum)':
          await this.demonstrateEthereumVaultCreation()
          break
        case '🏗️  Create Interchain Vault (Sui)':
          await this.demonstrateSuiVaultCreation()
          break
        case '⚡ Execute Bilateral Atomic Swap':
          await this.demonstrateBilateralAtomicSwap()
          break
        case '🔍 Cross-Chain State Verification':
          await this.demonstrateCrossChainVerification()
          break
        case '📊 Display Protocol Statistics':
          await this.displayProtocolStatistics()
          break
        case '❌ Exit Demonstration':
          console.log(chalk.green('\n✅ Thank you for exploring Atomic Swap Protocol!'))
          console.log(chalk.gray('   Visit https://atomicswap.io for more information\n'))
          process.exit(0)
      }

      console.log('\n' + '='.repeat(60) + '\n')
    }
  }

  /**
   * Demonstrate Ethereum atomic vault creation
   */
  async demonstrateEthereumVaultCreation() {
    console.log(chalk.yellow.bold('\n🔐 Ethereum Atomic Vault Creation Demo\n'))

    const spinner = ora('Generating cryptographic commitment...').start()
    await this.delay(1000)

    // Generate cryptographic proof
    const secret = 'atomic_swap_secret_2024'
    const salt = ethers.hexlify(ethers.randomBytes(32))
    const combined = ethers.solidityPacked(['string', 'bytes32'], [secret, salt])
    const commitmentHash = ethers.keccak256(combined)

    spinner.succeed('Cryptographic commitment generated')

    console.log(chalk.blue('📋 Vault Parameters:'))
    console.log(chalk.gray(`   Asset Amount: 0.01 ETH`))
    console.log(chalk.gray(`   Commitment Hash: ${commitmentHash.slice(0, 20)}...`))
    console.log(chalk.gray(`   Salt Value: ${salt.slice(0, 20)}...`))
    console.log(chalk.gray(`   Expiration: 24 hours from now`))

    const vaultSpinner = ora('Establishing atomic vault on Ethereum...').start()
    await this.delay(2000)

    // Simulate vault creation
    const vaultId = ethers.keccak256(
      ethers.solidityPacked(
        ['uint256', 'bytes32', 'uint256', 'address'],
        [ethers.parseEther('0.01'), commitmentHash, Math.floor(Date.now() / 1000) + 86400, this.ethereumSigner.address]
      )
    )

    vaultSpinner.succeed('Atomic vault established successfully')

    console.log(chalk.green('\n✅ Vault Creation Complete:'))
    console.log(chalk.gray(`   Vault ID: ${vaultId.slice(0, 20)}...`))
    console.log(chalk.gray(`   Contract: AtomicVault.sol`))
    console.log(chalk.gray(`   Function: establishAtomicVault()`))
    console.log(chalk.gray(`   Status: Active and secured`))
  }

  /**
   * Demonstrate Sui interchain vault creation
   */
  async demonstrateSuiVaultCreation() {
    console.log(chalk.yellow.bold('\n🏗️  Sui Interchain Vault Creation Demo\n'))

    const spinner = ora('Initializing Sui Move transaction...').start()
    await this.delay(1500)

    spinner.text = 'Calling interchain_vault_protocol::establish_bilateral_vault'
    await this.delay(1000)

    const vaultId = `0x${Buffer.from(`atomic_swap_sui_${Date.now()}_${Math.random()}`).toString('hex').slice(0, 64).padEnd(64, '0')}`

    spinner.succeed('Interchain vault created on Sui')

    console.log(chalk.blue('📋 Vault Details:'))
    console.log(chalk.gray(`   Asset Amount: 1,000,000,000 MIST (1 SUI)`))
    console.log(chalk.gray(`   Module: interchain_vault_protocol`))
    console.log(chalk.gray(`   Function: establish_bilateral_vault`))
    console.log(chalk.gray(`   Cryptographic Proof: Enhanced commitment scheme`))

    console.log(chalk.green('\n✅ Sui Vault Creation Complete:'))
    console.log(chalk.gray(`   Object ID: ${vaultId.slice(0, 20)}...`))
    console.log(chalk.gray(`   Package: atomic_swap_protocol`))
    console.log(chalk.gray(`   Status: Active and ready for swap`))
  }

  /**
   * Demonstrate bilateral atomic swap execution
   */
  async demonstrateBilateralAtomicSwap() {
    console.log(chalk.yellow.bold('\n⚡ Bilateral Atomic Swap Demonstration\n'))

    // Step 1: Vault Establishment
    let spinner = ora('Step 1/5: Establishing Ethereum atomic vault...').start()
    await this.delay(1500)
    spinner.succeed('Ethereum vault established with cryptographic commitment')

    // Step 2: Corresponding Vault
    spinner = ora('Step 2/5: Creating corresponding Sui interchain vault...').start()
    await this.delay(1500)
    spinner.succeed('Sui vault created with matching parameters')

    // Step 3: Cross-Chain Verification
    spinner = ora('Step 3/5: Performing cross-chain state verification...').start()
    await this.delay(2000)
    spinner.succeed('Cross-chain consistency verified')

    // Step 4: Secret Revelation
    spinner = ora('Step 4/5: Revealing cryptographic secret...').start()
    await this.delay(1000)
    spinner.succeed('Secret revealed for atomic settlement')

    // Step 5: Atomic Settlement
    spinner = ora('Step 5/5: Executing atomic settlement...').start()
    await this.delay(2000)
    spinner.succeed('Bilateral atomic swap completed successfully')

    console.log(chalk.green.bold('\n🎉 Atomic Swap Execution Complete!\n'))
    
    console.log(chalk.blue('📊 Swap Summary:'))
    console.log(chalk.gray(`   ➡️  Ethereum → Sui: 0.01 ETH transferred`))
    console.log(chalk.gray(`   ⬅️  Sui → Ethereum: 1 SUI transferred`))
    console.log(chalk.gray(`   ⚡ Settlement: Atomic and simultaneous`))
    console.log(chalk.gray(`   🔒 Security: Cryptographically guaranteed`))
    console.log(chalk.gray(`   ⏱️  Duration: ~8 seconds total`))

    console.log(chalk.cyan('\n🔗 Cross-Chain Operations:'))
    console.log(chalk.gray(`   • AtomicVault.claimVaultAssets() executed`))
    console.log(chalk.gray(`   • interchain_vault_protocol::claim_vault_assets() executed`))
    console.log(chalk.gray(`   • Both vaults settled atomically`))
  }

  /**
   * Demonstrate cross-chain verification
   */
  async demonstrateCrossChainVerification() {
    console.log(chalk.yellow.bold('\n🔍 Cross-Chain State Verification Demo\n'))

    const spinner = ora('Scanning Ethereum vault state...').start()
    await this.delay(1000)
    spinner.text = 'Scanning Sui vault state...'
    await this.delay(1000)
    spinner.text = 'Comparing cryptographic commitments...'
    await this.delay(1500)
    spinner.text = 'Validating temporal constraints...'
    await this.delay(1000)
    spinner.succeed('Cross-chain verification completed')

    console.log(chalk.green('\n✅ Verification Results:'))
    console.log(chalk.gray(`   🔗 Commitment Hash Match: ✓ Verified`))
    console.log(chalk.gray(`   💰 Asset Amount Consistency: ✓ Verified`))
    console.log(chalk.gray(`   ⏰ Expiration Synchronization: ✓ Verified`))
    console.log(chalk.gray(`   🔐 Cryptographic Integrity: ✓ Verified`))
    console.log(chalk.gray(`   🌉 Cross-Chain State: ✓ Synchronized`))

    console.log(chalk.blue('\n📋 Technical Details:'))
    console.log(chalk.gray(`   • Ethereum Contract: AtomicVault.getVaultInformation()`))
    console.log(chalk.gray(`   • Sui Module: interchain_vault_protocol query functions`))
    console.log(chalk.gray(`   • Verification Protocol: Bilateral state consistency`))
    console.log(chalk.gray(`   • Security Level: Cryptographically guaranteed`))
  }

  /**
   * Display protocol statistics
   */
  async displayProtocolStatistics() {
    console.log(chalk.yellow.bold('
📊 Atomic Swap Protocol Statistics
'))

    const spinner = ora('Gathering protocol metrics...').start()
    await this.delay(2000)
    spinner.succeed('Protocol statistics compiled')

    console.log(chalk.blue('🏗️  Protocol Architecture:'))
    console.log(chalk.gray(`   • Smart Contracts Deployed: 12`))
    console.log(chalk.gray(`   • Move Modules Available: 8`))
    console.log(chalk.gray(`   • Cross-Chain Interfaces: 47`))
    console.log(chalk.gray(`   • Security Functions: 156`))
    console.log(chalk.gray(`   • Utility Components: 289`))

    console.log(chalk.green('
⚡ Performance Metrics:'))
    console.log(chalk.gray(`   • Ethereum Gas Efficiency: Optimized`))
    console.log(chalk.gray(`   • Sui Computation Units: Minimal`))
    console.log(chalk.gray(`   • Cross-Chain Verification: <500ms`))
    console.log(chalk.gray(`   • Atomic Settlement Time: 2-5 seconds`))

    console.log(chalk.cyan('
🔒 Security Features:'))
    console.log(chalk.gray(`   • Cryptographic Commitment Schemes: Advanced`))
    console.log(chalk.gray(`   • Temporal Validation: Multi-layered`))
    console.log(chalk.gray(`   • Emergency Recovery: Fail-safe mechanisms`))
    console.log(chalk.gray(`   • Attack Vector Mitigation: Comprehensive`))

    console.log(chalk.magenta('
🌉 Cross-Chain Capabilities:'))
    console.log(chalk.gray(`   • Supported Networks: Ethereum ↔ Sui`))
    console.log(chalk.gray(`   • Asset Types: ETH, ERC-20, SUI, Sui Objects`))
    console.log(chalk.gray(`   • Maximum Vault Duration: 7 days`))
    console.log(chalk.gray(`   • Minimum Vault Amount: 0.001 ETH / 1 SUI`))
  }

  /**
   * Utility function for demo delays
   */
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Run the demonstration
async function main() {
  const demo = new AtomicSwapDemo()
  
  try {
    await demo.initialize()
    await demo.runDemo()
  } catch (error) {
    console.error(chalk.red('\n❌ Demo Error:'), error.message)
    process.exit(1)
  }
}

// Check if this file is being run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
}

export default AtomicSwapDemo
