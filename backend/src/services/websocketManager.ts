import { WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { ConnectionRepository } from '../repositories/connectionRepository';
import { Database } from '../services/database';
import { OrderQueue } from '../services/queue';

export class WebSocketManager {
  private connections: Map<string, WebSocket> = new Map();
  private connectionRepo: ConnectionRepository;
  private database: Database;
  private orderQueue: OrderQueue;

  constructor() {
    this.connectionRepo = new ConnectionRepository();
    this.database = new Database();
    this.orderQueue = new OrderQueue();
  }

  addConnection(ws: WebSocket): string {
    const connectionId = uuidv4();
    this.connections.set(connectionId, ws);
    console.log(`WebSocket connected: ${connectionId}`);
    return connectionId;
  }

  async saveConnectionForOrder(orderId: string, connectionId: string): Promise<void> {
    await this.connectionRepo.saveConnection(orderId, connectionId);
    console.log(`Connection ${connectionId} linked to order ${orderId}`);
  }

  async startOrderProcessing(orderId: string): Promise<void> {
    // Fetch order from database
    const order = await this.database.getOrder(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    // Only process orders with pending status
    if (order.status !== 'pending') {
      throw new Error(`Order ${orderId} has already been processed (status: ${order.status})`);
    }

    // Send order to processing queue
    await this.orderQueue.addOrder(order);
    console.log(`Order ${orderId} sent to processing queue`);
  }

  removeConnection(connectionId: string): void {
    const ws = this.connections.get(connectionId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close(1000, 'Order processing completed');
    }
    this.connections.delete(connectionId);
    console.log(`WebSocket disconnected: ${connectionId}`);
  }

  sendStatus(connectionId: string, status: string, data?: any): void {
    const ws = this.connections.get(connectionId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'status',
        status,
        timestamp: new Date().toISOString(),
        ...data
      }));
    }
  }
}

export const wsManager = new WebSocketManager();