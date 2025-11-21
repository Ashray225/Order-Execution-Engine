import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import cors from '@fastify/cors';
import { orderRoutes } from './routes/orderRoutes';
import { websocketRoutes } from './routes/websocketRoutes';
import { connectionRoutes } from './routes/connectionRoutes';
import { dlqRoutes } from './routes/dlqRoutes';
import { testRoutes } from './routes/testRoutes';
import { OrderWorker } from './workers/orderWorker';
import dotenv from 'dotenv';

dotenv.config();

const fastify = Fastify({
  logger: true
});

// Initialize order worker
const orderWorker = new OrderWorker();

// Register CORS plugin
fastify.register(cors, {
  origin: process.env.FRONTEND_URL ? [process.env.FRONTEND_URL, 'http://localhost:5173'] : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
});

// Register WebSocket plugin
fastify.register(websocket);

// Register routes
fastify.register(connectionRoutes);
fastify.register(orderRoutes);
fastify.register(websocketRoutes);
fastify.register(dlqRoutes);
fastify.register(testRoutes);

// Health check endpoint
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await orderWorker.close();
  await fastify.close();
  process.exit(0);
});

const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3000');
    await fastify.listen({ port, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    await orderWorker.close();
    process.exit(1);
  }
};

start();