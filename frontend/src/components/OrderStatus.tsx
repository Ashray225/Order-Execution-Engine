import React from 'react'

interface Order {
  id: string
  tokenIn: string
  tokenOut: string
  amount: number
  slippage: number
  status: string
  messages: string[]
  txHash?: string
  executedPrice?: number
  dex?: string
  timestamp: string
}

interface OrderStatusProps {
  orders: Order[]
}

const OrderStatus: React.FC<OrderStatusProps> = ({ orders }) => {
  const getStatusClass = (status: string) => {
    return `order-status status-${status.toLowerCase()}`
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  return (
    <div className="content-area">
      <div className="orders-section">
        <h3>Order Status ({orders.length})</h3>
        
        <div id="ordersContainer">
          {orders.length === 0 ? (
            <div className="no-orders">
              No orders yet. Create an order to see real-time updates.
            </div>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="order-card">
                <div className="order-header">
                  <div className="order-id">
                    Order ID: {order.id.substring(0, 8)}...
                  </div>
                  <div className={getStatusClass(order.status)}>
                    {order.status}
                  </div>
                </div>
                
                <div className="order-details">
                  <div className="order-detail">
                    <span>Pair:</span>
                    <strong>{order.tokenIn} → {order.tokenOut}</strong>
                  </div>
                  <div className="order-detail">
                    <span>Amount:</span>
                    <strong>{order.amount} {order.tokenIn}</strong>
                  </div>
                  <div className="order-detail">
                    <span>Slippage:</span>
                    <strong>{order.slippage}%</strong>
                  </div>
                  <div className="order-detail">
                    <span>Time:</span>
                    <strong>{formatTimestamp(order.timestamp)}</strong>
                  </div>
                  {order.dex && (
                    <div className="order-detail">
                      <span>DEX:</span>
                      <strong>{order.dex}</strong>
                    </div>
                  )}
                  {order.executedPrice && (
                    <div className="order-detail">
                      <span>Executed Price:</span>
                      <strong>{order.executedPrice.toFixed(4)}</strong>
                    </div>
                  )}
                </div>
                
                {order.messages.length > 0 && (
                  <div className="order-messages">
                    {order.messages.map((message, index) => (
                      <div key={index} className="order-message">
                        {message}
                      </div>
                    ))}
                  </div>
                )}
                
                {order.txHash && (
                  <div className="tx-hash">
                    TX: {order.txHash}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default OrderStatus