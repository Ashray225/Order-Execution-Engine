import { Worker, ConnectionOptions } from 'bullmq';
import { Order } from '../types/order';
import { MarketOrderProcessor } from '../processors/marketOrderProcessor';
import { LimitOrderProcessor } from '../processors/limitOrderProcessor';
import { SniperOrderProcessor } from '../processors/sniperOrderProcessor';
import { OrderQueue } from '../services/queue';
import dotenv from 'dotenv';

dotenv.config();

export class OrderWorker {
  private marketWorker: Worker;
  private limitWorker: Worker;
  private sniperWorker: Worker;
  private dlqWorker: Worker;
  private marketProcessor: MarketOrderProcessor;
  private limitProcessor: LimitOrderProcessor;
  private sniperProcessor: SniperOrderProcessor;
  private orderQueue: OrderQueue;

  constructor() {
    console.log('process.env.REDIS_URL:', process.env.REDIS_URL);
    
    if (!process.env.REDIS_URL) {
      throw new Error('REDIS_URL environment variable is required');
    }
    const connection: ConnectionOptions = { 
      host: new URL(process.env.REDIS_URL).hostname,
      port: parseInt(new URL(process.env.REDIS_URL).port),
      username: new URL(process.env.REDIS_URL).username,
      password: new URL(process.env.REDIS_URL).password,
      tls: {}
    };
    
    // Initialize processors and queue
    this.marketProcessor = new MarketOrderProcessor();
    this.limitProcessor = new LimitOrderProcessor();
    this.sniperProcessor = new SniperOrderProcessor();
    this.orderQueue = new OrderQueue();

    // Market order worker with retry handling
    this.marketWorker = new Worker('market-orders', this.processMarketOrder.bind(this), { 
      connection,
      concurrency: 10 // Process up to 10 concurrent orders
    });
    
    // Extension ready workers
    this.limitWorker = new Worker('limit-orders', this.processLimitOrder.bind(this), { connection });
    this.sniperWorker = new Worker('sniper-orders', this.processSniperOrder.bind(this), { connection });
    
    // Dead Letter Queue worker for failed orders
    this.dlqWorker = new Worker('failed-orders-dlq', this.processDLQOrder.bind(this), { connection });

    // Event listeners
    this.marketWorker.on('ready', () => console.log('Market order worker ready (concurrency: 10)'));
    this.marketWorker.on('completed', (job) => console.log(`Market order ${job.data.id} completed`));
    this.marketWorker.on('failed', async (job, err) => {
      if (job && job.attemptsMade >= 3) {
        console.log(`Order ${job.data.id} failed after 3 attempts, moving to DLQ`);
        await this.orderQueue.moveToDeadLetter(job, err.message);
      }
    });
    
    this.dlqWorker.on('ready', () => console.log('Dead Letter Queue worker ready'));
  }

  private async processMarketOrder(job: any) {
    const order: Order = job.data;
    console.log(`Processing market order ${order}`);
    return await this.marketProcessor.process(order);
  }

  private async processLimitOrder(job: any) {
    const order: Order = job.data;
    return await this.limitProcessor.process(order);
  }

  private async processSniperOrder(job: any) {
    const order: Order = job.data;
    return await this.sniperProcessor.process(order);
  }

  private async processDLQOrder(job: any) {
    const failedOrder = job.data;
    // Here you could:
    // 1. Log to monitoring system
    // 2. Send alerts
    // 3. Store in separate failed orders table
    // 4. Trigger manual review process
    
    return { processed: true, dlq: true };
  }

  async close() {
    await Promise.all([
      this.marketWorker.close(),
      this.limitWorker.close(),
      this.sniperWorker.close(),
      this.dlqWorker.close()
    ]);
  }
}