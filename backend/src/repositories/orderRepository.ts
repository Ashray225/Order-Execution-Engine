import { db } from '../config/database';
import { Order } from '../types/order';
import { IRepository } from '../interfaces/repository';
import dotenv from 'dotenv';

dotenv.config();

export class OrderRepository implements IRepository<Order> {
  async save(orderData: Order): Promise<void> {
    console.log('process.env.ORDERS_TABLE:', process.env.ORDERS_TABLE);
    await db(process.env.ORDERS_TABLE || 'orders').insert({
      id: orderData.id,
      token_in: orderData.tokenIn,
      token_out: orderData.tokenOut,
      amount: orderData.amount,
      type: orderData.type,
      slippage: orderData.slippage,
      status: 'pending',
      created_at: new Date()
    });
  }

  async update(orderId: string, data: Partial<Order>): Promise<void> {
    await db(process.env.ORDERS_TABLE || 'orders')
      .where('id', orderId)
      .update({
        ...data,
        updated_at: new Date()
      });
  }

  async remove(orderId: string): Promise<void> {
    await db(process.env.ORDERS_TABLE || 'orders').where('id', orderId).del();
  }

  async findById(orderId: string): Promise<Order | null> {
    return await db(process.env.ORDERS_TABLE || 'orders').where('id', orderId).first();
  }

  // Custom method for status updates
  async updateStatus(orderId: string, status: string): Promise<void> {
    await this.update(orderId, { status } as Partial<Order>);
  }
}