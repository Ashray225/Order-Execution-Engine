import { Queue } from 'bullmq';
import { Order } from '../types/order';
import dotenv from 'dotenv';

dotenv.config();

export class OrderQueue {
  private marketQueue: Queue;
  private limitQueue: Queue;
  private sniperQueue: Queue;
  private deadLetterQueue: Queue;

  constructor() {
    console.log('process.env.REDIS_HOST:', process.env.REDIS_HOST);
    console.log('process.env.REDIS_PORT:', process.env.REDIS_PORT);
    
    const connection = { 
      host: process.env.REDIS_HOST || 'localhost', 
      port: parseInt(process.env.REDIS_PORT || '6380') 
    };
    
    // Main processing queues with retry configuration
    this.marketQueue = new Queue('market-orders', { 
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000, // Start with 2 seconds
        },
        removeOnComplete: 10,
        removeOnFail: false, // Keep failed jobs for DLQ processing
      }
    });
    
    this.limitQueue = new Queue('limit-orders', { 
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 }
      }
    });
    
    this.sniperQueue = new Queue('sniper-orders', { 
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 }
      }
    });
    
    // Dead Letter Queue for failed orders
    this.deadLetterQueue = new Queue('failed-orders-dlq', { connection });
  }

  async addOrder(order: Order): Promise<void> {
    switch (order.type) {
      case 'market':
        await this.marketQueue.add('process-market-order', order);
        break;
      case 'limit':
        await this.limitQueue.add('process-limit-order', order);
        break;
      case 'sniper':
        await this.sniperQueue.add('process-sniper-order', order);
        break;
      default:
        throw new Error(`Unknown order type: ${order.type}`);
    }
  }

  getMarketQueue(): Queue { return this.marketQueue; }
  getLimitQueue(): Queue { return this.limitQueue; }
  getSniperQueue(): Queue { return this.sniperQueue; }
  getDeadLetterQueue(): Queue { return this.deadLetterQueue; }
  
  async moveToDeadLetter(failedJob: any, error: string): Promise<void> {
    await this.deadLetterQueue.add('failed-order', {
      originalJob: failedJob.data,
      failureReason: error,
      attempts: failedJob.attemptsMade,
      failedAt: new Date().toISOString(),
      lastError: failedJob.failedReason
    });
  }
}