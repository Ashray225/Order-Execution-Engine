import React, { useState } from 'react'

interface SidePanelProps {
  onCreateOrder: (orderData: any) => void
}

const SidePanel: React.FC<SidePanelProps> = ({ onCreateOrder }) => {
  const [formData, setFormData] = useState({
    tokenIn: 'SOL',
    tokenOut: 'USDC',
    amount: 1.0,
    slippage: 1.0
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onCreateOrder(formData)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' || name === 'slippage' ? parseFloat(value) : value
    }))
  }

  return (
    <div className="side-panel">
      <div className="panel-section">
        <h3>Create Order</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Token In:</label>
            <select 
              name="tokenIn" 
              value={formData.tokenIn} 
              onChange={handleInputChange}
            >
              <option value="SOL">SOL</option>
              <option value="USDC">USDC</option>
              <option value="USDT">USDT</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Token Out:</label>
            <select 
              name="tokenOut" 
              value={formData.tokenOut} 
              onChange={handleInputChange}
            >
              <option value="USDC">USDC</option>
              <option value="SOL">SOL</option>
              <option value="USDT">USDT</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Amount:</label>
            <input 
              type="number" 
              name="amount"
              step="0.01" 
              min="0.01" 
              value={formData.amount}
              onChange={handleInputChange}
              required 
            />
          </div>
          
          <div className="form-group">
            <label>Slippage (%):</label>
            <input 
              type="number" 
              name="slippage"
              step="0.01" 
              min="0.01" 
              max="10" 
              value={formData.slippage}
              onChange={handleInputChange}
            />
          </div>
          
          <button type="submit">
            Execute Order
          </button>
        </form>
      </div>
      

    </div>
  )
}

export default SidePanel