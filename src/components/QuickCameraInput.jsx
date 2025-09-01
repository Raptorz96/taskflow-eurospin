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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-hidden shadow-2xl border border-gray-200">
        {/* Modern Header */}
        <div className="bg-gradient-to-r from-[#0066CC] to-blue-600 text-white">
          <div className="px-6 py-5">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Package size={20} />
                </div>
                <h2 className="text-xl font-bold">Nuovo Task da Foto</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
              >
                <X size={22} />
              </button>
            </div>
            
            {/* Analysis Status */}
            <div className="mt-4 flex items-center gap-3 text-blue-100">
              {isAnalyzing ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span className="font-medium">Analisi in corso...</span>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    {getContentTypeIcon()}
                    <span className="font-medium">{getContentTypeLabel()}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {isAnalyzing ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-[#0066CC]/20 border-t-[#0066CC] rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Search size={20} className="text-[#0066CC]" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-2">Sto analizzando la foto</h3>
              <p className="text-gray-600 text-center max-w-sm">Riconoscimento automatico di testi, prodotti e dati utili per il task</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Product Suggestions */}
              {suggestedProducts.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
                  <label className="block text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Search size={16} />
                    Prodotti suggeriti
                  </label>
                  <div className="grid gap-3">
                    {suggestedProducts.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => handleProductSelect(product)}
                        className={`w-full p-4 text-left rounded-xl transition-all duration-200 ${
                          selectedProduct?.id === product.id
                            ? 'border-2 border-[#0066CC] bg-blue-50 shadow-sm'
                            : 'border-2 border-gray-200 hover:border-gray-300 hover:bg-white bg-white'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 mb-1">{product.nome}</div>
                            <div className="text-sm text-gray-600 flex items-center gap-2">
                              {product.codice && <span className="bg-gray-200 px-2 py-1 rounded-md text-xs font-mono">#{product.codice}</span>}
                              <span className="text-blue-600 font-medium">{product.reparto}</span>
                            </div>
                          </div>
                          <Package className="w-5 h-5 text-gray-400 ml-3" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Inventory Update Section */}
              {showInventoryUpdate && selectedProduct && productInventory && (
                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border-2 border-indigo-200 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-indigo-900 flex items-center gap-2">
                      <div className="w-8 h-8 bg-indigo-200 rounded-full flex items-center justify-center">
                        <Package className="w-4 h-4 text-indigo-700" />
                      </div>
                      Rimanenza attuale
                    </h3>
                    <div className="bg-indigo-100 px-3 py-2 rounded-xl">
                      <span className="text-lg font-bold text-indigo-800">
                        {productInventory.quantita} {selectedProduct.unita_misura}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-1">
                      <label className="block text-sm font-semibold text-indigo-700 mb-2">Nuova quantità</label>
                      <input
                        type="number"
                        value={newStockQuantity}
                        onChange={(e) => setNewStockQuantity(e.target.value)}
                        className="w-full px-3 py-3 text-sm border-2 border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                        placeholder="0"
                      />
                    </div>
                    <div className="sm:col-span-2 flex gap-3">
                      <button
                        onClick={handleStockUpdate}
                        className="flex-1 py-3 px-4 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all duration-200 shadow-sm"
                      >
                        Aggiorna Stock
                      </button>
                      <button
                        onClick={() => setShowInventoryUpdate(false)}
                        className="flex-1 py-3 px-4 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-all duration-200"
                      >
                        Salta
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Category Buttons */}
              <div className="bg-white p-4 rounded-2xl border-2 border-gray-200">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Categoria Task</h3>
                <div className="grid grid-cols-3 gap-3">
                  {['Ripasso', 'Controllo', 'Avviso'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => handleQuickCategory(cat)}
                      className={`p-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
                        formData.categoria === cat
                          ? 'bg-[#0066CC] text-white shadow-lg scale-105'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-102'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-3">
                  Titolo del Task *
                </label>
                <input
                  type="text"
                  value={formData.titolo}
                  onChange={(e) => handleInputChange('titolo', e.target.value)}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0066CC] focus:border-transparent bg-white text-gray-900 font-medium"
                  placeholder="Inserisci il nome del task"
                />
              </div>

              {/* Dynamic fields based on content type */}
              {analysis?.contentType === 'scadenza' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">
                        Data Scadenza
                      </label>
                      <input
                        type="date"
                        value={formData.scadenza}
                        onChange={(e) => handleInputChange('scadenza', e.target.value)}
                        className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0066CC] focus:border-transparent bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">
                        Quantità
                      </label>
                      <input
                        type="text"
                        value={formData.quantita}
                        onChange={(e) => handleInputChange('quantita', e.target.value)}
                        className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0066CC] focus:border-transparent bg-white"
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

        {/* Modern Footer */}
        <div className="bg-gray-50 border-t-2 border-gray-200">
          <div className="p-6 flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 py-4 px-6 border-2 border-gray-300 text-gray-700 rounded-2xl font-semibold hover:bg-gray-100 hover:border-gray-400 transition-all duration-200"
            >
              Annulla
            </button>
            <button
              onClick={handleSave}
              disabled={isAnalyzing || !formData.titolo}
              className="flex-1 py-4 px-6 bg-gradient-to-r from-[#0066CC] to-blue-600 text-white rounded-2xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg disabled:shadow-none"
            >
              <CheckCircle size={22} />
              Salva Task
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuickCameraInput