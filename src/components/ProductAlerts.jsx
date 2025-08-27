import { useState, useEffect } from 'react'
import { Plus, AlertTriangle, Calendar, Package, Trash2, CheckCircle } from 'lucide-react'
import { getProductAlerts, createProductAlert, createTask } from '../lib/supabase'

const ProductAlerts = ({ currentUser }) => {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newAlert, setNewAlert] = useState({
    nome_prodotto: '',
    data_scadenza: '',
    reparto: currentUser.reparto || '',
    giorni_preavviso: 3
  })

  const reparti = [
    { value: 'ortofrutta', label: 'Ortofrutta', icon: '🥬' },
    { value: 'macelleria', label: 'Macelleria', icon: '🥩' },
    { value: 'gastronomia', label: 'Gastronomia', icon: '🍝' },
    { value: 'panetteria', label: 'Panetteria', icon: '🥖' },
    { value: 'magazzino', label: 'Magazzino', icon: '📦' },
    { value: 'casse', label: 'Casse', icon: '💰' }
  ]

  useEffect(() => {
    loadAlerts()
  }, [])

  const loadAlerts = async () => {
    try {
      setLoading(true)
      const { data, error } = await getProductAlerts()
      
      if (error) throw error

      setAlerts(data || [])
    } catch (error) {
      console.error('Error loading product alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddAlert = async (e) => {
    e.preventDefault()
    
    try {
      const { data, error } = await createProductAlert(newAlert)
      
      if (error) throw error

      if (data && data[0]) {
        setAlerts(prev => [data[0], ...prev])
        setNewAlert({
          nome_prodotto: '',
          data_scadenza: '',
          reparto: currentUser.reparto || '',
          giorni_preavviso: 3
        })
        setShowAddModal(false)

        // Haptic feedback
        if (navigator.vibrate) {
          navigator.vibrate([100, 50, 100])
        }
      }
    } catch (error) {
      console.error('Error adding alert:', error)
    }
  }

  const generateTaskFromAlert = async (alert) => {
    try {
      const taskData = {
        titolo: `⚠️ Controllo scadenza: ${alert.nome_prodotto}`,
        descrizione: `Verificare e gestire il prodotto "${alert.nome_prodotto}" in scadenza il ${formatDate(alert.data_scadenza)}`,
        priorita: 5, // High priority for expiring products
        tempo_stimato: 15,
        reparto: alert.reparto,
        fascia_oraria: 'mattina',
        stato: 'da_fare',
        creato_da: currentUser.id,
        data_scadenza: alert.data_scadenza
      }

      const { data, error } = await createTask(taskData)
      
      if (error) throw error

      // Update alert to mark task as generated
      // This would require an update to the alert record
      
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100])
      }

      alert(`Task creato per il prodotto "${alert.nome_prodotto}"`)
    } catch (error) {
      console.error('Error generating task:', error)
    }
  }

  const getAlertPriority = (alert) => {
    const today = new Date()
    const expiryDate = new Date(alert.data_scadenza)
    const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24))

    if (daysUntilExpiry < 0) {
      return { level: 'expired', color: 'bg-red-100 border-red-500 text-red-800', priority: '🔴 Scaduto' }
    } else if (daysUntilExpiry <= 1) {
      return { level: 'critical', color: 'bg-red-50 border-red-400 text-red-700', priority: '🔴 Critico' }
    } else if (daysUntilExpiry <= 3) {
      return { level: 'high', color: 'bg-orange-50 border-orange-400 text-orange-700', priority: '🟠 Alto' }
    } else if (daysUntilExpiry <= 7) {
      return { level: 'medium', color: 'bg-yellow-50 border-yellow-400 text-yellow-700', priority: '🟡 Medio' }
    } else {
      return { level: 'low', color: 'bg-green-50 border-green-400 text-green-700', priority: '🟢 Basso' }
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const getDaysUntilExpiry = (dateString) => {
    const today = new Date()
    const expiryDate = new Date(dateString)
    const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24))
    
    if (daysUntilExpiry < 0) {
      return `Scaduto ${Math.abs(daysUntilExpiry)} giorni fa`
    } else if (daysUntilExpiry === 0) {
      return 'Scade oggi'
    } else if (daysUntilExpiry === 1) {
      return 'Scade domani'
    } else {
      return `Scade tra ${daysUntilExpiry} giorni`
    }
  }

  const getDepartmentInfo = (reparto) => {
    return reparti.find(r => r.value === reparto) || { value: reparto, label: reparto, icon: '📝' }
  }

  const sortedAlerts = alerts.sort((a, b) => {
    const aPriority = getAlertPriority(a).level
    const bPriority = getAlertPriority(b).level
    const priorityOrder = ['expired', 'critical', 'high', 'medium', 'low']
    return priorityOrder.indexOf(aPriority) - priorityOrder.indexOf(bPriority)
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-eurospin-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Caricamento avvisi prodotti...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-lg mx-auto p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Avvisi Prodotti</h1>
              <p className="text-sm text-gray-600">
                Monitoraggio scadenze prodotti
              </p>
            </div>
            
            <button
              onClick={() => setShowAddModal(true)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Summary Stats */}
          {alerts.length > 0 && (
            <div className="mt-4 grid grid-cols-4 gap-2">
              {['expired', 'critical', 'high', 'medium'].map((level) => {
                const count = alerts.filter(alert => getAlertPriority(alert).level === level).length
                const colors = {
                  expired: { bg: 'bg-red-100', text: 'text-red-800', label: 'Scaduti' },
                  critical: { bg: 'bg-red-50', text: 'text-red-700', label: 'Critici' },
                  high: { bg: 'bg-orange-50', text: 'text-orange-700', label: 'Alti' },
                  medium: { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'Medi' }
                }
                const colorInfo = colors[level]
                
                return (
                  <div key={level} className={`text-center p-2 rounded-lg ${colorInfo.bg}`}>
                    <div className={`text-sm font-bold ${colorInfo.text}`}>{count}</div>
                    <div className={`text-xs ${colorInfo.text}`}>{colorInfo.label}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto p-4">
        {sortedAlerts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nessun avviso prodotto
            </h3>
            <p className="text-gray-600 mb-6">
              Aggiungi prodotti da monitorare per ricevere avvisi di scadenza
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Aggiungi Prodotto
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedAlerts.map((alert) => {
              const priority = getAlertPriority(alert)
              const departmentInfo = getDepartmentInfo(alert.reparto)
              const daysInfo = getDaysUntilExpiry(alert.data_scadenza)

              return (
                <div
                  key={alert.id}
                  className={`card border-l-4 ${priority.color}`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{departmentInfo.icon}</span>
                      <div>
                        <span className="text-sm font-medium text-gray-600">
                          {departmentInfo.label}
                        </span>
                        <div className="text-xs text-gray-500">
                          {priority.priority}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => generateTaskFromAlert(alert)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                        title="Genera task"
                      >
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </button>
                    </div>
                  </div>

                  {/* Product Name */}
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {alert.nome_prodotto}
                  </h3>

                  {/* Expiry Info */}
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(alert.data_scadenza)}</span>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${priority.color.split(' ')[2]}`}>
                      {daysInfo}
                    </span>
                    
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <Package className="w-4 h-4" />
                      <span>Preavviso {alert.giorni_preavviso} giorni</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            💡 Come funzionano gli avvisi
          </h4>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Gli avvisi vengono ordinati per priorità (scaduti, critici, ecc.)</li>
            <li>• Puoi generare automaticamente task per gestire prodotti in scadenza</li>
            <li>• I colori indicano l'urgenza: rosso (scaduto/critico), arancione (alto), giallo (medio)</li>
            <li>• I task generati includeranno automaticamente tutte le info necessarie</li>
          </ul>
        </div>
      </div>

      {/* Add Alert Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center sm:justify-center">
          <div className="bg-white w-full max-w-lg mx-auto rounded-t-2xl sm:rounded-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Nuovo Avviso Prodotto
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddAlert} className="flex-1 p-4 space-y-4">
              <div>
                <label htmlFor="nome_prodotto" className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Prodotto *
                </label>
                <input
                  type="text"
                  id="nome_prodotto"
                  required
                  value={newAlert.nome_prodotto}
                  onChange={(e) => setNewAlert(prev => ({ ...prev, nome_prodotto: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-eurospin-blue"
                  placeholder="es. Mozzarella di Bufala"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="data_scadenza" className="block text-sm font-medium text-gray-700 mb-1">
                    Data Scadenza *
                  </label>
                  <input
                    type="date"
                    id="data_scadenza"
                    required
                    value={newAlert.data_scadenza}
                    onChange={(e) => setNewAlert(prev => ({ ...prev, data_scadenza: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-eurospin-blue"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div>
                  <label htmlFor="giorni_preavviso" className="block text-sm font-medium text-gray-700 mb-1">
                    Preavviso (giorni)
                  </label>
                  <select
                    id="giorni_preavviso"
                    value={newAlert.giorni_preavviso}
                    onChange={(e) => setNewAlert(prev => ({ ...prev, giorni_preavviso: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-eurospin-blue"
                  >
                    <option value={1}>1 giorno</option>
                    <option value={2}>2 giorni</option>
                    <option value={3}>3 giorni</option>
                    <option value={5}>5 giorni</option>
                    <option value={7}>7 giorni</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="reparto" className="block text-sm font-medium text-gray-700 mb-1">
                  Reparto *
                </label>
                <select
                  id="reparto"
                  required
                  value={newAlert.reparto}
                  onChange={(e) => setNewAlert(prev => ({ ...prev, reparto: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-eurospin-blue"
                >
                  <option value="">Seleziona reparto</option>
                  {reparti.map((reparto) => (
                    <option key={reparto.value} value={reparto.value}>
                      {reparto.icon} {reparto.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 btn btn-secondary"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="flex-1 btn btn-primary"
                >
                  Aggiungi Avviso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductAlerts