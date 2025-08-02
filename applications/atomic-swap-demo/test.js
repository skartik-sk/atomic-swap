#!/usr/bin/env node

/**
 * Atomic Swap Demo Test - Verify functionality
 */

import AtomicSwapDemo from './index.js'
import chalk from 'chalk'

#!/usr/bin/env node

/**
 * Atomic Swap Demo Test - Verify functionality
 */

import AtomicSwapDemo from './index.js'
import chalk from 'chalk'

console.log(chalk.blue.bold('🧪 Testing Atomic Swap Demo Functionality
'))

const demo = new AtomicSwapDemo()

const demo = new AtomicSwapDemo()

try {
  // Test initialization
  console.log(chalk.yellow('Testing initialization...'))
  await demo.initialize()
  console.log(chalk.green('✅ Initialization successful\n'))

  // Test individual methods
  console.log(chalk.yellow('Testing vault creation...'))
  await demo.demonstrateEthereumVaultCreation()
  console.log(chalk.green('✅ Ethereum vault demo successful\n'))

  console.log(chalk.yellow('Testing Sui vault creation...'))
  await demo.demonstrateSuiVaultCreation()
  console.log(chalk.green('✅ Sui vault demo successful\n'))

  console.log(chalk.yellow('Testing bilateral swap...'))
  await demo.demonstrateBilateralAtomicSwap()
  console.log(chalk.green('✅ Bilateral swap demo successful\n'))

  console.log(chalk.yellow('Testing cross-chain verification...'))
  await demo.demonstrateCrossChainVerification()
  console.log(chalk.green('✅ Cross-chain verification demo successful\n'))

  console.log(chalk.yellow('Testing protocol statistics...'))
  await demo.displayProtocolStatistics()
  console.log(chalk.green('✅ Protocol statistics demo successful\n'))

  console.log(chalk.green.bold('🎉 All tests passed! Demo is working perfectly.\n'))

} catch (error) {
  console.error(chalk.red('❌ Test failed:'), error.message)
  process.exit(1)
}
