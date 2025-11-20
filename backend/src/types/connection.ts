export interface Connection {
  id: string;
  orderId: string;
  connectionId: string;
  connectedAt: Date;
  disconnectedAt?: Date;
  isActive: boolean;
}