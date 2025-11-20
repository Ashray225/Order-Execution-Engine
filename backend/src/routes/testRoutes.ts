import { FastifyInstance } from 'fastify';
import { OrderModel } from '../models/order';
import { OrderQueue } from '../services/queue';
import { Database } from '../services/database';

export async function testRoutes(fastify: FastifyInstance) {
  const orderQueue = new OrderQueue();
  const database = new Database();

  // Test endpoint to trigger DLQ failures
  fastify.post('/test/dlq', async (request, reply) => {
    try {
      // Create a test order that will fail
      const testOrderData = {
        tokenIn: 'SOL',
        tokenOut: 'USDC',
        amount: 999, // This triggers failure in MockDexRouter
        slippage: 0.01
      };
      
      const order = OrderModel.create(testOrderData);
      
      // Save to database
      await database.saveOrder(order);
      
      // Add to queue (will fail and go to DLQ)
      await orderQueue.addOrder(order);
      
      return reply.send({
        message: 'Test order created that will fail and go to DLQ',
        orderId: order.id,
        note: 'Watch console logs for retry attempts and DLQ processing'
      });
      
    } catch (error) {
      return reply.status(500).send({
        error: 'Failed to create test DLQ order',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Test endpoint to create multiple failing orders
  fastify.post('/test/dlq/bulk', async (request, reply) => {
    try {
      const orders = [];
      
      // Create 5 test orders that will fail
      for (let i = 0; i < 5; i++) {
        const testOrderData = {
          tokenIn: 'SOL',
          tokenOut: 'USDC',
          amount: 999 + i, // All will trigger failures
          slippage: 0.01
        };
        
        const order = OrderModel.create(testOrderData);
        await database.saveOrder(order);
        await orderQueue.addOrder(order);
        
        orders.push(order.id);
      }
      
      return reply.send({
        message: 'Created 5 test orders that will fail and go to DLQ',
        orderIds: orders,
        note: 'Watch console logs for multiple retry attempts and DLQ processing'
      });
      
    } catch (error) {
      return reply.status(500).send({
        error: 'Failed to create bulk test DLQ orders',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}