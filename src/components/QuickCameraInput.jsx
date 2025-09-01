import React, { useState, useEffect } from 'react'
import { X, Loader2, CheckCircle, Calendar, Package, FileText, Search, Plus } from 'lucide-react'
import { analyzePhoto, suggestTaskCategory, generateTaskTitle } from '../utils/photoAnalysis'
import { searchProducts, getProductInventory, createProduct, createStockMovement } from '../lib/supabase'

const QuickCameraInput = ({ isOpen, onClose, photoData, onSaveTask, currentUser }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [formData, setFormData] = useState({
    titolo: '',
    descrizione: '',
    categoria: 'Ripasso',
    priorita: 'Media',
    scadenza: '',
    prezzo: '',
    quantita: '',
    reparto: currentUser?.reparto || ''
  })
  const [suggestedProducts, setSuggestedProducts] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [productInventory, setProductInventory] = useState(null)
  const [showInventoryUpdate, setShowInventoryUpdate] = useState(false)
  const [newStockQuantity, setNewStockQuantity] = useState('')

  useEffect(() => {
    if (isOpen && photoData) {
      analyzePhotoData()
    }
  }, [isOpen, photoData])

  const analyzePhotoData = async () => {
    setIsAnalyzing(true)
    try {
      const result = await analyzePhoto(photoData)
      setAnalysis(result)
      
      const suggestedCategory = suggestTaskCategory(result.contentType, result.suggestedData)
      const suggestedTitle = generateTaskTitle(result.contentType, result.suggestedData)
      
      setFormData(prev => ({
        ...prev,
        titolo: suggestedTitle,
        categoria: suggestedCategory,
        prezzo: result.suggestedData.prezzo || '',
        quantita: result.suggestedData.quantita || '',
        scadenza: result.suggestedData.scadenza || '',
        descrizione: result.extractedText.substring(0, 200)
      }))

      // Search for matching products in inventory
      if (result.suggestedData.nome) {
        const { data: products } = await searchProducts(result.suggestedData.nome, 3)
        setSuggestedProducts(products || [])
        
        // If we find an exact match, load its inventory
        const exactMatch = products?.find(p => 
          p.nome.toLowerCase() === result.suggestedData.nome.toLowerCase()
        )
        if (exactMatch) {
          setSelectedProduct(exactMatch)
          loadProductInventory(exactMatch.id)
        }
      }
    } catch (error) {
      console.error('Error analyzing photo:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const loadProductInventory = async (productId) => {
    try {
      const { data, error } = await getProductInventory(productId)
      if (!error && data) {
        setProductInventory(data)
        setShowInventoryUpdate(true)
        setNewStockQuantity(data.quantita?.toString() || '0')
      }
    } catch (error) {
      console.error('Error loading product inventory:', error)
    }
  }

  const handleProductSelect = (product) => {
    setSelectedProduct(product)
    setFormData(prev => ({
      ...prev,
      titolo: product.nome,
      reparto: product.reparto || prev.reparto,
      prezzo: product.prezzo_ultimo?.toString() || prev.prezzo
    }))
    loadProductInventory(product.id)
  }

  const handleStockUpdate = async () => {
    if (!selectedProduct || !newStockQuantity) return
    
    try {
      const oldQuantity = productInventory?.quantita || 0
      const newQuantity = parseInt(newStockQuantity)
      
      if (newQuantity === oldQuantity) return
      
      const movementData = {
        product_id: selectedProduct.id,
        tipo: 'ripasso',
        quantita_precedente: oldQuantity,
        quantita: newQuantity - oldQuantity,
        quantita_finale: newQuantity,
        note: 'Aggiornamento da foto ripasso',
        created_by: currentUser.id
      }
      
      await createStockMovement(movementData)
      
      // Update local state
      setProductInventory(prev => ({
        ...prev,
        quantita: newQuantity
      }))
      
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
    } catch (error) {
      console.error('Error updating stock:', error)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleQuickCategory = (category) => {
    setFormData(prev => ({
      ...prev,
      categoria: category
    }))
  }

  const handleSave = async () => {
    const taskData = {
      ...formData,
      photo_url: photoData,
      captured_data: analysis?.suggestedData || {},
      extracted_text: analysis?.extractedText || ''
    }
    
    await onSaveTask(taskData)
    onClose()
  }

  if (!isOpen) return null

  const getContentTypeIcon = () => {
    if (!analysis) return <Package className="text-blue-500" size={20} />
    
    switch (analysis.contentType) {
      case 'scadenza':
        return <Calendar className="text-orange-500" size={20} />
      case 'documento':
        return <FileText className="text-green-500" size={20} />
      case 'prodotto':
      default:
        return <Package className="text-blue-500" size={20} />
    }
  }

  const getContentTypeLabel = () => {
    if (!analysis) return 'Analisi in corso...'
    
    switch (analysis.contentType) {
      case 'scadenza':
        return 'Scadenza rilevata'
      case 'documento':
        return 'Documento rilevato'
      case 'prodotto':
        return 'Prodotto rilevato'
      default:
        return 'Contenuto rilevato'
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-t-xl sm:rounded-xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-[#0066CC] text-white p-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Nuovo Task da Foto</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Analysis Status */}
          <div className="mt-3 flex items-center gap-2 text-blue-100">
            {isAnalyzing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span className="text-sm">Analisi in corso...</span>
              </>
            ) : (
              <>
                {getContentTypeIcon()}
                <span className="text-sm">{getContentTypeLabel()}</span>
              </>
            )}
          </div>
        </div>

        {/* Form Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          {isAnalyzing ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 size={32} className="animate-spin text-[#0066CC] mb-4" />
              <p className="text-gray-600">Sto analizzando la foto...</p>
              <p className="text-sm text-gray-400 mt-2">Riconoscimento testo e dati</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Product Suggestions */}
              {suggestedProducts.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prodotti suggeriti
                  </label>
                  <div className="space-y-2">
                    {suggestedProducts.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => handleProductSelect(product)}
                        className={`w-full p-3 text-left border rounded-lg transition-colors ${
                          selectedProduct?.id === product.id
                            ? 'border-[#0066CC] bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-gray-900">{product.nome}</div>
                            <div className="text-sm text-gray-600">
                              {product.codice && `#${product.codice} • `}
                              {product.reparto}
                            </div>
                          </div>
                          <Package className="w-4 h-4 text-gray-400" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Inventory Update Section */}
              {showInventoryUpdate && selectedProduct && productInventory && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-indigo-900 flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Rimanenza attuale
                    </h3>
                    <div className="text-sm text-indigo-700">
                      {productInventory.quantita} {selectedProduct.unita_misura}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs text-indigo-700 mb-1">Nuova quantità</label>
                      <input
                        type="number"
                        value={newStockQuantity}
                        onChange={(e) => setNewStockQuantity(e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-indigo-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={handleStockUpdate}
                        className="w-full py-1 px-2 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition-colors"
                      >
                        Aggiorna
                      </button>
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={() => setShowInventoryUpdate(false)}
                        className="w-full py-1 px-2 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition-colors"
                      >
                        Salta
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Category Buttons */}
              <div className="grid grid-cols-3 gap-2">
                {['Ripasso', 'Controllo', 'Avviso'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => handleQuickCategory(cat)}
                    className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                      formData.categoria === cat
                        ? 'bg-[#0066CC] text-white border-[#0066CC]'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titolo *
                </label>
                <input
                  type="text"
                  value={formData.titolo}
                  onChange={(e) => handleInputChange('titolo', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                  placeholder="Nome del task"
                />
              </div>

              {/* Dynamic fields based on content type */}
              {analysis?.contentType === 'scadenza' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Data Scadenza
                      </label>
                      <input
                        type="date"
                        value={formData.scadenza}
                        onChange={(e) => handleInputChange('scadenza', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantità
                      </label>
                      <input
                        type="text"
                        value={formData.quantita}
                        onChange={(e) => handleInputChange('quantita', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                        placeholder="es. 10 pz"
                      />
                    </div>
                  </div>
                </>
              )}

              {analysis?.contentType === 'prodotto' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Prezzo
                      </label>
                      <input
                        type="text"
                        value={formData.prezzo}
                        onChange={(e) => handleInputChange('prezzo', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                        placeholder="€0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantità
                      </label>
                      <input
                        type="text"
                        value={formData.quantita}
                        onChange={(e) => handleInputChange('quantita', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                        placeholder="es. 50 kg"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reparto
                    </label>
                    <select
                      value={formData.reparto}
                      onChange={(e) => handleInputChange('reparto', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                    >
                      <option value="">Seleziona reparto</option>
                      <option value="Ortofrutta">Ortofrutta</option>
                      <option value="Macelleria">Macelleria</option>
                      <option value="Gastronomia">Gastronomia</option>
                      <option value="Pescheria">Pescheria</option>
                      <option value="Panetteria">Panetteria</option>
                      <option value="Latticini">Latticini</option>
                      <option value="Surgelati">Surgelati</option>
                      <option value="Drogheria">Drogheria</option>
                    </select>
                  </div>
                </>
              )}

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priorità
                </label>
                <select
                  value={formData.priorita}
                  onChange={(e) => handleInputChange('priorita', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                >
                  <option value="Bassa">Bassa</option>
                  <option value="Media">Media</option>
                  <option value="Alta">Alta</option>
                  <option value="Urgente">Urgente</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrizione
                </label>
                <textarea
                  value={formData.descrizione}
                  onChange={(e) => handleInputChange('descrizione', e.target.value)}
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
                  placeholder="Dettagli aggiuntivi..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Annulla
            </button>
            <button
              onClick={handleSave}
              disabled={isAnalyzing || !formData.titolo}
              className="flex-1 py-3 px-4 bg-[#0066CC] text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <CheckCircle size={20} />
              Salva Task
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuickCameraInput