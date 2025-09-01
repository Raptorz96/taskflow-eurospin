import { useState, useEffect } from 'react'
import { X, Plus, Trash2, AlertTriangle, Calendar, Package, MapPin, Filter, Search } from 'lucide-react'
import { getScadenzeUrgenti, addScadenza, removeScadenza } from '../lib/supabase'

const ScadenzeManager = ({ currentUser, onClose }) => {
  const [scadenze, setScadenze] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedUrgenza, setSelectedUrgenza] = useState('all')
  const [selectedReparto, setSelectedReparto] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const [newProduct, setNewProduct] = useState({
    nome_prodotto: '',
    codice_ean: '',
    lotto: '',
    data_scadenza: '',
    quantita: 1,
    reparto: currentUser.reparto || 'ortofrutta',
    ubicazione: ''
  })

  const reparti = [
    { value: 'ortofrutta', label: 'Ortofrutta', icon: '🥬' },
    { value: 'macelleria', label: 'Macelleria', icon: '🥩' },
    { value: 'gastronomia', label: 'Gastronomia', icon: '🍝' },
    { value: 'panetteria', label: 'Panetteria', icon: '🥖' },
    { value: 'magazzino', label: 'Magazzino', icon: '📦' },
    { value: 'casse', label: 'Casse', icon: '💰' }
  ]

  const urgenzaLevels = [
    { value: 'all', label: 'Tutti', color: 'bg-gray-100 text-gray-800' },
    { value: 'scaduto', label: 'Scaduti', color: 'bg-red-100 text-red-800' },
    { value: 'oggi', label: 'Oggi', color: 'bg-orange-100 text-orange-800' },
    { value: 'critico', label: 'Critici (3 gg)', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'attenzione', label: 'Attenzione (7 gg)', color: 'bg-blue-100 text-blue-800' }
  ]

  useEffect(() => {
    loadScadenze()
  }, [])

  const loadScadenze = async () => {
    try {
      setLoading(true)
      const { data, error } = await getScadenzeUrgenti()
      if (error) throw error
      setScadenze(data || [])
    } catch (error) {
      console.error('Error loading scadenze:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddProduct = async (e) => {
    e.preventDefault()
    if (!newProduct.nome_prodotto || !newProduct.data_scadenza) return

    try {
      const { data, error } = await addScadenza(newProduct)
      if (error) throw error

      if (data && data[0]) {
        await loadScadenze()
        setShowAddForm(false)
        setNewProduct({
          nome_prodotto: '',
          codice_ean: '',
          lotto: '',
          data_scadenza: '',
          quantita: 1,
          reparto: currentUser.reparto || 'ortofrutta',
          ubicazione: ''
        })
      }
    } catch (error) {
      console.error('Error adding product:', error)
    }
  }

  const handleRemoveProduct = async (productId) => {
    if (!confirm('Sei sicuro di voler rimuovere questo prodotto?')) return

    try {
      await removeScadenza(productId, currentUser.id)
      await loadScadenze()
    } catch (error) {
      console.error('Error removing product:', error)
    }
  }

  const getUrgenzaColor = (urgenza) => {
    const colors = {
      scaduto: 'bg-red-100 text-red-800 border-red-200',
      oggi: 'bg-orange-100 text-orange-800 border-orange-200',
      critico: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      attenzione: 'bg-blue-100 text-blue-800 border-blue-200',
      ok: 'bg-green-100 text-green-800 border-green-200'
    }
    return colors[urgenza] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getUrgenzaIcon = (urgenza) => {
    switch (urgenza) {
      case 'scaduto': return '💀'
      case 'oggi': return '⚠️'
      case 'critico': return '🔴'
      case 'attenzione': return '🟡'
      default: return '✅'
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const today = new Date()
    const diffTime = date - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Oggi'
    if (diffDays === 1) return 'Domani'
    if (diffDays === -1) return 'Ieri'
    if (diffDays < -1) return `${Math.abs(diffDays)} giorni fa`
    if (diffDays > 1) return `Tra ${diffDays} giorni`
    
    return date.toLocaleDateString('it-IT')
  }

  const filteredScadenze = scadenze.filter(item => {
    const matchesUrgenza = selectedUrgenza === 'all' || item.urgenza === selectedUrgenza
    const matchesReparto = selectedReparto === 'all' || item.reparto === selectedReparto
    const matchesSearch = searchTerm === '' || 
      item.nome_prodotto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.lotto && item.lotto.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.ubicazione && item.ubicazione.toLowerCase().includes(searchTerm.toLowerCase()))
    
    return matchesUrgenza && matchesReparto && matchesSearch
  })

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-6">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Caricamento scadenze...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center sm:justify-center">
      <div className="bg-white w-full max-w-4xl mx-auto rounded-t-2xl sm:rounded-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Gestione Scadenze Sala
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowAddForm(true)}
              className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>Aggiungi</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-100 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Cerca prodotto, lotto, ubicazione..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter buttons */}
          <div className="flex flex-wrap gap-2">
            {urgenzaLevels.map(level => (
              <button
                key={level.value}
                onClick={() => setSelectedUrgenza(level.value)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedUrgenza === level.value
                    ? level.color
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {level.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedReparto('all')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedReparto === 'all'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Tutti i reparti
            </button>
            {reparti.map(reparto => (
              <button
                key={reparto.value}
                onClick={() => setSelectedReparto(reparto.value)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center space-x-1 ${
                  selectedReparto === reparto.value
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span>{reparto.icon}</span>
                <span>{reparto.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredScadenze.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nessun prodotto trovato
              </h3>
              <p className="text-gray-600">
                {searchTerm || selectedUrgenza !== 'all' || selectedReparto !== 'all'
                  ? 'Prova a modificare i filtri di ricerca'
                  : 'Non ci sono prodotti con scadenze registrate'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredScadenze.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border-2 ${getUrgenzaColor(item.urgenza)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-lg">{getUrgenzaIcon(item.urgenza)}</span>
                        <h3 className="font-semibold text-gray-900">
                          {item.nome_prodotto}
                        </h3>
                        {item.quantita > 1 && (
                          <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded-full text-xs">
                            Qta: {item.quantita}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>Scadenza: {formatDate(item.data_scadenza)}</span>
                        </div>
                        
                        {item.reparto && (
                          <div className="flex items-center space-x-1">
                            <Package className="w-4 h-4" />
                            <span>{reparti.find(r => r.value === item.reparto)?.label || item.reparto}</span>
                          </div>
                        )}
                        
                        {item.lotto && (
                          <div className="flex items-center space-x-1">
                            <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                              Lotto: {item.lotto}
                            </span>
                          </div>
                        )}
                        
                        {item.ubicazione && (
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span>{item.ubicazione}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveProduct(item.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Rimuovi prodotto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-red-600">
                {scadenze.filter(s => s.urgenza === 'scaduto').length}
              </div>
              <div className="text-xs text-gray-600">Scaduti</div>
            </div>
            <div>
              <div className="text-lg font-bold text-orange-600">
                {scadenze.filter(s => s.urgenza === 'oggi').length}
              </div>
              <div className="text-xs text-gray-600">Oggi</div>
            </div>
            <div>
              <div className="text-lg font-bold text-yellow-600">
                {scadenze.filter(s => s.urgenza === 'critico').length}
              </div>
              <div className="text-xs text-gray-600">Critici</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600">
                {scadenze.filter(s => s.urgenza === 'attenzione').length}
              </div>
              <div className="text-xs text-gray-600">Attenzione</div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Aggiungi Prodotto</h3>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="p-1 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>

            <form onSubmit={handleAddProduct} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Prodotto *
                </label>
                <input
                  type="text"
                  value={newProduct.nome_prodotto}
                  onChange={(e) => setNewProduct({...newProduct, nome_prodotto: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data Scadenza *
                  </label>
                  <input
                    type="date"
                    value={newProduct.data_scadenza}
                    onChange={(e) => setNewProduct({...newProduct, data_scadenza: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantità
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newProduct.quantita}
                    onChange={(e) => setNewProduct({...newProduct, quantita: parseInt(e.target.value) || 1})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reparto
                </label>
                <select
                  value={newProduct.reparto}
                  onChange={(e) => setNewProduct({...newProduct, reparto: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {reparti.map(reparto => (
                    <option key={reparto.value} value={reparto.value}>
                      {reparto.icon} {reparto.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Codice EAN
                  </label>
                  <input
                    type="text"
                    value={newProduct.codice_ean}
                    onChange={(e) => setNewProduct({...newProduct, codice_ean: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lotto
                  </label>
                  <input
                    type="text"
                    value={newProduct.lotto}
                    onChange={(e) => setNewProduct({...newProduct, lotto: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ubicazione
                </label>
                <input
                  type="text"
                  placeholder="es. Corsia 3, Scaffale B"
                  value={newProduct.ubicazione}
                  onChange={(e) => setNewProduct({...newProduct, ubicazione: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Aggiungi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ScadenzeManager