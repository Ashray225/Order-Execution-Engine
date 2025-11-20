-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(255) PRIMARY KEY,
    token_in VARCHAR(255) NOT NULL,
    token_out VARCHAR(255) NOT NULL,
    amount DECIMAL(20, 8) NOT NULL,
    type VARCHAR(50) NOT NULL,
    slippage DECIMAL(5, 4) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create connections table
CREATE TABLE IF NOT EXISTS connections (
    id VARCHAR(255) PRIMARY KEY,
    order_id VARCHAR(255) NOT NULL,
    connection_id VARCHAR(255) NOT NULL,
    connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    disconnected_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- Create failed_orders table for Dead Letter Queue
CREATE TABLE IF NOT EXISTS failed_orders (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(255) NOT NULL,
    original_order JSONB NOT NULL,
    failure_reason TEXT NOT NULL,
    attempts_made INTEGER NOT NULL,
    failed_at TIMESTAMP NOT NULL,
    last_error TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);