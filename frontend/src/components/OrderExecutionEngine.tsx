import React, { useState, useEffect } from 'react'
import SidePanel from './SidePanel'
import OrderStatus from './OrderStatus'

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

const OrderExecutionEngine: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([])



  const updateOrderStatus = (statusData: any) => {
    setOrders(prevOrders => {
      const existingOrderIndex = prevOrders.findIndex(order => order.id === statusData.orderId)
      
      if (existingOrderIndex >= 0) {
        const updatedOrders = [...prevOrders]
        const existingOrder = updatedOrders[existingOrderIndex]
        
        updatedOrders[existingOrderIndex] = {
          ...existingOrder,
          status: statusData.status,
          messages: [...existingOrder.messages, statusData.message || `Status: ${statusData.status}`],
          txHash: statusData.txHash || existingOrder.txHash,
          executedPrice: statusData.executedPrice || existingOrder.executedPrice,
          dex: statusData.dex || existingOrder.dex
        }
        
        return updatedOrders
      }
      
      return prevOrders
    })
  }

  const createOrder = async (orderData: any) => {
    try {
      // Step 1: Create order first (saves to database)
      const response = await fetch(`${import.meta.env.VITE_API_URL}/order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      })

      const result = await response.json()
      
      if (response.ok) {
        const newOrder: Order = {
          id: result.orderId,
          tokenIn: orderData.tokenIn,
          tokenOut: orderData.tokenOut,
          amount: orderData.amount,
          slippage: orderData.slippage,
          status: 'pending',
          messages: ['Order created, connecting...'],
          timestamp: new Date().toISOString()
        }
        
        setOrders(prevOrders => [newOrder, ...prevOrders])
        
        // Step 2: Connect WebSocket with orderId to start processing
        const websocket = new WebSocket(`${import.meta.env.VITE_WS_URL}/order/${result.orderId}`)
        
        websocket.onopen = () => {
          console.log(`WebSocket connected for order: ${result.orderId}`)
        }

        websocket.onmessage = (event) => {
          const data = JSON.parse(event.data)
          
          if (data.type === 'connection') {
            console.log('Order processing started:', data.message)
          } else if (data.type === 'status') {
            updateOrderStatus(data)
          } else if (data.type === 'error') {
            console.error('WebSocket error:', data.message)
          }
        }

        websocket.onclose = () => {
          console.log(`WebSocket closed for order: ${result.orderId}`)
        }

        websocket.onerror = (error) => {
          console.error('WebSocket error:', error)
        }
        
      } else {
        alert(`Error: ${result.message}`)
      }
    } catch (error) {
      console.error('Error creating order:', error)
      alert('Failed to create order')
    }
  }

  return (
    <div className="container">
      <header>
        <h1>Order Execution Engine</h1>
        <p>Real-time DEX routing and order execution</p>
      </header>
      
      <div className="main-content">
        <SidePanel onCreateOrder={createOrder} />
        <OrderStatus orders={orders} />
      </div>
    </div>
  )
}

export default OrderExecutionEngine