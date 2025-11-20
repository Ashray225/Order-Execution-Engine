import { db } from '../config/database';
import { Connection } from '../types/connection';
import { IRepository } from '../interfaces/repository';
import dotenv from 'dotenv';

dotenv.config();

export class ConnectionRepository implements IRepository<Connection> {
  async save(connection: Connection): Promise<void> {
    console.log('process.env.CONNECTIONS_TABLE:', process.env.CONNECTIONS_TABLE);
    await db(process.env.CONNECTIONS_TABLE || 'connections').insert({
      id: connection.id,
      order_id: connection.orderId,
      connection_id: connection.connectionId,
      connected_at: connection.connectedAt,
      is_active: connection.isActive
    });
  }

  async update(id: string, data: Partial<Connection>): Promise<void> {
    await db(process.env.CONNECTIONS_TABLE || 'connections')
      .where('id', id)
      .update({
        ...data,
        updated_at: new Date()
      });
  }

  async remove(id: string): Promise<void> {
    await db(process.env.CONNECTIONS_TABLE || 'connections').where('id', id).del();
  }

  async findById(id: string): Promise<Connection | null> {
    return await db(process.env.CONNECTIONS_TABLE || 'connections').where('id', id).first();
  }

  // Custom methods
  async saveConnection(orderId: string, connectionId: string): Promise<void> {
    const connection: Connection = {
      id: connectionId,
      orderId,
      connectionId,
      connectedAt: new Date(),
      isActive: true
    };
    await this.save(connection);
  }

  async removeConnection(connectionId: string): Promise<void> {
    await db(process.env.CONNECTIONS_TABLE || 'connections')
      .where('connection_id', connectionId)
      .update({
        is_active: false,
        disconnected_at: new Date()
      });
  }

  async getActiveConnection(orderId: string): Promise<any> {
    return await db(process.env.CONNECTIONS_TABLE || 'connections')
      .where('order_id', orderId)
      .where('is_active', true)
      .first();
  }
}