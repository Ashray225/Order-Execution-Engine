import { v4 as uuidv4 } from 'uuid';
import { Order, OrderRequest } from '../types/order';

export class OrderModel {
  static create(orderRequest: OrderRequest): Order {
    return {
      id: uuidv4(),
      tokenIn: orderRequest.tokenIn,
      tokenOut: orderRequest.tokenOut,
      amount: orderRequest.amount,
      type: 'market',
      slippage: orderRequest.slippage || 0.01,
      createdAt: new Date(),
    };
  }
}