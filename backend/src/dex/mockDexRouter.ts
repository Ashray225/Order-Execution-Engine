import { Order } from '../types/order';

interface DexQuote {
  price: number;
  fee: number;
  dex: string;
}

interface SwapResult {
  txHash: string;
  executedPrice: number;
  dex: string;
}

export class MockDexRouter {
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateMockTxHash(): string {
    return `0x${Math.random().toString(16).substr(2, 64)}`;
  }

  private getBasePrice(tokenIn: string, tokenOut: string): number {
    // Mock base prices for different token pairs
    const pairs: { [key: string]: number } = {
      'SOL-USDC': 95.50,
      'USDC-SOL': 0.0105,
      'SOL-USDT': 95.30,
      'USDT-SOL': 0.0105
    };
    
    const pairKey = `${tokenIn}-${tokenOut}`;
    return pairs[pairKey] || 1.0;
  }

  async getRaydiumQuote(tokenIn: string, tokenOut: string, amount: number): Promise<DexQuote> {
    // Simulate network delay
    await this.sleep(200);
    
    // Simulate failure for DLQ testing
    if (amount >= 999) {
      throw new Error('Raydium API temporarily unavailable - simulated failure for DLQ testing');
    }
    
    const basePrice = this.getBasePrice(tokenIn, tokenOut);
    // Raydium: price variance 98-102% of base, 0.3% fee
    const price = basePrice * (0.98 + Math.random() * 0.04);
    
    return {
      price: price * amount,
      fee: 0.003,
      dex: 'Raydium'
    };
  }

  async getMeteorQuote(tokenIn: string, tokenOut: string, amount: number): Promise<DexQuote> {
    // Simulate network delay
    await this.sleep(200);
    
    // Simulate failure for DLQ testing
    if (amount >= 999) {
      throw new Error('Meteora API connection timeout - simulated failure for DLQ testing');
    }
    
    const basePrice = this.getBasePrice(tokenIn, tokenOut);
    // Meteora: price variance 97-102% of base, 0.2% fee
    const price = basePrice * (0.97 + Math.random() * 0.05);
    
    return {
      price: price * amount,
      fee: 0.002,
      dex: 'Meteora'
    };
  }

  async getBestQuote(tokenIn: string, tokenOut: string, amount: number): Promise<DexQuote> {
    // Get quotes from both DEXs
    const [raydiumQuote, meteoraQuote] = await Promise.all([
      this.getRaydiumQuote(tokenIn, tokenOut, amount),
      this.getMeteorQuote(tokenIn, tokenOut, amount)
    ]);

    // Calculate net price after fees
    const raydiumNet = raydiumQuote.price * (1 - raydiumQuote.fee);
    const meteoraNet = meteoraQuote.price * (1 - meteoraQuote.fee);

    // Return best quote (highest net price for selling, lowest for buying)
    const bestQuote = raydiumNet > meteoraNet ? raydiumQuote : meteoraQuote;
    
    console.log(`   Raydium: ${raydiumQuote.price.toFixed(4)} (net: ${raydiumNet.toFixed(4)})`);
    console.log(`   Meteora: ${meteoraQuote.price.toFixed(4)} (net: ${meteoraNet.toFixed(4)})`);
    console.log(`   Selected: ${bestQuote.dex} - Better price by ${Math.abs(raydiumNet - meteoraNet).toFixed(4)}`);

    return bestQuote;
  }

  async executeSwap(order: Order, bestQuote: DexQuote): Promise<SwapResult> {
    console.log(`Executing swap on ${bestQuote.dex}...`);
    
    // Simulate execution failure for DLQ testing
    if (order.amount >= 999) {
      throw new Error(`Blockchain network congestion - transaction failed on ${bestQuote.dex}`);
    }
    
    // Simulate 2-3 second execution time
    await this.sleep(2000 + Math.random() * 1000);
    
    // Apply slippage protection (simulate minor price movement)
    const slippageImpact = (Math.random() - 0.5) * order.slippage * 2;
    const executedPrice = bestQuote.price * (1 + slippageImpact);
    
    return {
      txHash: this.generateMockTxHash(),
      executedPrice,
      dex: bestQuote.dex
    };
  }
}