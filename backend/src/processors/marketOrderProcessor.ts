import { Order } from '../types/order';
import { Database } from '../services/database';
import { wsManager } from '../services/websocketManager';
import { ConnectionRepository } from '../repositories/connectionRepository';
import { MockDexRouter } from '../dex/mockDexRouter';

export class MarketOrderProcessor {
  private db: Database;
  private connectionRepo: ConnectionRepository;
  private dexRouter: MockDexRouter;

  constructor() {
    this.db = new Database();
    this.connectionRepo = new ConnectionRepository();
    this.dexRouter = new MockDexRouter();
  }

  async process(order: Order): Promise<{ orderId: string; status: string }> {
    let connectionId: string | undefined;
    
    try {
      // Get connection ID from database
      const connection = await this.connectionRepo.getActiveConnection(order.id);
      connectionId = connection?.connection_id;

      // Step 1: Order received and queued
      if (connectionId) wsManager.sendStatus(connectionId, 'pending', { orderId: order.id });
      await this.db.updateOrderStatus(order.id, 'pending');
      
      // Step 2: Comparing DEX prices (routing)
      if (connectionId) wsManager.sendStatus(connectionId, 'routing', { 
        orderId: order.id, 
        message: 'Comparing Raydium and Meteora prices...' 
      });
      await this.db.updateOrderStatus(order.id, 'routing');
      
      // Get best quote from DEX router
      const bestQuote = await this.dexRouter.getBestQuote(order.tokenIn, order.tokenOut, order.amount);
      
      // Step 3: Creating transaction (building)
      if (connectionId) wsManager.sendStatus(connectionId, 'building', { 
        orderId: order.id, 
        selectedDex: bestQuote.dex,
        estimatedPrice: bestQuote.price,
        message: `Building transaction on ${bestQuote.dex}...` 
      });
      await this.db.updateOrderStatus(order.id, 'building');
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Step 4: Transaction sent to network (submitted)
      if (connectionId){ 
        wsManager.sendStatus(connectionId, 'submitted', { 
        orderId: order.id, 
        dex: bestQuote.dex,
        message: 'Transaction submitted to blockchain...' 
      })}
      await this.db.updateOrderStatus(order.id, 'submitted');
      
      // Step 5: Execute swap and get result
      const swapResult = await this.dexRouter.executeSwap(order, bestQuote);
      
      // Step 6: Transaction successful (confirmed)
      if (connectionId) wsManager.sendStatus(connectionId, 'confirmed', { 
        orderId: order.id,
        txHash: swapResult.txHash,
        executedPrice: swapResult.executedPrice,
        dex: swapResult.dex,
        tokenIn: order.tokenIn,
        tokenOut: order.tokenOut,
        amount: order.amount,
        message: `Swap completed successfully on ${swapResult.dex}` 
      });
      await this.db.updateOrderStatus(order.id, 'confirmed');
      
      // Clean up connection after successful completion
      if (connectionId) {
        await this.connectionRepo.removeConnection(connectionId);
        wsManager.removeConnection(connectionId);
        console.log(`Connection ${connectionId} cleaned up and disconnected`);
      }
      
      return { orderId: order.id, status: 'confirmed' };
      
    } catch (error) {
      console.error(`Order ${order.id} failed:`, error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (connectionId) {
        wsManager.sendStatus(connectionId, 'failed', { 
          orderId: order.id, 
          error: errorMessage,
          message: 'Order execution failed' 
        });
      }
      
      await this.db.updateOrderStatus(order.id, 'failed');
      
      // Clean up connection after failure
      if (connectionId) {
        await this.connectionRepo.removeConnection(connectionId);
        wsManager.removeConnection(connectionId);
        console.log(`Connection ${connectionId} cleaned up and disconnected after failure`);
      }
      
      throw error;
    }
  }
}