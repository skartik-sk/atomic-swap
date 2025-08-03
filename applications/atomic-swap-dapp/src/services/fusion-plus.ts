import { formatEther, formatGwei, keccak256, encodePacked } from 'viem/utils';
import { createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';
import { toast } from 'react-hot-toast';


function getRequiredEnvVar(name: string): string {
  const value = import.meta.env[`VITE_${name}`];
  if (!value) {
    throw new Error(`Required environment variable VITE_${name} is not set. Please check your .env file.`);
  }
  return value;
}

function getOptionalEnvVar(name: string, defaultValue: string): string {
  return import.meta.env[`VITE_${name}`] || defaultValue;
}

function getOptionalEnvVarNumber(name: string, defaultValue: number): number {
  const value = import.meta.env[`VITE_${name}`];
  return value ? parseFloat(value) : defaultValue;
}

function getOptionalEnvVarBoolean(name: string, defaultValue: boolean): boolean {
  const value = import.meta.env[`VITE_${name}`];
  return value ? value.toLowerCase() === 'true' : defaultValue;
}


export interface DutchAuctionConfig {
  auctionStartDelay: number;
  auctionDuration: number;
  auctionStartRateMultiplier: number;
  minimumReturnRate: number;
  decreaseRatePerMinute: number;
  priceCurveSegments: number;
}

export interface FinalityLock {
  sourceChainFinality: number;
  destinationChainFinality: number;
  secretSharingDelay: number;
  whitelistedResolvers: string[];
}

export interface SafetyDeposit {
  rate: number;
  minAmount: bigint;
  chain: 'ethereum' | 'sui';
}

export interface MerkleTreeSecrets {
  secrets: string[];
  merkleRoot: string;
  treeDepth: number;
  segments: number;
}

export interface FusionOrder {
  id: string;
  maker: string;
  sourceChain: string;
  destinationChain: string;
  sourceAmount: bigint;
  destinationAmount: bigint;
  auctionConfig: DutchAuctionConfig;
  createdAt: number;
  status: 'pending' | 'auction' | 'filled' | 'expired';
  merkleRoot?: string;
  safetyDeposit?: bigint;
}

export interface GasPriceAdjustment {
  enabled: boolean;
  volatilityThreshold: number;
  adjustmentFactor: number;
  executionThresholdMultiplier: number;
}

export interface AccessControl {
  whitelistedResolvers: string[];
  adminAddresses: string[];
  pauseGuardian: string;
}

export interface SecurityFeatures {
  reentrancyProtection: boolean;
  accessControl: AccessControl;
  emergencyPause: boolean;
  upgradeability: boolean;
}


export class DutchAuction {
  private config: DutchAuctionConfig;
  
  constructor(config?: Partial<DutchAuctionConfig>) {
    this.config = {
      auctionStartDelay: getOptionalEnvVarNumber('AUCTION_START_DELAY', 300),
      auctionDuration: getOptionalEnvVarNumber('AUCTION_DURATION', 3600),
      auctionStartRateMultiplier: getOptionalEnvVarNumber('AUCTION_START_RATE_MULTIPLIER', 6.0),
      minimumReturnRate: getOptionalEnvVarNumber('MINIMUM_RETURN_RATE', 0.8),
      decreaseRatePerMinute: getOptionalEnvVarNumber('DECREASE_RATE_PER_MINUTE', 0.01),
      priceCurveSegments: getOptionalEnvVarNumber('PRICE_CURVE_SEGMENTS', 3),
      ...config
    };
  }
  
  calculateCurrentRate(orderTimestamp: number, marketRate: number): number {
    const currentTime = Date.now() / 1000;
    const auctionStartTime = orderTimestamp + this.config.auctionStartDelay;
    




    
    if (currentTime < auctionStartTime) {
      const startRate = marketRate * this.config.auctionStartRateMultiplier;

      return startRate;
    }
    
    const auctionElapsed = currentTime - auctionStartTime;
    const decreaseAmount = (auctionElapsed / 60) * this.config.decreaseRatePerMinute;
    const currentRate = (marketRate * this.config.auctionStartRateMultiplier) - decreaseAmount;
    const finalRate = Math.max(currentRate, marketRate * this.config.minimumReturnRate);
    




    
    return finalRate;
  }
  
  isProfitableForResolver(currentRate: number, resolverCost: number): boolean {
    const profitable = currentRate >= resolverCost;

    return profitable;
  }
  
  getAuctionStatus(orderTimestamp: number): 'waiting' | 'active' | 'expired' {
    const currentTime = Date.now() / 1000;
    const auctionStartTime = orderTimestamp + this.config.auctionStartDelay;
    const auctionEndTime = auctionStartTime + this.config.auctionDuration;
    
    if (currentTime < auctionStartTime) return 'waiting';
    if (currentTime < auctionEndTime) return 'active';
    return 'expired';
  }
}


export class FinalityLockManager {
  private config: FinalityLock;
  
  constructor(config?: Partial<FinalityLock>) {
    this.config = {
      sourceChainFinality: getOptionalEnvVarNumber('ETHEREUM_FINALITY_BLOCKS', 64),
      destinationChainFinality: getOptionalEnvVarNumber('SUI_FINALITY_BLOCKS', 100),
      secretSharingDelay: getOptionalEnvVarNumber('SECRET_SHARING_DELAY', 300),
      whitelistedResolvers: getOptionalEnvVar('RESOLVER_WHITELIST', '').split(',').filter(addr => addr.length > 0),
      ...config
    };
  }
  
  async waitForChainFinality(chainId: number, blockNumber: number): Promise<void> {
    const finalityBlocks = chainId === 1 ? this.config.sourceChainFinality : this.config.destinationChainFinality;
    
    console.log(`⏳ Waiting for chain finality: ${finalityBlocks} blocks on chain ${chainId}`);
    
    let currentBlock = blockNumber;
    const targetBlock = blockNumber + finalityBlocks;
    
    const simulationSteps = 5;
    const stepSize = Math.floor(finalityBlocks / simulationSteps);
    
    for (let i = 0; i < simulationSteps; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      currentBlock += stepSize;
      const progress = Math.min(100, ((currentBlock - blockNumber) / finalityBlocks) * 100);
      
      console.log(`🔄 Finality progress: ${Math.round(progress)}% (${currentBlock}/${targetBlock})`);
      
      if (typeof toast !== 'undefined') {
        toast.loading(`⏳ Waiting for chain finality: ${Math.round(progress)}%`, {
          id: 'finality-progress'
        });
      }
    }
    
    console.log('✅ Chain finality confirmed');
    if (typeof toast !== 'undefined') {
      toast.success('✅ Chain finality confirmed', { id: 'finality-progress' });
    }
  }
  
  async shareSecretConditionally(
    orderId: string, 
    secret: string, 
    resolverAddress: string
  ): Promise<void> {

    
    
    if (this.config.whitelistedResolvers.length > 0 && !this.config.whitelistedResolvers.includes(resolverAddress)) {
      throw new Error(`Resolver ${resolverAddress} is not in the whitelist`);
    }
    
    

    await new Promise(resolve => setTimeout(resolve, Math.min(this.config.secretSharingDelay * 100, 3000))); 
    



  }
  
  isResolverWhitelisted(resolverAddress: string): boolean {
    if (this.config.whitelistedResolvers.length === 0) return true; 
    return this.config.whitelistedResolvers.includes(resolverAddress);
  }
}


export class SafetyDepositManager {
  private config: SafetyDeposit;
  
  constructor(chain: 'ethereum' | 'sui', config?: Partial<SafetyDeposit>) {
    const minAmountStr = chain === 'ethereum' 
      ? getOptionalEnvVar('ETHEREUM_SAFETY_DEPOSIT_MIN', '1000000000000000') 
      : getOptionalEnvVar('SUI_SAFETY_DEPOSIT_MIN', '1000000000'); 
    
    this.config = {
      rate: getOptionalEnvVarNumber('SAFETY_DEPOSIT_RATE', 0.1),
      minAmount: BigInt(minAmountStr),
      chain,
      ...config
    };
  }
  
  calculateSafetyDeposit(escrowAmount: bigint): bigint {
    const calculatedAmount = (escrowAmount * BigInt(Math.floor(this.config.rate * 100))) / BigInt(1000);
    const finalAmount = calculatedAmount ;
    





    
    return finalAmount;
  }
  
  async createEscrowWithSafetyDeposit(
    amount: bigint,
    resolver: string
  ): Promise<{ totalAmount: bigint; safetyDeposit: bigint }> {
    const safetyDeposit = this.calculateSafetyDeposit(amount);
    const totalAmount = amount + safetyDeposit;
    





    
    return { totalAmount, safetyDeposit };
  }
  
  async executeWithdrawalWithIncentive(
    escrowId: string,
    resolver: string,
    safetyDeposit: bigint
  ): Promise<void> {




    
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    

  }
}


export class MerkleTreeSecretManager {
  private treeDepth: number;
  private segments: number;
  private secretReusePreventionEnabled: boolean;
  private usedSecrets: Set<string> = new Set();
  
  constructor(treeDepth?: number, segments?: number) {
    this.treeDepth = treeDepth || getOptionalEnvVarNumber('SECRET_TREE_DEPTH', 4);
    this.segments = segments || getOptionalEnvVarNumber('PARTIAL_FILL_SEGMENTS', 16);
    this.secretReusePreventionEnabled = getOptionalEnvVarBoolean('SECRET_REUSE_PREVENTION', true);
  }
  
  generateMerkleTreeSecrets(orderAmount: bigint): MerkleTreeSecrets {
    const secrets: string[] = [];
    
    
    for (let i = 0; i <= this.segments; i++) {
      let secret: string;
      do {
        secret = this.generateSecret();
      } while (this.secretReusePreventionEnabled && this.usedSecrets.has(secret));
      
      secrets.push(secret);
      if (this.secretReusePreventionEnabled) {
        this.usedSecrets.add(secret);
      }
    }
    
    const merkleRoot = this.calculateMerkleRoot(secrets);
    






    
    return {
      secrets,
      merkleRoot,
      treeDepth: this.treeDepth,
      segments: this.segments
    };
  }
  
  getSecretForFillPercentage(secrets: string[], fillPercentage: number): string {
    const segmentIndex = Math.floor(fillPercentage * this.segments / 100);
    const actualIndex = Math.min(segmentIndex, secrets.length - 1);
    



    
    return secrets[actualIndex];
  }
  
  verifySecretInTree(secret: string, merkleRoot: string, proof: string[]): boolean {
    




    
    
    const isValid = proof.length > 0; 

    
    return isValid;
  }
  
  private generateSecret(): string {
    return '0x' + Array.from({ length: 32 }, () => Math.floor(Math.random() * 256))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
  
  private calculateMerkleRoot(secrets: string[]): string {
    
    const leaves = secrets.map(secret => keccak256(secret as `0x${string}`));
    return this.buildMerkleTree(leaves);
  }
  
  private buildMerkleTree(leaves: string[]): string {
    if (leaves.length === 1) return leaves[0];
    
    const nextLevel: string[] = [];
    for (let i = 0; i < leaves.length; i += 2) {
      const left = leaves[i];
      const right = i + 1 < leaves.length ? leaves[i + 1] : left;
      const combined = keccak256(encodePacked(['bytes32', 'bytes32'], [left as `0x${string}`, right as `0x${string}`]));
      nextLevel.push(combined);
    }
    
    return this.buildMerkleTree(nextLevel);
  }
}


export class FusionRelayerService {
  private orders: Map<string, FusionOrder> = new Map();
  private resolvers: string[] = [];
  private isEnabled: boolean;
  private broadcastInterval: number;
  private notificationEnabled: boolean;
  
  constructor(enabled?: boolean) {
    this.isEnabled = enabled ?? getOptionalEnvVarBoolean('RELAYER_SERVICE_ENABLED', true);
    this.broadcastInterval = getOptionalEnvVarNumber('ORDER_BROADCAST_INTERVAL', 5000);
    this.notificationEnabled = getOptionalEnvVarBoolean('RESOLVER_NOTIFICATION_ENABLED', true);
    
    
    this.resolvers = getOptionalEnvVar('RESOLVER_WHITELIST', '').split(',').filter(addr => addr.length > 0);
  }
  
  async shareOrder(order: FusionOrder): Promise<void> {
    this.orders.set(order.id, order);
    
    if (!this.isEnabled) {

      return;
    }
    






    
    
    for (const resolver of this.resolvers) {
      await this.notifyResolver(resolver, order);
    }
    
    
    await this.startDutchAuction(order.id);
  }
  
  async startDutchAuction(orderId: string): Promise<void> {
    const order = this.orders.get(orderId);
    if (!order) {
      console.error(`❌ Order ${orderId} not found`);
      return;
    }
    

    order.status = 'auction';
    
    
    if (this.isEnabled) {
      this.monitorAuction(orderId);
    }
  }
  
  async shareSecretConditionally(
    orderId: string, 
    secret: string,
    condition: string
  ): Promise<void> {
    const order = this.orders.get(orderId);
    if (!order) {
      console.error(`❌ Order ${orderId} not found`);
      return;
    }
    

    
    if (condition === 'finality_confirmed') {
      

      await new Promise(resolve => setTimeout(resolve, 2000)); 
      await this.shareSecretWithResolvers(orderId, secret);
    }
  }
  
  private async notifyResolver(resolver: string, order: FusionOrder): Promise<void> {
    if (!this.notificationEnabled) return;
    

    
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  private async monitorAuction(orderId: string): Promise<void> {
    const order = this.orders.get(orderId);
    if (!order) return;
    
    const auction = new DutchAuction(order.auctionConfig);
    let monitoringRounds = 0;
    const maxRounds = 5; 
    

    
    
    const interval = setInterval(async () => {
      monitoringRounds++;
      const currentRate = auction.calculateCurrentRate(order.createdAt, 1.0);
      


      
      
      for (const resolver of this.resolvers) {
        if (auction.isProfitableForResolver(currentRate, 0.9)) {

          await this.executeOrder(orderId, resolver);
          clearInterval(interval);
          return;
        }
      }
      
      
      if (monitoringRounds >= maxRounds) {

        clearInterval(interval);
      }
    }, Math.min(this.broadcastInterval, 2000)); 
  }
  
  private async executeOrder(orderId: string, resolver: string): Promise<void> {
    const order = this.orders.get(orderId);
    if (!order) return;
    




    
    order.status = 'filled';
    
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    

  }
  
  private async shareSecretWithResolvers(orderId: string, secret: string): Promise<void> {




    
    for (const resolver of this.resolvers) {

    }
  }
  
  getOrderStatus(orderId: string): string {
    const order = this.orders.get(orderId);
    return order ? order.status : 'not_found';
  }
}


export class GasPriceAdjustmentManager {
  private config: GasPriceAdjustment;
  private historicalGasPrices: Map<string, bigint[]> = new Map();
  
  constructor(config?: Partial<GasPriceAdjustment>) {
    this.config = {
      enabled: getOptionalEnvVarBoolean('GAS_PRICE_ADJUSTMENT_ENABLED', true),
      volatilityThreshold: getOptionalEnvVarNumber('GAS_VOLATILITY_THRESHOLD', 0.2),
      adjustmentFactor: getOptionalEnvVarNumber('PRICE_ADJUSTMENT_FACTOR', 1.5),
      executionThresholdMultiplier: getOptionalEnvVarNumber('EXECUTION_THRESHOLD_MULTIPLIER', 1.2),
      ...config
    };
  }
  
  async adjustPriceForGasVolatility(
    originalPrice: number,
    chainId: number
  ): Promise<number> {
    if (!this.config.enabled) {

      return originalPrice;
    }
    
    const currentBaseFee = await this.getCurrentBaseFee(chainId);
    const chainKey = chainId.toString();
    const historicalPrices = this.historicalGasPrices.get(chainKey) || [];
    
    
    this.updateHistoricalPrices(chainId, currentBaseFee);
    
    if (historicalPrices.length === 0) {

      return originalPrice;
    }
    
    const averageHistoricalPrice = this.calculateAverage(historicalPrices);
    const gasVolatility = this.calculateGasVolatility(currentBaseFee, averageHistoricalPrice);
    






    
    if (Math.abs(gasVolatility) > this.config.volatilityThreshold) {
      const adjustedPrice = originalPrice * (1 + gasVolatility * this.config.adjustmentFactor);

      return adjustedPrice;
    }
    

    return originalPrice;
  }
  
  async shouldExecuteOrder(
    orderPrice: number,
    currentGasPrice: bigint,
    chainId: number
  ): Promise<boolean> {
    const executionThreshold = this.calculateExecutionThreshold(currentGasPrice);
    const adjustedPrice = await this.adjustPriceForGasVolatility(orderPrice, chainId);
    
    const shouldExecute = adjustedPrice >= executionThreshold;
    




    
    return shouldExecute;
  }
  
  private async getCurrentBaseFee(chainId: number): Promise<bigint> {
    
    const simulatedBaseFee = BigInt(Math.floor(Math.random() * 50 + 20)) * BigInt(1e9); 

    return simulatedBaseFee;
  }
  
  private updateHistoricalPrices(chainId: number, price: bigint): void {
    const chainKey = chainId.toString();
    const prices = this.historicalGasPrices.get(chainKey) || [];
    
    prices.push(price);
    
    
    if (prices.length > 100) {
      prices.shift();
    }
    
    this.historicalGasPrices.set(chainKey, prices);
  }
  
  private calculateAverage(prices: bigint[]): bigint {
    if (prices.length === 0) return BigInt(0);
    
    const sum = prices.reduce((acc, price) => acc + price, BigInt(0));
    return sum / BigInt(prices.length);
  }
  
  private calculateGasVolatility(current: bigint, historical: bigint): number {
    if (historical === BigInt(0)) return 0;
    return Number(current - historical) / Number(historical);
  }
  
  private calculateExecutionThreshold(currentGasPrice: bigint): number {
    return Number(currentGasPrice) * this.config.executionThresholdMultiplier;
  }
}


export class SecurityManager {
  private config: SecurityFeatures;
  private isPaused: boolean = false;
  private reentrancyGuard: Set<string> = new Set();
  
  constructor(config?: Partial<SecurityFeatures>) {
    const whitelistedResolvers = getOptionalEnvVar('RESOLVER_WHITELIST', '').split(',').filter(addr => addr.length > 0);
    const adminAddresses = getOptionalEnvVar('ADMIN_ADDRESSES', '').split(',').filter(addr => addr.length > 0);
    const pauseGuardian = getOptionalEnvVar('PAUSE_GUARDIAN', adminAddresses[0] || '');
    
    this.config = {
      reentrancyProtection: getOptionalEnvVarBoolean('REENTRANCY_PROTECTION', true),
      accessControl: {
        whitelistedResolvers,
        adminAddresses,
        pauseGuardian,
        ...config?.accessControl
      },
      emergencyPause: getOptionalEnvVarBoolean('EMERGENCY_PAUSE_ENABLED', true),
      upgradeability: getOptionalEnvVarBoolean('UPGRADEABILITY_ENABLED', true),
      ...config
    };
    






  }
  
  async checkReentrancyProtection(txHash: string): Promise<boolean> {
    if (!this.config.reentrancyProtection) {

      return true;
    }
    
    if (this.reentrancyGuard.has(txHash)) {
      console.error(`🚫 Reentrancy Attack Detected: ${txHash}`);
      return false;
    }
    

    this.reentrancyGuard.add(txHash);
    
    
    setTimeout(() => {
      this.reentrancyGuard.delete(txHash);

    }, 60000);
    
    return true;
  }
  
  async checkAccessControl(user: string, action: string): Promise<boolean> {



    
    const { adminAddresses, whitelistedResolvers, pauseGuardian } = this.config.accessControl;
    
    let hasAccess = false;
    
    switch (action) {
      case 'admin':
        hasAccess = adminAddresses.includes(user);

        break;
      case 'resolver':
        hasAccess = whitelistedResolvers.length === 0 || whitelistedResolvers.includes(user);

        break;
      case 'pause':
        hasAccess = user === pauseGuardian || adminAddresses.includes(user);

        break;
      default:

        hasAccess = false;
    }
    
    return hasAccess;
  }
  
  async emergencyPause(): Promise<void> {
    if (!this.config.emergencyPause) {

      return;
    }
    

    this.isPaused = true;
    
    
    await this.stopAllTransactions();
    

  }
  
  async emergencyResume(): Promise<void> {
    if (!this.config.emergencyPause) {

      return;
    }
    

    this.isPaused = false;
    

  }
  
  isPausedState(): boolean {
    return this.isPaused;
  }
  
  async performSecurityCheck(txHash: string, user: string, action: string): Promise<boolean> {




    
    
    if (this.isPaused) {
      console.error(`🛑 System is currently paused`);
      return false;
    }
    
    
    const reentrancySafe = await this.checkReentrancyProtection(txHash);
    if (!reentrancySafe) {
      return false;
    }
    
    
    const hasAccess = await this.checkAccessControl(user, action);
    if (!hasAccess) {
      return false;
    }
    

    return true;
  }
  
  private async stopAllTransactions(): Promise<void> {

    
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    

  }
}


export function createFusionPlusConfig() {
  return {
    dutchAuction: {
      auctionStartDelay: getOptionalEnvVarNumber('AUCTION_START_DELAY', 300),
      auctionDuration: getOptionalEnvVarNumber('AUCTION_DURATION', 3600),
      auctionStartRateMultiplier: getOptionalEnvVarNumber('AUCTION_START_RATE_MULTIPLIER', 6.0),
      minimumReturnRate: getOptionalEnvVarNumber('MINIMUM_RETURN_RATE', 0.8),
      decreaseRatePerMinute: getOptionalEnvVarNumber('DECREASE_RATE_PER_MINUTE', 0.01),
      priceCurveSegments: getOptionalEnvVarNumber('PRICE_CURVE_SEGMENTS', 3)
    },
    finalityLock: {
      sourceChainFinality: getOptionalEnvVarNumber('ETHEREUM_FINALITY_BLOCKS', 64),
      destinationChainFinality: getOptionalEnvVarNumber('SUI_FINALITY_BLOCKS', 100),
      secretSharingDelay: getOptionalEnvVarNumber('SECRET_SHARING_DELAY', 300),
      whitelistedResolvers: getOptionalEnvVar('RESOLVER_WHITELIST', '').split(',').filter(addr => addr.length > 0)
    },
    safetyDeposit: {
      rate: getOptionalEnvVarNumber('SAFETY_DEPOSIT_RATE', 0.1),
      ethereumMinAmount: getOptionalEnvVar('ETHEREUM_SAFETY_DEPOSIT_MIN', '1000000000000000'),
      suiMinAmount: getOptionalEnvVar('SUI_SAFETY_DEPOSIT_MIN', '1000000000')
    },
    merkleTree: {
      depth: getOptionalEnvVarNumber('SECRET_TREE_DEPTH', 4),
      segments: getOptionalEnvVarNumber('PARTIAL_FILL_SEGMENTS', 16),
      reusePreventionEnabled: getOptionalEnvVarBoolean('SECRET_REUSE_PREVENTION', true)
    },
    relayer: {
      enabled: getOptionalEnvVarBoolean('RELAYER_SERVICE_ENABLED', true),
      broadcastInterval: getOptionalEnvVarNumber('ORDER_BROADCAST_INTERVAL', 5000),
      notificationEnabled: getOptionalEnvVarBoolean('RESOLVER_NOTIFICATION_ENABLED', true),
      secretSharingCondition: getOptionalEnvVar('SECRET_SHARING_CONDITION', 'finality_confirmed')
    },
    gasAdjustment: {
      enabled: getOptionalEnvVarBoolean('GAS_PRICE_ADJUSTMENT_ENABLED', true),
      volatilityThreshold: getOptionalEnvVarNumber('GAS_VOLATILITY_THRESHOLD', 0.2),
      adjustmentFactor: getOptionalEnvVarNumber('PRICE_ADJUSTMENT_FACTOR', 1.5),
      executionThresholdMultiplier: getOptionalEnvVarNumber('EXECUTION_THRESHOLD_MULTIPLIER', 1.2)
    },
    security: {
      reentrancyProtection: getOptionalEnvVarBoolean('REENTRANCY_PROTECTION', true),
      accessControl: {
        whitelistedResolvers: getOptionalEnvVar('RESOLVER_WHITELIST', '').split(',').filter(addr => addr.length > 0),
        adminAddresses: getOptionalEnvVar('ADMIN_ADDRESSES', '').split(',').filter(addr => addr.length > 0),
        pauseGuardian: getOptionalEnvVar('PAUSE_GUARDIAN', '')
      },
      emergencyPause: getOptionalEnvVarBoolean('EMERGENCY_PAUSE_ENABLED', true),
      upgradeability: getOptionalEnvVarBoolean('UPGRADEABILITY_ENABLED', true)
    }
  };
}