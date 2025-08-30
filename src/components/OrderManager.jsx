import { useState, useEffect } from 'react'
import { ShoppingCart, Clock, AlertTriangle, CheckCircle, Undo2, Play, CheckSquare } from 'lucide-react'
import { getOrdiniOggi, startOrdine, completeOrdine, updateRipassoOrdine } from '../lib/supabase'

const OrderManager = ({ currentUser }) => {
  const [ordersToday, setOrdersToday] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [updating, setUpdating] = useState({})

  useEffect(() => {
    loadTodayOrders()
    
    // Refresh orders every minute to check time limits
    const interval = setInterval(loadTodayOrders, 60000)
    return () => clearInterval(interval)
  }, [])

  const loadTodayOrders = async () => {
    try {
      const { data, error } = await getOrdiniOggi()
      if (error) throw error
      setOrdersToday(data || [])
    } catch (err) {
      console.error('Error loading orders:', err)
      setError('Errore nel caricamento ordini')
    } finally {
      setLoading(false)
    }
  }

  const handleStartOrder = async (orderId) => {
    setUpdating(prev => ({ ...prev, [orderId]: true }))
    try {
      const { data, error } = await startOrdine(orderId, currentUser.id)
      if (error) throw error
      
      setOrdersToday(prev => prev.map(order => 
        order.id === orderId ? { ...order, ...data[0] } : order
      ))
    } catch (err) {
      console.error('Error starting order:', err)
      alert('Errore nell\'avvio ordine')
    } finally {
      setUpdating(prev => ({ ...prev, [orderId]: false }))
    }
  }

  const handleCompleteOrder = async (orderId, note = null) => {
    setUpdating(prev => ({ ...prev, [orderId]: true }))
    try {
      const { data, error } = await completeOrdine(orderId, currentUser.id, note)
      if (error) throw error
      
      setOrdersToday(prev => prev.map(order => 
        order.id === orderId ? { ...order, ...data[0] } : order
      ))
    } catch (err) {
      console.error('Error completing order:', err)
      alert('Errore nel completamento ordine')
    } finally {
      setUpdating(prev => ({ ...prev, [orderId]: false }))
    }
  }

  const handleRipassoToggle = async (orderId, currentStatus) => {
    setUpdating(prev => ({ ...prev, [orderId]: true }))
    try {
      const { data, error } = await updateRipassoOrdine(orderId, !currentStatus)
      if (error) throw error
      
      setOrdersToday(prev => prev.map(order => 
        order.id === orderId ? { ...order, ...data[0] } : order
      ))
    } catch (err) {
      console.error('Error updating ripasso:', err)
      alert('Errore nell\'aggiornamento ripasso')
    } finally {
      setUpdating(prev => ({ ...prev, [orderId]: false }))
    }
  }

  const isOrderUrgent = (order) => {
    const now = new Date()
    const currentTime = now.toTimeString().split(' ')[0]
    
    // Special alert for pesce orders after 7:15
    if (order.tipo_ordine === 'pesce') {
      const [hour, minute] = currentTime.split(':').map(Number)
      if (hour > 7 || (hour === 7 && minute >= 15)) {
        return true
      }
    }
    
    // Check if past reminder time
    if (order.config?.orario_promemoria) {
      return currentTime > order.config.orario_promemoria
    }
    
    return false
  }

  const getOrderIcon = (tipoOrdine) => {
    switch (tipoOrdine) {
      case 'sala': return '🏪'
      case 'surgelati': return '🧊'  
      case 'pesce': return '🐟'
      default: return '📋'
    }
  }

  const getOrderColor = (order) => {
    if (order.stato === 'completato') return 'green'
    if (order.stato === 'in_corso') return 'orange'
    if (isOrderUrgent(order)) return 'red'
    return 'blue'
  }

  const getTimelineProgress = () => {
    const salaOrder = ordersToday.find(o => o.tipo_ordine === 'sala')
    const surgelatiOrder = ordersToday.find(o => o.tipo_ordine === 'surgelati')
    
    const steps = [
      { 
        id: 'sala-order',
        label: 'Ordine Sala',
        completed: salaOrder?.stato === 'completato',
        active: salaOrder && salaOrder.stato !== 'completato'
      },
      {
        id: 'sala-ripasso',
        label: 'Ripasso Sala', 
        completed: salaOrder?.ripasso_fatto,
        active: salaOrder?.stato === 'completato' && !salaOrder?.ripasso_fatto,
        show: salaOrder?.stato === 'completato'
      },
      {
        id: 'surgelati-ripasso',
        label: 'Ripasso Surgelati',
        completed: surgelatiOrder?.ripasso_fatto,
        active: salaOrder?.ripasso_fatto && surgelatiOrder && !surgelatiOrder.ripasso_fatto,
        show: salaOrder?.ripasso_fatto || surgelatiOrder
      },
      {
        id: 'surgelati-order',
        label: 'Ordine Surgelati',
        completed: surgelatiOrder?.stato === 'completato',
        active: salaOrder?.ripasso_fatto && surgelatiOrder && surgelatiOrder.stato !== 'completato',
        show: surgelatiOrder
      }
    ]
    
    return steps.filter(step => step.show !== false)
  }

  if (loading) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-600">Caricamento ordini...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-6">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <span className="text-red-800">{error}</span>
        </div>
      </div>
    )
  }

  if (ordersToday.length === 0) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <div className="text-center">
          <ShoppingCart className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">Nessun ordine previsto per oggi</p>
        </div>
      </div>
    )
  }

  const urgentOrders = ordersToday.filter(isOrderUrgent)
  const timelineSteps = getTimelineProgress()

  return (
    <div className="mb-6 space-y-4">
      {/* Urgent Fish Order Alert */}
      {urgentOrders.some(o => o.tipo_ordine === 'pesce') && (
        <div className="bg-red-100 border-2 border-red-500 p-4 rounded-lg animate-pulse">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-6 h-6 text-red-600 animate-bounce" />
            <div>
              <h3 className="font-bold text-red-800">⚠️ ORDINE PESCE IN RITARDO!</h3>
              <p className="text-sm text-red-700">Ordine pesce doveva essere fatto entro le 7:30!</p>
            </div>
          </div>
        </div>
      )}

      {/* Order Timeline */}
      {timelineSteps.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Timeline Ordini
          </h3>
          <div className="space-y-2">
            {timelineSteps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  step.completed 
                    ? 'bg-green-500 text-white' 
                    : step.active 
                    ? 'bg-blue-500 text-white animate-pulse'
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  {step.completed ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <span className="text-sm font-bold">{index + 1}</span>
                  )}
                </div>
                <div className={`ml-3 ${step.active ? 'font-semibold' : ''}`}>
                  <span className={step.completed ? 'text-green-700' : step.active ? 'text-blue-700' : 'text-gray-600'}>
                    {step.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Today's Orders */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900 flex items-center">
            <ShoppingCart className="w-5 h-5 mr-2" />
            Ordini di Oggi ({ordersToday.length})
          </h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {ordersToday.map((order) => {
            const color = getOrderColor(order)
            const urgent = isOrderUrgent(order)
            const isUpdatingOrder = updating[order.id]
            
            return (
              <div key={order.id} className={`p-4 ${urgent ? 'bg-red-50' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-2xl">{getOrderIcon(order.tipo_ordine)}</span>
                      <div>
                        <h4 className="font-semibold text-gray-900 capitalize">
                          Ordine {order.tipo_ordine}
                        </h4>
                        {order.config?.orario_limite && (
                          <p className="text-sm text-gray-600">
                            Entro le {order.config.orario_limite}
                          </p>
                        )}
                      </div>
                      {urgent && (
                        <AlertTriangle className="w-5 h-5 text-red-600 animate-pulse" />
                      )}
                    </div>
                    
                    <div className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                      color === 'green' ? 'bg-green-100 text-green-800' :
                      color === 'orange' ? 'bg-orange-100 text-orange-800' :
                      color === 'red' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {order.stato === 'completato' ? '✅ Completato' :
                       order.stato === 'in_corso' ? '⏳ In corso' :
                       urgent ? '🚨 Urgente' : '⏰ Da fare'}
                    </div>

                    {order.ora_completamento && (
                      <p className="text-sm text-gray-600 mt-1">
                        Completato alle {new Date(order.ora_completamento).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex flex-col space-y-2 ml-4">
                    {order.stato === 'da_fare' && (
                      <button
                        onClick={() => handleStartOrder(order.id)}
                        disabled={isUpdatingOrder}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-1"
                      >
                        {isUpdatingOrder ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                        <span>Inizia</span>
                      </button>
                    )}
                    
                    {order.stato === 'in_corso' && (
                      <button
                        onClick={() => handleCompleteOrder(order.id)}
                        disabled={isUpdatingOrder}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center space-x-1"
                      >
                        {isUpdatingOrder ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <CheckSquare className="w-4 h-4" />
                        )}
                        <span>Completa</span>
                      </button>
                    )}

                    {order.stato === 'completato' && order.tipo_ordine === 'sala' && (
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-2">Fare ripasso?</p>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleRipassoToggle(order.id, order.ripasso_fatto)}
                            disabled={isUpdatingOrder}
                            className={`px-2 py-1 text-xs rounded ${
                              order.ripasso_fatto 
                                ? 'bg-green-100 text-green-800 border border-green-300'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            } transition-colors disabled:opacity-50`}
                          >
                            {order.ripasso_fatto ? '✅ Fatto' : 'Sì'}
                          </button>
                          {!order.ripasso_fatto && (
                            <button className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                              No
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {order.stato === 'completato' && order.tipo_ordine === 'surgelati' && (
                      <button
                        onClick={() => handleRipassoToggle(order.id, order.ripasso_fatto)}
                        disabled={isUpdatingOrder}
                        className={`px-3 py-1 text-sm rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-1 ${
                          order.ripasso_fatto
                            ? 'bg-green-100 text-green-800 border border-green-300'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {isUpdatingOrder ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Undo2 className="w-4 h-4" />
                        )}
                        <span>{order.ripasso_fatto ? '✅ Ripasso fatto' : 'Ripasso'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default OrderManager