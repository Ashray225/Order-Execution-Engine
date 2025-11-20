export interface Order {
  id: string;
  tokenIn: string;
  tokenOut: string;
  amount: number;
  type: 'market' | 'limit' | 'sniper';
  slippage: number;
  createdAt: Date;
}

export interface OrderRequest {
  tokenIn: string;
  tokenOut: string;
  amount: number;
  slippage?: number;
}