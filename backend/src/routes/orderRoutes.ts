import { FastifyInstance } from 'fastify';
import { OrderController } from '../controllers/orderController';
import { executeOrderSchema } from '../schemas/orderSchemas';

export async function orderRoutes(fastify: FastifyInstance) {
  const orderController = new OrderController();

  // Single endpoint for both HTTP POST and WebSocket upgrade
  fastify.post('/order', {
    schema: executeOrderSchema
  }, orderController.executeOrder.bind(orderController));
}