import { Order } from '../types/order';

export class LimitOrderProcessor {
  async process(order: Order): Promise<{ orderId: string; status: string }> {
    // TODO: Extend engine to support limit orders
    // Implementation would include:
    // - Price monitoring service
    // - Target price comparison
    // - Conditional execution when price is reached
    throw new Error('Limit orders - extend engine to add price monitoring');
  }
}