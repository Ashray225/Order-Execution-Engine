import { OrderRepository } from '../repositories/orderRepository';

export class Database {
  private orderRepo: OrderRepository;

  constructor() {
    this.orderRepo = new OrderRepository();
  }

  async saveOrder(orderData: any): Promise<void> {
    await this.orderRepo.save(orderData);
  }

  async updateOrderStatus(orderId: string, status: string): Promise<void> {
    await this.orderRepo.updateStatus(orderId, status);
  }

  async getOrder(orderId: string): Promise<any> {
    return await this.orderRepo.findById(orderId);
  }
}