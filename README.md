# Order Execution Engine

A real-time order execution engine with DEX routing, WebSocket status updates, and comprehensive queue management. Built with Node.js, TypeScript, and React.

**Host URL**: [https://order-execution.netlify.app/](https://order-execution.netlify.app/)

**Base Http Endpoint**: [https://order-execution-engine-vwq4.onrender.com/](https://order-execution-engine-vwq4.onrender.com/)

**Base Websocket Endpoint**: [wss://order-execution-engine-vwq4.onrender.com/](wss://order-execution-engine-vwq4.onrender.com/)

## Overview

This system processes **Market Orders** with automatic DEX routing between Raydium and Meteora, providing real-time status updates through WebSocket connections. The engine supports concurrent processing, retry mechanisms, and dead letter queue for failed orders.

## Architecture

### Backend Stack
- **Node.js + TypeScript** - Core runtime and type safety
- **Fastify** - High-performance web framework with WebSocket support
- **BullMQ + Redis** - Queue management and job processing
- **PostgreSQL + Knex** - Data persistence and query building
- **Docker** - Containerized database services

### Frontend Stack
- **React + TypeScript** - Modern UI with type safety
- **Vite** - Fast development and build tooling
- **WebSocket API** - Real-time order status updates

## Order Execution Flow

### 1. Order Creation
```
POST /order
```
- User submits order via REST API
- Order validated and saved to PostgreSQL
- Returns `orderId` for WebSocket connection

### 2. WebSocket Connection & Processing
```
WS /order/:orderId
```
- Frontend connects WebSocket with orderId
- Backend links connection to order in database
- Order fetched from database and sent to BullMQ queue
- Real-time processing begins

### 3. DEX Routing & Execution
```
pending → routing → building → submitted → confirmed
```

**Routing Phase:**
- Fetches quotes from both Raydium and Meteora
- Compares prices after fees (Raydium: 0.3%, Meteora: 0.2%)
- Selects best execution venue
- Logs routing decision for transparency

**Execution Phase:**
- Builds transaction on selected DEX
- Applies slippage protection
- Simulates blockchain execution (2-3 seconds)
- Returns transaction hash and executed price

### 4. Status Updates
Real-time WebSocket messages for each phase:
- **pending** - Order received and queued
- **routing** - Comparing DEX prices
- **building** - Creating transaction
- **submitted** - Transaction sent to network
- **confirmed** - Transaction successful (includes txHash)
- **failed** - If any step fails (includes error)

## Order Type: Market Orders

**Why Market Orders**: Immediate execution at current market price provides the cleanest implementation for demonstrating DEX routing, queue processing, and real-time WebSocket status updates without complex price monitoring or timing logic.

**Future Extensions**:
- **Limit Orders**: Would require price monitoring service and conditional execution when target price is reached
- **Sniper Orders**: Would require token launch detection service and rapid execution triggers

## Key Features

### Concurrent Processing
- **Queue System**: Manages up to 10 concurrent orders (implemented)
- **BullMQ + Redis**: Job queue processing and worker coordination

### Retry Logic & Dead Letter Queue
- **Exponential Backoff**: 3 attempts with 2s, 4s, 8s delays
- **Failure Handling**: Failed orders moved to Dead Letter Queue
- **Post-mortem Analysis**: Complete failure context preserved
- **Monitoring Ready**: Failed orders accessible via API

### Real-time Updates
- **WebSocket Streaming**: Live order status updates
- **Connection Management**: Automatic cleanup after completion
- **Error Handling**: Graceful failure notifications

## Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- Git

### Backend Setup
```bash
cd backend

# Start databases
docker compose up -d

# Install dependencies
npm install

# Start development server
npm run dev
```

### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Access Points
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health

## API Endpoints

### Order Management
```bash
# Create Order
POST /order
{
  "tokenIn": "SOL",
  "tokenOut": "USDC", 
  "amount": 1.5,
  "slippage": 0.01
}

# WebSocket Connection
WS /order/:orderId
```

### Dead Letter Queue
```bash
# View Failed Orders
GET /api/dlq/failed-orders

# View DLQ Statistics
GET /api/dlq/stats

# Clear All DLQ Data
DELETE /api/dlq/clear

# Clear Only Failed Jobs
DELETE /api/dlq/clear/failed
```

### Testing Endpoints
```bash
# Trigger Single DLQ Failure
POST /test/dlq

# Trigger Multiple DLQ Failures
POST /test/dlq/bulk
```

## Testing

### Order Flow Testing
Create orders using the frontend or API:
```json
{
  "tokenIn": "SOL",
  "tokenOut": "USDC",
  "amount": 1.0,
  "slippage": 1.0
}
```

### Monitoring
- Watch console logs for DEX routing decisions
- Monitor WebSocket status updates in browser
- Check order processing pipeline in real-time
- View failed orders via DLQ API endpoints

## Database Schema

### Orders Table
```sql
CREATE TABLE orders (
    id VARCHAR(255) PRIMARY KEY,
    token_in VARCHAR(255) NOT NULL,
    token_out VARCHAR(255) NOT NULL,
    amount DECIMAL(20, 8) NOT NULL,
    type VARCHAR(50) NOT NULL,
    slippage DECIMAL(5, 4) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Connections Table
```sql
CREATE TABLE connections (
    id VARCHAR(255) PRIMARY KEY,
    order_id VARCHAR(255) NOT NULL,
    connection_id VARCHAR(255) NOT NULL,
    connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    FOREIGN KEY (order_id) REFERENCES orders(id)
);
```

### Failed Orders Table (DLQ)
```sql
CREATE TABLE failed_orders (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(255) NOT NULL,
    original_order JSONB NOT NULL,
    failure_reason TEXT NOT NULL,
    attempts_made INTEGER NOT NULL,
    failed_at TIMESTAMP NOT NULL,
    last_error TEXT
);
```

## Design Patterns

### MVC Architecture
- **Models**: Data structures and business logic
- **Controllers**: Request handling and validation  
- **Services**: Business logic and external integrations
- **Repositories**: Database access layer with interfaces

### Queue Architecture
```
Order Creation → Database → WebSocket Connection → Fetch Order → Queue → Worker → DEX Router → Execution
                                                                                           ↓
                                                              WebSocket Updates ← Status Tracking
```

### Repository Pattern
```typescript
interface IRepository<T> {
  save(data: T): Promise<void>
  update(id: string, data: Partial<T>): Promise<void>
  remove(id: string): Promise<void>
  findById(id: string): Promise<T | null>
}
```

##  Monitoring & Observability

### Console Logging
- Order processing lifecycle
- DEX routing decisions
- Retry attempts and failures
- WebSocket connection events
- DLQ processing details

### Health Endpoints
- `/health` - Service health status
- `/api/dlq/failed-orders` - Failed order monitoring

## Production Considerations

### Scaling
- Redis clustering for queue distribution
- Database read replicas for query scaling
- Load balancer for multiple backend instances

### Security
- Input validation and sanitization
- Rate limiting per client
- WebSocket connection limits
- Database connection pooling

### Monitoring
- Queue metrics and alerts
- Failed order notifications
- Performance monitoring
- Error tracking and logging

## Performance Metrics

- **Throughput**: 100 orders/minute
- **Concurrency**: 10 simultaneous orders
- **Latency**: ~3-5 seconds per order (including DEX simulation)
- **Reliability**: 3 retry attempts with exponential backoff
- **Availability**: Graceful degradation with DLQ fallback

---

Built for high-performance order execution and real-time trading systems.