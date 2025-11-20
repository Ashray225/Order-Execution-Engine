import { FastifyInstance } from 'fastify';

export async function connectionRoutes(fastify: FastifyInstance) {
  // Health check for WebSocket endpoint
  fastify.get('/api/connection/info', async (request, reply) => {
    return reply.send({
      websocketUrl: 'ws://localhost:3000/ws',
      message: 'Connect to WebSocket first, then use connectionId in order request'
    });
  });
}