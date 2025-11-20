# Order Execution Engine Backend

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Start development server:
```bash
npm run dev
```

## Endpoints

- `GET /health` - Health check
- `POST /api/orders/execute` - Submit order
- `WS /api/orders/execute` - WebSocket for order status updates

## Order Type: Market Orders Only

**Why Market Orders**: Immediate execution at current market price provides the cleanest implementation for demonstrating DEX routing, queue processing, and real-time WebSocket status updates without complex price monitoring or timing logic.

**Future Extensions**: 
- **Limit Orders**: Would require price monitoring service and conditional execution
- **Sniper Orders**: Would require token launch detection and rapid execution triggers