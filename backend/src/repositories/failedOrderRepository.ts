import { db } from '../config/database';
import dotenv from 'dotenv';

dotenv.config();

export class FailedOrderRepository {
  async saveFailedOrder(failedOrderData: any): Promise<void> {
    console.log('process.env.FAILED_ORDERS_TABLE:', process.env.FAILED_ORDERS_TABLE);
    await db(process.env.FAILED_ORDERS_TABLE || 'failed_orders').insert({
      order_id: failedOrderData.originalJob.id,
      original_order: JSON.stringify(failedOrderData.originalJob),
      failure_reason: failedOrderData.failureReason,
      attempts_made: failedOrderData.attempts,
      failed_at: failedOrderData.failedAt,
      last_error: failedOrderData.lastError,
      created_at: new Date()
    });
  }

  async getFailedOrders(limit: number = 50): Promise<any[]> {
    return await db(process.env.FAILED_ORDERS_TABLE || 'failed_orders')
      .orderBy('failed_at', 'desc')
      .limit(limit);
  }

  async getFailedOrdersByReason(reason: string): Promise<any[]> {
    return await db(process.env.FAILED_ORDERS_TABLE || 'failed_orders')
      .where('failure_reason', 'like', `%${reason}%`)
      .orderBy('failed_at', 'desc');
  }
}