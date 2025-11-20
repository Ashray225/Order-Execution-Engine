export const executeOrderSchema = {
  body: {
    type: 'object',
    required: ['tokenIn', 'tokenOut', 'amount'],
    properties: {
      tokenIn: { type: 'string' },
      tokenOut: { type: 'string' },
      amount: { type: 'number', minimum: 0 },
      slippage: { type: 'number', minimum: 0, maximum: 1 }
    }
  }
};