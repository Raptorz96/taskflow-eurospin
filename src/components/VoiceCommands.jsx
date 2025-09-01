import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, Volume2, VolumeX, Headphones, Zap, CheckCircle, AlertCircle, Settings } from 'lucide-react'
import { getTasks, createTask, updateTask, getInventoryAlerts } from '../lib/supabase'

const VoiceCommands = ({ currentUser, isOpen, onClose, onTaskCreated, onTaskUpdated }) => {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [commandResult, setCommandResult] = useState(null)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [recognition, setRecognition] = useState(null)
  const [supportedCommands, setSupportedCommands] = useState([])
  const [lastCommand, setLastCommand] = useState(null)
  const speechSynthRef = useRef(null)
  
  const commands = {
    'crea ripasso': {
      pattern: /(?:crea|nuovo)\s*ripasso\s*(.+)?/i,
      action: 'createRipasso',
      description: 'Crea un task di ripasso per un prodotto',
      examples: ['Crea ripasso latte', 'Nuovo ripasso pasta']
    },
    'controlla scadenze': {
      pattern: /controlla\s*scadenze?\s*(.+)?/i,
      action: 'checkScadenze',
      description: 'Controlla le scadenze di un reparto',
      examples: ['Controlla scadenze latticini', 'Controlla scadenze']
    },
    'rimanenze critiche': {
      pattern: /(?:mostra|visualizza)?\s*rimanenze?\s*critiche?/i,
      action: 'showCriticalStock',
      description: 'Mostra prodotti con rimanenze critiche',
      examples: ['Mostra rimanenze critiche', 'Rimanenze critiche']
    },
    'completa task': {
      pattern: /completa\s*task\s*(?:numero\s*)?(\d+)/i,
      action: 'completeTask',
      description: 'Completa un task specifico',
      examples: ['Completa task 5', 'Completa task numero 12']
    },
    'stato dashboard': {
      pattern: /(?:stato|riassunto)\s*dashboard/i,
      action: 'dashboardStatus',
      description: 'Legge lo stato generale del dashboard',
      examples: ['Stato dashboard', 'Riassunto dashboard']
    },
    'aiuto comandi': {
      pattern: /(?:aiuto|help|comandi)/i,
      action: 'helpCommands',
      description: 'Elenca tutti i comandi vocali disponibili',
      examples: ['Aiuto', 'Comandi', 'Help']
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition
      const recognitionInstance = new SpeechRecognition()
      
      recognitionInstance.continuous = false
      recognitionInstance.interimResults = true
      recognitionInstance.lang = 'it-IT'
      recognitionInstance.maxAlternatives = 1

      recognitionInstance.onstart = () => {
        setIsListening(true)
        setTranscript('')
        setCommandResult(null)
      }

      recognitionInstance.onresult = (event) => {
        let interimTranscript = ''
        let finalTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }

        setTranscript(finalTranscript || interimTranscript)

        if (finalTranscript) {
          processVoiceCommand(finalTranscript.trim())
        }
      }

      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
        setCommandResult({
          type: 'error',
          message: `Errore riconoscimento vocale: ${event.error}`,
          details: 'Prova a parlare più chiaramente o controlla il microfono'
        })
        
        if (voiceEnabled) {
          speak('Errore nel riconoscimento vocale. Riprova.')
        }
      }

      recognitionInstance.onend = () => {
        setIsListening(false)
      }

      setRecognition(recognitionInstance)
      setSupportedCommands(Object.keys(commands))
    } else {
      setCommandResult({
        type: 'error',
        message: 'Browser non supportato',
        details: 'Il riconoscimento vocale non è disponibile su questo browser'
      })
    }

    return () => {
      if (recognition) {
        recognition.abort()
      }
    }
  }, [])

  const startListening = () => {
    if (recognition && !isListening) {
      try {
        recognition.start()
        if (voiceEnabled) {
          speak('Ti ascolto. Pronuncia il comando.')
        }
      } catch (error) {
        console.error('Error starting speech recognition:', error)
      }
    }
  }

  const stopListening = () => {
    if (recognition && isListening) {
      recognition.stop()
    }
  }

  const speak = (text) => {
    if (!voiceEnabled || !window.speechSynthesis) return

    // Cancel any ongoing speech
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'it-IT'
    utterance.volume = 0.8
    utterance.rate = 1.0
    utterance.pitch = 1.0

    // Find Italian voice if available
    const voices = window.speechSynthesis.getVoices()
    const italianVoice = voices.find(voice => voice.lang.startsWith('it'))
    if (italianVoice) {
      utterance.voice = italianVoice
    }

    speechSynthRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }

  const processVoiceCommand = async (commandText) => {
    setIsProcessing(true)
    
    try {
      let matchedCommand = null
      let matches = null

      // Find matching command
      for (const [commandName, commandData] of Object.entries(commands)) {
        matches = commandText.match(commandData.pattern)
        if (matches) {
          matchedCommand = { name: commandName, ...commandData }
          break
        }
      }

      if (!matchedCommand) {
        setCommandResult({
          type: 'error',
          message: 'Comando non riconosciuto',
          details: `Ho sentito: "${commandText}". Prova con: ${Object.keys(commands).slice(0, 3).join(', ')}`
        })
        
        if (voiceEnabled) {
          speak(`Comando non riconosciuto. Ho sentito ${commandText}. Prova di nuovo.`)
        }
        return
      }

      setLastCommand({ text: commandText, command: matchedCommand.name })

      // Execute command
      const result = await executeCommand(matchedCommand.action, matches, commandText)
      
      setCommandResult({
        type: 'success',
        message: `Comando "${matchedCommand.name}" eseguito`,
        details: result.message,
        data: result.data
      })

      if (voiceEnabled && result.speechMessage) {
        speak(result.speechMessage)
      }

    } catch (error) {
      console.error('Error processing voice command:', error)
      setCommandResult({
        type: 'error',
        message: 'Errore esecuzione comando',
        details: error.message
      })
      
      if (voiceEnabled) {
        speak('Errore durante l\'esecuzione del comando.')
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const executeCommand = async (action, matches, originalText) => {
    switch (action) {
      case 'createRipasso':
        return await createRipassoCommand(matches)
      case 'checkScadenze':
        return await checkScadenzeCommand(matches)
      case 'showCriticalStock':
        return await showCriticalStockCommand()
      case 'completeTask':
        return await completeTaskCommand(matches)
      case 'dashboardStatus':
        return await dashboardStatusCommand()
      case 'helpCommands':
        return await helpCommandsCommand()
      default:
        throw new Error('Azione comando non implementata')
    }
  }

  const createRipassoCommand = async (matches) => {
    const productName = matches[1]?.trim() || 'Prodotto generico'
    
    const taskData = {
      titolo: `Ripasso vocale: ${productName}`,
      descrizione: `Task di ripasso creato tramite comando vocale per il prodotto: ${productName}`,
      categoria: 'ripasso',
      priorita: 2,
      stato: 'da_fare',
      assegnato_a: currentUser.id,
      creato_da: currentUser.id,
      reparto: currentUser.reparto,
      voice_created: true
    }

    const { data: newTask, error } = await createTask(taskData)
    if (error) throw error

    if (onTaskCreated) {
      onTaskCreated(newTask)
    }

    return {
      message: `Task di ripasso creato per ${productName}`,
      speechMessage: `Task di ripasso per ${productName} creato con successo`,
      data: newTask
    }
  }

  const checkScadenzeCommand = async (matches) => {
    const reparto = matches[1]?.trim() || currentUser.reparto

    try {
      const { data: alerts, error } = await getInventoryAlerts({
        reparto: reparto,
        days_threshold: 3
      })
      
      if (error) throw error

      const criticalCount = alerts?.filter(alert => alert.giorni_rimanenti <= 1).length || 0
      const warningCount = alerts?.filter(alert => alert.giorni_rimanenti <= 3).length || 0

      return {
        message: `Scadenze ${reparto}: ${criticalCount} critiche, ${warningCount} in scadenza`,
        speechMessage: `Nel reparto ${reparto} ci sono ${criticalCount} prodotti con scadenza critica e ${warningCount} prodotti in scadenza nei prossimi 3 giorni`,
        data: { critical: criticalCount, warning: warningCount, reparto }
      }
    } catch (error) {
      throw new Error('Errore nel controllo scadenze')
    }
  }

  const showCriticalStockCommand = async () => {
    try {
      const { data: alerts, error } = await getInventoryAlerts({
        low_stock: true,
        reparto: currentUser.reparto
      })

      if (error) throw error

      const criticalCount = alerts?.length || 0
      const products = alerts?.slice(0, 3).map(item => item.prodotto).join(', ') || 'Nessuno'

      return {
        message: `${criticalCount} prodotti con rimanenze critiche: ${products}${criticalCount > 3 ? '...' : ''}`,
        speechMessage: criticalCount > 0 ? 
          `Trovati ${criticalCount} prodotti con rimanenze critiche. I primi sono: ${products}` :
          'Nessun prodotto ha rimanenze critiche al momento',
        data: { count: criticalCount, products: alerts }
      }
    } catch (error) {
      throw new Error('Errore nel controllo rimanenze')
    }
  }

  const completeTaskCommand = async (matches) => {
    const taskId = parseInt(matches[1])
    
    try {
      // Get current tasks to find the one to complete
      const { data: tasks, error: tasksError } = await getTasks({
        limit: 50,
        reparto: currentUser.reparto
      })
      
      if (tasksError) throw tasksError

      const taskToComplete = tasks?.find((task, index) => index + 1 === taskId) || 
                             tasks?.find(task => task.id === taskId)

      if (!taskToComplete) {
        throw new Error(`Task numero ${taskId} non trovato`)
      }

      if (taskToComplete.stato === 'completato') {
        return {
          message: `Task ${taskId} già completato`,
          speechMessage: `Il task numero ${taskId} è già stato completato`,
          data: taskToComplete
        }
      }

      const { data: updatedTask, error } = await updateTask(taskToComplete.id, {
        stato: 'completato',
        completato_il: new Date().toISOString()
      })

      if (error) throw error

      if (onTaskUpdated) {
        onTaskUpdated(updatedTask)
      }

      return {
        message: `Task ${taskId} completato: ${taskToComplete.titolo}`,
        speechMessage: `Task numero ${taskId} completato con successo`,
        data: updatedTask
      }
    } catch (error) {
      throw new Error(`Errore completamento task: ${error.message}`)
    }
  }

  const dashboardStatusCommand = async () => {
    try {
      const { data: tasks, error } = await getTasks({
        reparto: currentUser.reparto
      })

      if (error) throw error

      const total = tasks?.length || 0
      const completed = tasks?.filter(t => t.stato === 'completato').length || 0
      const inProgress = tasks?.filter(t => t.stato === 'in_corso').length || 0
      const pending = tasks?.filter(t => t.stato === 'da_fare').length || 0

      return {
        message: `Dashboard: ${total} task totali, ${completed} completati, ${inProgress} in corso, ${pending} da fare`,
        speechMessage: `Stato del dashboard: hai ${total} task totali di cui ${completed} completati, ${inProgress} in corso e ${pending} ancora da fare`,
        data: { total, completed, inProgress, pending }
      }
    } catch (error) {
      throw new Error('Errore lettura dashboard')
    }
  }

  const helpCommandsCommand = async () => {
    const commandList = Object.entries(commands)
      .slice(0, 4)
      .map(([name, data]) => `"${data.examples[0]}"`)
      .join(', ')

    return {
      message: `Comandi disponibili: ${commandList}`,
      speechMessage: `I principali comandi vocali sono: ${commandList}. Prova a dire uno di questi comandi.`,
      data: commands
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
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <Headphones className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Comandi Vocali</h2>
                  <p className="text-sm text-gray-600">Controllo vocale AI-powered</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setVoiceEnabled(!voiceEnabled)}
                  className={`p-2 rounded-full transition-colors ${
                    voiceEnabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                  }`}
                  title={voiceEnabled ? 'Disabilita feedback vocale' : 'Abilita feedback vocale'}
                >
                  {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  ×
                </button>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Microphone Control */}
            <div className="text-center">
              <motion.button
                onClick={isListening ? stopListening : startListening}
                disabled={isProcessing}
                className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 transition-all ${
                  isListening 
                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-2xl shadow-red-500/50' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white shadow-2xl shadow-blue-500/50'
                } ${isProcessing ? 'opacity-50' : ''}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={isListening ? { scale: [1, 1.1, 1] } : {}}
                transition={isListening ? { repeat: Infinity, duration: 1 } : {}}
              >
                {isProcessing ? (
                  <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : isListening ? (
                  <MicOff className="w-10 h-10" />
                ) : (
                  <Mic className="w-10 h-10" />
                )}
              </motion.button>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {isProcessing ? 'Elaborazione...' : isListening ? 'Ti ascolto...' : 'Tocca per parlare'}
              </h3>
              
              {transcript && (
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p className="text-blue-900 font-medium">"{transcript}"</p>
                </div>
              )}
            </div>

            {/* Command Result */}
            <AnimatePresence>
              {commandResult && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`p-4 rounded-xl border-2 ${
                    commandResult.type === 'success' 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {commandResult.type === 'success' ? (
                      <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-red-500 mt-1 flex-shrink-0" />
                    )}
                    <div>
                      <h4 className={`font-semibold ${
                        commandResult.type === 'success' ? 'text-green-900' : 'text-red-900'
                      }`}>
                        {commandResult.message}
                      </h4>
                      {commandResult.details && (
                        <p className={`text-sm mt-1 ${
                          commandResult.type === 'success' ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {commandResult.details}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Available Commands */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Settings className="w-4 h-4 mr-2" />
                Comandi Disponibili
              </h4>
              <div className="grid gap-3">
                {Object.entries(commands).map(([name, data]) => (
                  <motion.div
                    key={name}
                    className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900 mb-1">"{data.examples[0]}"</h5>
                        <p className="text-sm text-gray-600">{data.description}</p>
                      </div>
                      <Zap className="w-4 h-4 text-blue-500 ml-2 flex-shrink-0" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Usage Tips */}
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">💡 Suggerimenti</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Parla chiaramente e lentamente</li>
                <li>• Usa i comandi esattamente come negli esempi</li>
                <li>• Assicurati di avere il microfono abilitato</li>
                <li>• Il feedback vocale può essere disabilitato</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default VoiceCommands