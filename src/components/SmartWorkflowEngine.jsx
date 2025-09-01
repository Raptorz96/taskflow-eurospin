import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, FileText, Clock, Package, AlertCircle, Zap, CheckCircle, Upload, X, Wand2, Bot, MessageCircle } from 'lucide-react'
import { createWorker } from 'tesseract.js'
import { supabase, createTask, updateInventory, getInventory } from '../lib/supabase'

const SmartWorkflowEngine = ({ currentUser, isOpen, onClose, onTaskCreated }) => {
  const [activeWorkflow, setActiveWorkflow] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [capturedPhoto, setCapturedPhoto] = useState(null)
  const [extractedText, setExtractedText] = useState('')
  const [workflowResult, setWorkflowResult] = useState(null)
  const [ocrWorker, setOcrWorker] = useState(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [stream, setStream] = useState(null)

  const workflows = [
    {
      id: 'ripasso',
      title: 'RIPASSO VELOCE',
      description: 'Foto → OCR nome → Quantità → Auto-update rimanenze',
      icon: Package,
      color: 'blue',
      steps: ['Foto prodotto', 'OCR testo', 'Input quantità', 'Update stock', 'Crea task']
    },
    {
      id: 'scadenze',
      title: 'CONTROLLO SCADENZE',
      description: 'Foto data → Parse → Alert se <3 giorni',
      icon: Clock,
      color: 'orange',
      steps: ['Foto scadenza', 'Parse data', 'Calcola giorni', 'Alert urgente', 'Task prioritario']
    },
    {
      id: 'mail',
      title: 'AVVISO MAIL',
      description: 'Foto documento → Estrai testo → Categorizza',
      icon: FileText,
      color: 'green',
      steps: ['Foto documento', 'OCR completo', 'AI categorizza', 'Crea reminder', 'Notifica team']
    },
    {
      id: 'inventario',
      title: 'INVENTARIO RAPIDO',
      description: 'Multi-foto → Batch processing → Update massivo',
      icon: Upload,
      color: 'purple',
      steps: ['Multi-foto', 'Batch OCR', 'Parse prodotti', 'Update batch', 'Report finale']
    }
  ]

  useEffect(() => {
    const initOCR = async () => {
      try {
        const worker = await createWorker('ita+eng', 1, {
          logger: m => {
            if (m.status === 'recognizing text') {
              setProgress(Math.round(m.progress * 100))
            }
          }
        })
        setOcrWorker(worker)
      } catch (error) {
        console.error('Error initializing OCR:', error)
      }
    }

    if (isOpen) {
      initOCR()
    }

    return () => {
      if (ocrWorker) {
        ocrWorker.terminate()
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [isOpen])

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      alert('Errore accesso fotocamera')
    }
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      context.drawImage(video, 0, 0)

      const photoData = canvas.toDataURL('image/jpeg', 0.8)
      setCapturedPhoto(photoData)
      
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
        setStream(null)
      }
    }
  }

  const processPhoto = async () => {
    if (!capturedPhoto || !ocrWorker) return

    setProcessing(true)
    setProgress(0)

    try {
      const { data: { text } } = await ocrWorker.recognize(capturedPhoto)
      setExtractedText(text)

      const result = await executeWorkflow(activeWorkflow.id, text, capturedPhoto)
      setWorkflowResult(result)
    } catch (error) {
      console.error('Error processing photo:', error)
      alert('Errore durante l\'elaborazione')
    } finally {
      setProcessing(false)
      setProgress(0)
    }
  }

  const executeWorkflow = async (workflowId, text, photo) => {
    const timestamp = new Date().toISOString()
    
    switch (workflowId) {
      case 'ripasso':
        return await executeRipassoWorkflow(text, photo, timestamp)
      case 'scadenze':
        return await executeScadenzeWorkflow(text, photo, timestamp)
      case 'mail':
        return await executeMailWorkflow(text, photo, timestamp)
      case 'inventario':
        return await executeInventarioWorkflow(text, photo, timestamp)
      default:
        throw new Error('Workflow non riconosciuto')
    }
  }

  const executeRipassoWorkflow = async (text, photo, timestamp) => {
    // Extract product name using smart patterns
    const productNameMatch = text.match(/([A-Z][A-Za-z\s]{3,20})/g)
    const productName = productNameMatch ? productNameMatch[0].trim() : 'Prodotto sconosciuto'

    // Try to find existing inventory
    const { data: inventory } = await getInventory({
      search: productName.substring(0, 10)
    })

    let quantita = null
    const quantitaInput = prompt(`Prodotto riconosciuto: ${productName}\nInserisci quantità ripassata:`)
    if (quantitaInput) {
      quantita = parseInt(quantitaInput)
    }

    // Update inventory if found
    if (inventory && inventory.length > 0 && quantita) {
      await updateInventory(inventory[0].id, {
        quantita_disponibile: inventory[0].quantita_disponibile + quantita,
        ultimo_ripasso: timestamp
      })
    }

    // Create task
    const taskData = {
      titolo: `Ripasso completato: ${productName}`,
      descrizione: `Prodotto: ${productName}\nQuantità: ${quantita || 'N/A'}\nRiconosciuto automaticamente da foto`,
      categoria: 'ripasso',
      priorita: 2,
      stato: quantita ? 'completato' : 'da_fare',
      assegnato_a: currentUser.id,
      creato_da: currentUser.id,
      reparto: currentUser.reparto,
      extracted_text: text,
      photo_url: photo
    }

    const { data: newTask } = await createTask(taskData)
    
    return {
      success: true,
      productName,
      quantita,
      task: newTask,
      message: quantita ? 
        `✅ Ripasso completato per ${productName} (${quantita} pezzi)` :
        `📝 Task creato per ripasso ${productName}`
    }
  }

  const executeScadenzeWorkflow = async (text, photo, timestamp) => {
    // Extract dates using multiple patterns
    const datePatterns = [
      /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/g,
      /(\d{1,2})\.(\d{1,2})\.(\d{2,4})/g,
      /scad[^\d]*(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/gi
    ]

    let extractedDate = null
    let daysUntilExpiry = null

    for (const pattern of datePatterns) {
      const matches = Array.from(text.matchAll(pattern))
      if (matches.length > 0) {
        const match = matches[0]
        const day = parseInt(match[1])
        const month = parseInt(match[2])
        let year = parseInt(match[3])
        
        if (year < 100) year += 2000
        
        extractedDate = new Date(year, month - 1, day)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        daysUntilExpiry = Math.ceil((extractedDate - today) / (1000 * 60 * 60 * 24))
        break
      }
    }

    const isUrgent = daysUntilExpiry !== null && daysUntilExpiry <= 3

    const taskData = {
      titolo: `${isUrgent ? '🔥 SCADENZA URGENTE' : 'Controllo scadenza'}`,
      descrizione: `Data scadenza rilevata: ${extractedDate ? extractedDate.toLocaleDateString('it-IT') : 'Non riconosciuta'}\nGiorni rimanenti: ${daysUntilExpiry ?? 'N/A'}\n\nTesto estratto: ${text.substring(0, 200)}...`,
      categoria: 'scadenze',
      priorita: isUrgent ? 5 : 3,
      stato: 'da_fare',
      assegnato_a: currentUser.id,
      creato_da: currentUser.id,
      reparto: currentUser.reparto,
      data_scadenza: isUrgent ? new Date() : extractedDate,
      extracted_text: text,
      photo_url: photo
    }

    const { data: newTask } = await createTask(taskData)

    return {
      success: true,
      extractedDate,
      daysUntilExpiry,
      isUrgent,
      task: newTask,
      message: isUrgent ? 
        `🚨 SCADENZA CRITICA! ${daysUntilExpiry} giorni rimasti` :
        `📅 Scadenza monitorata: ${daysUntilExpiry} giorni`
    }
  }

  const executeMailWorkflow = async (text, photo, timestamp) => {
    // AI-powered categorization
    const categories = {
      'ordine': ['ordine', 'order', 'acquisto', 'fornitore', 'fattura'],
      'promozionale': ['promo', 'sconto', 'offerta', 'volantino', 'pubblicità'],
      'comunicazione': ['comunicazione', 'avviso', 'circolare', 'info'],
      'documentazione': ['documento', 'certificato', 'allegato', 'pdf']
    }

    let detectedCategory = 'generico'
    let confidence = 0

    for (const [category, keywords] of Object.entries(categories)) {
      const matches = keywords.filter(keyword => 
        text.toLowerCase().includes(keyword.toLowerCase())
      ).length
      
      if (matches > confidence) {
        confidence = matches
        detectedCategory = category
      }
    }

    const taskData = {
      titolo: `📧 Documento ${detectedCategory}: ${text.substring(0, 30)}...`,
      descrizione: `Categoria rilevata: ${detectedCategory.toUpperCase()}\nLivello fiducia: ${confidence}/5\n\nTesto estratto:\n${text.substring(0, 500)}${text.length > 500 ? '...' : ''}`,
      categoria: 'documentazione',
      priorita: detectedCategory === 'ordine' ? 4 : 2,
      stato: 'da_fare',
      assegnato_a: currentUser.id,
      creato_da: currentUser.id,
      reparto: currentUser.reparto,
      extracted_text: text,
      photo_url: photo
    }

    const { data: newTask } = await createTask(taskData)

    return {
      success: true,
      detectedCategory,
      confidence,
      task: newTask,
      message: `📄 Documento categorizzato come: ${detectedCategory.toUpperCase()}`
    }
  }

  const executeInventarioWorkflow = async (text, photo, timestamp) => {
    // Parse multiple products from text
    const lines = text.split('\n').filter(line => line.trim().length > 3)
    const products = []

    for (const line of lines) {
      const quantityMatch = line.match(/(\d+)\s*(?:pz|pcs|x)?/i)
      const productMatch = line.match(/([A-Za-z][A-Za-z\s]{2,25})/i)
      
      if (quantityMatch && productMatch) {
        products.push({
          name: productMatch[1].trim(),
          quantity: parseInt(quantityMatch[1])
        })
      }
    }

    // Create summary task
    const taskData = {
      titolo: `📦 Inventario batch: ${products.length} prodotti rilevati`,
      descrizione: `Prodotti elaborati:\n${products.map(p => `• ${p.name}: ${p.quantity} pz`).join('\n')}\n\nTesto completo:\n${text}`,
      categoria: 'inventario',
      priorita: 3,
      stato: products.length > 0 ? 'completato' : 'da_fare',
      assegnato_a: currentUser.id,
      creato_da: currentUser.id,
      reparto: currentUser.reparto,
      extracted_text: text,
      photo_url: photo
    }

    const { data: newTask } = await createTask(taskData)

    return {
      success: true,
      products,
      task: newTask,
      message: `📊 Inventario elaborato: ${products.length} prodotti riconosciuti`
    }
  }

  const handleWorkflowComplete = () => {
    if (workflowResult?.task) {
      onTaskCreated(workflowResult.task)
    }
    
    // Reset state
    setActiveWorkflow(null)
    setCapturedPhoto(null)
    setExtractedText('')
    setWorkflowResult(null)
    onClose()

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100, 50, 100])
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
          initial={{ scale: 0.9, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 50 }}
        >
          <div className="sticky top-0 bg-white p-6 border-b border-gray-200 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Wand2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Smart Workflow</h2>
                  <p className="text-sm text-gray-600">AI-powered automation</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          <div className="p-6">
            {!activeWorkflow ? (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <Bot className="w-12 h-12 text-purple-500 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-900">Scegli Workflow</h3>
                  <p className="text-sm text-gray-600">Seleziona il tipo di automazione intelligente</p>
                </div>

                {workflows.map((workflow) => {
                  const IconComponent = workflow.icon
                  return (
                    <motion.button
                      key={workflow.id}
                      onClick={() => {
                        setActiveWorkflow(workflow)
                        startCamera()
                      }}
                      className={`w-full p-4 rounded-xl border-2 border-${workflow.color}-200 bg-${workflow.color}-50 hover:bg-${workflow.color}-100 transition-all text-left`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-start space-x-4">
                        <div className={`w-12 h-12 bg-${workflow.color}-500 rounded-xl flex items-center justify-center flex-shrink-0`}>
                          <IconComponent className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className={`font-bold text-${workflow.color}-900 mb-1`}>
                            {workflow.title}
                          </h4>
                          <p className={`text-sm text-${workflow.color}-700 mb-3`}>
                            {workflow.description}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {workflow.steps.map((step, index) => (
                              <span key={index} className={`text-xs bg-${workflow.color}-200 text-${workflow.color}-800 px-2 py-1 rounded-full`}>
                                {index + 1}. {step}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  )
                })}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Workflow Header */}
                <div className={`p-4 rounded-xl bg-${activeWorkflow.color}-50 border-${activeWorkflow.color}-200`}>
                  <div className="flex items-center space-x-3">
                    <activeWorkflow.icon className={`w-6 h-6 text-${activeWorkflow.color}-600`} />
                    <div>
                      <h3 className={`font-bold text-${activeWorkflow.color}-900`}>
                        {activeWorkflow.title}
                      </h3>
                      <p className={`text-sm text-${activeWorkflow.color}-700`}>
                        {activeWorkflow.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Camera or Photo Preview */}
                {!capturedPhoto ? (
                  <div className="space-y-4">
                    <div className="relative bg-black rounded-xl overflow-hidden aspect-[4/3]">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      <canvas ref={canvasRef} className="hidden" />
                      
                      <div className="absolute inset-0 flex items-end justify-center p-6">
                        <motion.button
                          onClick={capturePhoto}
                          className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Camera className="w-8 h-8 text-gray-700" />
                        </motion.button>
                      </div>

                      {/* Grid overlay for better composition */}
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="w-full h-full grid grid-cols-3 grid-rows-3">
                          {Array.from({ length: 9 }).map((_, i) => (
                            <div key={i} className="border border-white/20" />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="text-center text-sm text-gray-600">
                      📸 Posiziona l'oggetto al centro e scatta
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Photo Preview */}
                    <div className="relative">
                      <img
                        src={capturedPhoto}
                        alt="Captured"
                        className="w-full h-48 object-cover rounded-xl"
                      />
                      <button
                        onClick={() => {
                          setCapturedPhoto(null)
                          setExtractedText('')
                          setWorkflowResult(null)
                          startCamera()
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Processing or Results */}
                    {processing ? (
                      <div className="text-center py-6">
                        <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
                        <p className="font-semibold text-gray-900">Elaborazione AI in corso...</p>
                        <p className="text-sm text-gray-600">Progresso OCR: {progress}%</p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                          <div 
                            className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    ) : workflowResult ? (
                      <div className="space-y-4">
                        {/* Success Result */}
                        <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                          <div className="flex items-start space-x-3">
                            <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                            <div>
                              <h4 className="font-semibold text-green-900">Workflow completato!</h4>
                              <p className="text-sm text-green-700 mt-1">{workflowResult.message}</p>
                            </div>
                          </div>
                        </div>

                        {/* Extracted Text Preview */}
                        {extractedText && (
                          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                            <h5 className="font-semibold text-gray-900 mb-2 flex items-center">
                              <MessageCircle className="w-4 h-4 mr-2" />
                              Testo estratto
                            </h5>
                            <p className="text-sm text-gray-700 max-h-32 overflow-y-auto">
                              {extractedText.substring(0, 300)}
                              {extractedText.length > 300 && '...'}
                            </p>
                          </div>
                        )}

                        <div className="flex space-x-3">
                          <motion.button
                            onClick={handleWorkflowComplete}
                            className="flex-1 bg-green-500 text-white py-3 px-4 rounded-xl font-semibold hover:bg-green-600 transition-colors"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            ✅ Completa e Chiudi
                          </motion.button>
                          
                          <motion.button
                            onClick={() => {
                              setCapturedPhoto(null)
                              setExtractedText('')
                              setWorkflowResult(null)
                              startCamera()
                            }}
                            className="px-4 py-3 border border-gray-300 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            🔄 Ripeti
                          </motion.button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <motion.button
                          onClick={processPhoto}
                          className={`w-full bg-${activeWorkflow.color}-500 text-white py-4 px-6 rounded-xl font-bold text-lg hover:bg-${activeWorkflow.color}-600 transition-colors`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          🚀 Avvia Workflow AI
                        </motion.button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default SmartWorkflowEngine