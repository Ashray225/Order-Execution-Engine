import { FastifyInstance } from 'fastify';
import { wsManager } from '../services/websocketManager';

export async function websocketRoutes(fastify: FastifyInstance) {
 fastify.get('/order/:orderId', { websocket: true }, async (connection, req) => {
    const orderId = (req.params as { orderId: string }).orderId;
    
    // Generate connection ID and link to order
    const connectionId = wsManager.addConnection(connection.socket);
    
    try {
      // Save connection mapping to database
      await wsManager.saveConnectionForOrder(orderId, connectionId);
      
      // Fetch order from database and send to queue for processing
      await wsManager.startOrderProcessing(orderId);
      
      // Send connection confirmation
      connection.socket.send(JSON.stringify({
        type: 'connection',
        status: 'connected',
        orderId,
        connectionId,
        message: 'Connected and order processing started',
        timestamp: new Date().toISOString()
      }));
      
    } catch (error) {
      connection.socket.send(JSON.stringify({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to start order processing'
      }));
    }
    
    connection.socket.on('close', () => {
      wsManager.removeConnection(connectionId);
    });
    
    connection.socket.on('error', (error:any) => {
      console.error(`WebSocket error for order ${orderId}:`, error);
      wsManager.removeConnection(connectionId);
    });
  });
}