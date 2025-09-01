import React, { useState, useEffect } from 'react'
import { Plus, Minus, Edit3, Camera, AlertTriangle, TrendingUp, TrendingDown, History, Package2 } from 'lucide-react'
import { updateInventory, getStockMovements, createStockMovement } from '../lib/supabase'

const StockCard = ({ product, currentUser, onStockUpdate, alerts = [] }) => {
  const [quantity, setQuantity] = useState(product.quantita || 0)
  const [isEditing, setIsEditing] = useState(false)
  const [customInput, setCustomInput] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(false)
  const [sparklineData, setSparklineData] = useState([])

  useEffect(() => {
    setQuantity(product.quantita || 0)
    loadSparklineData()
  }, [product])

  const loadSparklineData = async () => {
    try {
      const { data, error } = await getStockMovements(product.id, { limit: 7, days: 7 })
      if (error) throw error
      
      // Create sparkline data from movements
      const dailyQuantities = []
      let currentQty = quantity
      
      // Go back 7 days and calculate quantity at each day
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dayStart = new Date(date.setHours(0, 0, 0, 0))
        const dayEnd = new Date(date.setHours(23, 59, 59, 999))
        
        const dayMovements = data?.filter(m => {
          const movementDate = new Date(m.created_at)
          return movementDate >= dayStart && movementDate <= dayEnd
        }) || []
        
        if (dayMovements.length > 0) {
          // Get the last movement of the day
          const lastMovement = dayMovements[dayMovements.length - 1]
          dailyQuantities.push(lastMovement.quantita_finale)
        } else {
          // Use previous day's quantity
          dailyQuantities.push(dailyQuantities[dailyQuantities.length - 1] || currentQty)
        }
      }
      
      setSparklineData(dailyQuantities)
    } catch (error) {
      console.error('Error loading sparkline data:', error)
    }
  }

  const loadMovements = async () => {
    try {
      setLoading(true)
      const { data, error } = await getStockMovements(product.id, { limit: 10 })
      if (error) throw error
      setMovements(data || [])
    } catch (error) {
      console.error('Error loading movements:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStockStatus = () => {
    if (quantity === 0) return { status: 'zero', color: 'bg-red-100 text-red-800', text: 'Esaurito' }
    if (quantity <= product.soglia_critica) return { status: 'critical', color: 'bg-red-100 text-red-800', text: 'Critico' }
    if (quantity <= product.soglia_minima) return { status: 'low', color: 'bg-yellow-100 text-yellow-800', text: 'Basso' }
    return { status: 'ok', color: 'bg-green-100 text-green-800', text: 'OK' }
  }

  const getQuantityBarWidth = () => {
    if (product.soglia_minima === 0) return 100
    const percentage = Math.min((quantity / (product.soglia_minima * 2)) * 100, 100)
    return Math.max(percentage, 2) // Minimum 2% for visibility
  }

  const getQuantityBarColor = () => {
    const status = getStockStatus()
    switch (status.status) {
      case 'zero': return 'bg-red-500'
      case 'critical': return 'bg-red-400'
      case 'low': return 'bg-yellow-400'
      default: return 'bg-green-400'
    }
  }

  const handleQuickAdjustment = async (adjustment) => {
    const newQuantity = Math.max(0, quantity + adjustment)
    await updateStock(newQuantity, adjustment > 0 ? 'carico' : 'scarico', `Aggiustamento rapido ${adjustment > 0 ? '+' : ''}${adjustment}`)
  }

  const handleCustomInput = async () => {
    const newQuantity = parseInt(customInput)
    if (isNaN(newQuantity) || newQuantity < 0) return
    
    const adjustment = newQuantity - quantity
    await updateStock(newQuantity, adjustment > 0 ? 'carico' : 'rettifica', `Modifica manuale: ${quantity} → ${newQuantity}`)
    setIsEditing(false)
    setCustomInput('')
  }

  const updateStock = async (newQuantity, tipo, note = '') => {
    try {
      setLoading(true)
      
      // Create stock movement
      const movementData = {
        product_id: product.id,
        tipo: tipo,
        quantita_precedente: quantity,
        quantita: newQuantity - quantity,
        quantita_finale: newQuantity,
        note: note,
        created_by: currentUser.id
      }
      
      const { error } = await createStockMovement(movementData)
      if (error) throw error
      
      setQuantity(newQuantity)
      onStockUpdate(product.id, newQuantity)
      
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
      
      loadSparklineData()
    } catch (error) {
      console.error('Error updating stock:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getMovementIcon = (tipo) => {
    switch (tipo) {
      case 'carico': return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'scarico': return <TrendingDown className="w-4 h-4 text-red-600" />
      case 'vendita': return <TrendingDown className="w-4 h-4 text-blue-600" />
      case 'rettifica': return <Edit3 className="w-4 h-4 text-orange-600" />
      case 'ripasso': return <Camera className="w-4 h-4 text-purple-600" />
      default: return <History className="w-4 h-4 text-gray-600" />
    }
  }

  const renderSparkline = () => {
    if (sparklineData.length < 2) return null
    
    const max = Math.max(...sparklineData)
    const min = Math.min(...sparklineData)
    const range = max - min || 1
    
    const points = sparklineData.map((value, index) => {
      const x = (index / (sparklineData.length - 1)) * 100
      const y = 100 - ((value - min) / range) * 100
      return `${x},${y}`
    }).join(' ')
    
    const trend = sparklineData[sparklineData.length - 1] > sparklineData[0] ? 'up' : 'down'
    const trendColor = trend === 'up' ? 'text-green-600' : 'text-red-600'
    
    return (
      <div className="flex items-center gap-2">
        <svg viewBox="0 0 100 100" className="w-12 h-6 opacity-75">
          <polyline
            fill="none"
            stroke={trend === 'up' ? '#059669' : '#DC2626'}
            strokeWidth="3"
            points={points}
          />
        </svg>
        {trend === 'up' ? 
          <TrendingUp className={`w-3 h-3 ${trendColor}`} /> : 
          <TrendingDown className={`w-3 h-3 ${trendColor}`} />
        }
      </div>
    )
  }

  const status = getStockStatus()
  const hasAlerts = alerts.length > 0

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${hasAlerts ? 'border-red-200' : 'border-gray-200'} overflow-hidden`}>
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 line-clamp-1">{product.nome}</h3>
              {product.photo_url && (
                <Camera className="w-4 h-4 text-[#0066CC]" />
              )}
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              {product.codice && <span>#{product.codice}</span>}
              {product.categoria && <span>• {product.categoria}</span>}
              {product.unita_misura && <span>• {product.unita_misura}</span>}
            </div>
            {product.codice_ean && (
              <div className="text-xs text-gray-500 mt-1">EAN: {product.codice_ean}</div>
            )}
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
              {status.text}
            </div>
            {renderSparkline()}
          </div>
        </div>

        {/* Alerts */}
        {hasAlerts && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-800 font-medium">
                {alerts.length} alert{alerts.length !== 1 ? 'i' : 'a'} attiv{alerts.length !== 1 ? 'i' : 'a'}
              </span>
            </div>
          </div>
        )}

        {/* Quantity Display */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Quantità attuale</span>
            <span className="text-sm text-gray-500">
              Min: {product.soglia_minima} {product.unita_misura}
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="text-2xl font-bold text-gray-900">
                {quantity} <span className="text-sm text-gray-500">{product.unita_misura}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className={`h-2 rounded-full transition-all ${getQuantityBarColor()}`}
                  style={{ width: `${getQuantityBarWidth()}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          <div className="text-xs text-gray-500 mt-1">
            Aggiornato: {formatDate(product.updated_at || product.created_at)}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => handleQuickAdjustment(-10)}
            disabled={loading}
            className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors disabled:opacity-50"
          >
            -10
          </button>
          <button
            onClick={() => handleQuickAdjustment(-1)}
            disabled={loading}
            className="p-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
          >
            <Minus className="w-4 h-4" />
          </button>
          
          {isEditing ? (
            <div className="flex-1 flex gap-2">
              <input
                type="number"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder={quantity.toString()}
                className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-[#0066CC] focus:border-transparent"
                autoFocus
              />
              <button
                onClick={handleCustomInput}
                disabled={loading}
                className="px-3 py-1 bg-[#0066CC] text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                OK
              </button>
              <button
                onClick={() => {
                  setIsEditing(false)
                  setCustomInput('')
                }}
                className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              disabled={loading}
              className="flex-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
            >
              <Edit3 className="w-3 h-3" />
              Modifica
            </button>
          )}
          
          <button
            onClick={() => handleQuickAdjustment(1)}
            disabled={loading}
            className="p-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleQuickAdjustment(10)}
            disabled={loading}
            className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors disabled:opacity-50"
          >
            +10
          </button>
        </div>

        {/* History Toggle */}
        <button
          onClick={() => {
            setShowHistory(!showHistory)
            if (!showHistory && movements.length === 0) {
              loadMovements()
            }
          }}
          className="w-full py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors flex items-center justify-center gap-1"
        >
          <History className="w-4 h-4" />
          {showHistory ? 'Nascondi storico' : 'Mostra storico'}
        </button>
      </div>

      {/* Movement History */}
      {showHistory && (
        <div className="border-t border-gray-100 bg-gray-50">
          <div className="p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Ultimi movimenti</h4>
            {loading ? (
              <div className="text-center py-4">
                <div className="w-4 h-4 border-2 border-[#0066CC] border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : movements.length > 0 ? (
              <div className="space-y-2">
                {movements.map((movement) => (
                  <div key={movement.id} className="flex items-center justify-between py-2 px-3 bg-white rounded-lg">
                    <div className="flex items-center gap-2">
                      {getMovementIcon(movement.tipo)}
                      <div>
                        <div className="text-sm font-medium text-gray-900 capitalize">
                          {movement.tipo.replace('_', ' ')}
                        </div>
                        <div className="text-xs text-gray-600">
                          {formatDate(movement.created_at)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${
                        movement.quantita > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {movement.quantita > 0 ? '+' : ''}{movement.quantita}
                      </div>
                      <div className="text-xs text-gray-500">
                        = {movement.quantita_finale} {product.unita_misura}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500 text-sm">
                Nessun movimento registrato
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default StockCard