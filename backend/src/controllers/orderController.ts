import { FastifyRequest, FastifyReply } from 'fastify';
import { OrderRequest } from '../types/order';
import { OrderModel } from '../models/order';
import { OrderQueue } from '../services/queue';
import { Database } from '../services/database';
import { ConnectionRepository } from '../repositories/connectionRepository';

export class OrderController {
  private orderQueue: OrderQueue;
  private database: Database;
  private connectionRepo: ConnectionRepository;

  constructor() {
    this.orderQueue = new OrderQueue();
    this.database = new Database();
    this.connectionRepo = new ConnectionRepository();
  }

  async executeOrder(request: FastifyRequest<{ Body: OrderRequest }>, reply: FastifyReply) {
    try {
      // Step 1: Create order model from request
      const orderData = {
        tokenIn: request.body.tokenIn,
        tokenOut: request.body.tokenOut,
        amount: request.body.amount,
        slippage: request.body.slippage || 0.01
      };
      const order = OrderModel.create(orderData);
      
      // Step 2: Save order to database (don't queue yet)
      await this.database.saveOrder(order);
      
      // Step 3: Return orderId to client for WebSocket connection
      return reply.send({
        orderId: order.id,
        status: 'created',
        message: 'Order created. Connect WebSocket to start processing.',
        websocketUrl: `/order/${order.id}`
      });
    } catch (error) {
      return reply.status(500).send({
        error: 'Failed to create order',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}