import React, { useState, useEffect } from 'react'
import { Search, Filter, RefreshCw, AlertTriangle, Package, TrendingDown, TrendingUp, Plus, BarChart3 } from 'lucide-react'
import { getInventoryByDepartment, getInventoryAlerts, getInventorySummary, searchProducts } from '../lib/supabase'
import StockCard from './StockCard'

const InventoryManager = ({ currentUser }) => {
  const [inventory, setInventory] = useState([])
  const [filteredInventory, setFilteredInventory] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedReparto, setSelectedReparto] = useState(currentUser?.reparto || 'all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [alerts, setAlerts] = useState([])
  const [summary, setSummary] = useState(null)
  const [showFilters, setShowFilters] = useState(false)

  const reparti = [
    { value: 'all', label: 'Tutti i reparti', icon: '🏪' },
    { value: 'ortofrutta', label: 'Ortofrutta', icon: '🥬' },
    { value: 'macelleria', label: 'Macelleria', icon: '🥩' },
    { value: 'gastronomia', label: 'Gastronomia', icon: '🍝' },
    { value: 'panetteria', label: 'Panetteria', icon: '🥖' },
    { value: 'magazzino', label: 'Magazzino', icon: '📦' },
    { value: 'casse', label: 'Casse', icon: '💰' }
  ]

  const statusFilters = [
    { value: 'all', label: 'Tutti', color: 'gray' },
    { value: 'ok', label: 'OK', color: 'green' },
    { value: 'low', label: 'Basso', color: 'yellow' },
    { value: 'critical', label: 'Critico', color: 'red' },
    { value: 'zero', label: 'Esaurito', color: 'red' }
  ]

  useEffect(() => {
    loadInventoryData()
    loadAlerts()
    loadSummary()
  }, [selectedReparto])

  useEffect(() => {
    applyFilters()
  }, [inventory, searchTerm, selectedStatus])

  const loadInventoryData = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      const filters = {}
      if (selectedReparto !== 'all') {
        filters.reparto = selectedReparto
      }

      const { data, error } = await getInventoryByDepartment(filters)
      
      if (error) throw error
      setInventory(data || [])
    } catch (error) {
      console.error('Error loading inventory:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const loadAlerts = async () => {
    try {
      const { data, error } = await getInventoryAlerts()
      if (error) throw error
      setAlerts(data || [])
    } catch (error) {
      console.error('Error loading alerts:', error)
    }
  }

  const loadSummary = async () => {
    try {
      const { data, error } = await getInventorySummary()
      if (error) throw error
      setSummary(data || [])
    } catch (error) {
      console.error('Error loading summary:', error)
    }
  }

  const applyFilters = () => {
    let filtered = inventory

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.codice?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.codice_ean?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(item => {
        const status = getStockStatus(item)
        return status === selectedStatus
      })
    }

    setFilteredInventory(filtered)
  }

  const getStockStatus = (item) => {
    if (item.quantita === 0) return 'zero'
    if (item.quantita <= item.soglia_critica) return 'critical'
    if (item.quantita <= item.soglia_minima) return 'low'
    return 'ok'
  }

  const getStockStatusColor = (status) => {
    switch (status) {
      case 'zero': return 'bg-red-100 text-red-800'
      case 'critical': return 'bg-red-100 text-red-800'
      case 'low': return 'bg-yellow-100 text-yellow-800'
      case 'ok': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStockStatusText = (status) => {
    switch (status) {
      case 'zero': return 'Esaurito'
      case 'critical': return 'Critico'
      case 'low': return 'Basso'
      case 'ok': return 'OK'
      default: return 'Sconosciuto'
    }
  }

  const handleRefresh = () => {
    if (navigator.vibrate) {
      navigator.vibrate(50)
    }
    loadInventoryData(true)
    loadAlerts()
    loadSummary()
  }

  const handleStockUpdate = (productId, newQuantity) => {
    setInventory(prev => prev.map(item => 
      item.id === productId ? { ...item, quantita: newQuantity } : item
    ))
  }

  const getSummaryByReparto = (reparto) => {
    return summary?.find(s => s.reparto === reparto) || {
      total_products: 0,
      zero_stock: 0,
      critical_stock: 0,
      low_stock: 0,
      ok_stock: 0,
      valore_inventario: 0
    }
  }

  const getCurrentRepartoSummary = () => {
    if (selectedReparto === 'all') {
      return summary?.reduce((acc, s) => ({
        total_products: acc.total_products + s.total_products,
        zero_stock: acc.zero_stock + s.zero_stock,
        critical_stock: acc.critical_stock + s.critical_stock,
        low_stock: acc.low_stock + s.low_stock,
        ok_stock: acc.ok_stock + s.ok_stock,
        valore_inventario: acc.valore_inventario + s.valore_inventario
      }), {
        total_products: 0,
        zero_stock: 0,
        critical_stock: 0,
        low_stock: 0,
        ok_stock: 0,
        valore_inventario: 0
      }) || {}
    }
    return getSummaryByReparto(selectedReparto)
  }

  const currentSummary = getCurrentRepartoSummary()
  const unreadAlerts = alerts.filter(alert => !alert.is_read).length

  if (loading && !refreshing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Caricamento inventario...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Package className="w-6 h-6 text-[#0066CC]" />
                Inventario
              </h1>
              <p className="text-sm text-gray-600">
                Gestione rimanenze {selectedReparto !== 'all' ? reparti.find(r => r.value === selectedReparto)?.label : 'tutti i reparti'}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {unreadAlerts > 0 && (
                <div className="bg-red-500 text-white text-xs rounded-full px-2 py-1 font-medium">
                  {unreadAlerts} alert{unreadAlerts !== 1 ? 'i' : 'a'}
                </div>
              )}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <RefreshCw className={`w-5 h-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-lg font-bold text-blue-600">{currentSummary.total_products || 0}</div>
              <div className="text-xs text-blue-600">Totali</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-lg font-bold text-green-600">{currentSummary.ok_stock || 0}</div>
              <div className="text-xs text-green-600">OK</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-lg font-bold text-yellow-600">{currentSummary.low_stock || 0}</div>
              <div className="text-xs text-yellow-600">Bassi</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-lg font-bold text-orange-600">{currentSummary.critical_stock || 0}</div>
              <div className="text-xs text-orange-600">Critici</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-lg font-bold text-red-600">{currentSummary.zero_stock || 0}</div>
              <div className="text-xs text-red-600">Esauriti</div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Cerca prodotto, codice o EAN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex gap-2 overflow-x-auto">
                {reparti.map((reparto) => (
                  <button
                    key={reparto.value}
                    onClick={() => setSelectedReparto(reparto.value)}
                    className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                      selectedReparto === reparto.value
                        ? 'bg-[#0066CC] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <span>{reparto.icon}</span>
                    <span className="hidden sm:inline">{reparto.label}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Filter className="w-4 h-4" />
                Filtri
              </button>
            </div>

            {showFilters && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Stato scorte</h3>
                <div className="flex flex-wrap gap-2">
                  {statusFilters.map((filter) => (
                    <button
                      key={filter.value}
                      onClick={() => setSelectedStatus(filter.value)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        selectedStatus === filter.value
                          ? `bg-${filter.color}-100 text-${filter.color}-800`
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4">
        {/* Critical Alerts Banner */}
        {alerts.filter(alert => !alert.is_read && ['zero_stock', 'critico'].includes(alert.alert_type)).length > 0 && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-3" />
              <div>
                <h3 className="font-medium text-red-800">Alert Critici</h3>
                <p className="text-sm text-red-700">
                  {alerts.filter(alert => !alert.is_read && alert.alert_type === 'zero_stock').length} prodotti esauriti, {' '}
                  {alerts.filter(alert => !alert.is_read && alert.alert_type === 'critico').length} sotto soglia critica
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Inventory List */}
        {filteredInventory.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'Nessun prodotto trovato' : 'Nessun prodotto presente'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm 
                ? `Nessun prodotto corrisponde alla ricerca "${searchTerm}"`
                : 'Non ci sono prodotti da visualizzare per i filtri selezionati'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredInventory.map((item) => (
              <StockCard
                key={item.id}
                product={item}
                currentUser={currentUser}
                onStockUpdate={handleStockUpdate}
                alerts={alerts.filter(alert => alert.product_id === item.id && !alert.is_read)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default InventoryManager