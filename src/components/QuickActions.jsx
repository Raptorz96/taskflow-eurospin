import { useState } from 'react'
import { X, Zap } from 'lucide-react'
import { createTask } from '../lib/supabase'

const QuickActions = ({ currentUser, onTaskCreated, onClose }) => {
  const [loading, setLoading] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState(null)

  const quickTemplates = [
    {
      id: 1,
      title: '🧹 Pulizie Mattina',
      description: 'Pulizia generale del reparto e sistemazione area',
      priorita: 4,
      tempo_stimato: 45,
      fascia_oraria: 'mattina',
      icon: '🧹',
      color: 'from-blue-400 to-blue-600'
    },
    {
      id: 2,
      title: '🏷️ Cambio Promo',
      description: 'Aggiornamento prezzi e cartellini promozionali',
      priorita: 5,
      tempo_stimato: 60,
      fascia_oraria: 'mattina',
      icon: '🏷️',
      color: 'from-green-400 to-green-600'
    },
    {
      id: 3,
      title: '📅 Controllo Scadenze',
      description: 'Verifica prodotti in scadenza e rimozione articoli scaduti',
      priorita: 5,
      tempo_stimato: 30,
      fascia_oraria: 'mattina',
      icon: '📅',
      color: 'from-red-400 to-red-600'
    },
    {
      id: 4,
      title: '📊 Inventario Veloce',
      description: 'Conteggio rapido prodotti principali',
      priorita: 3,
      tempo_stimato: 90,
      fascia_oraria: 'pomeriggio',
      icon: '📊',
      color: 'from-purple-400 to-purple-600'
    },
    {
      id: 5,
      title: '📦 Riordino Scaffali',
      description: 'Sistemazione prodotti secondo planogramma',
      priorita: 3,
      tempo_stimato: 120,
      fascia_oraria: 'pomeriggio',
      icon: '📦',
      color: 'from-orange-400 to-orange-600'
    },
    {
      id: 6,
      title: '💰 Chiusura Casse',
      description: 'Controllo incassi e chiusura registratori',
      priorita: 5,
      tempo_stimato: 30,
      fascia_oraria: 'sera',
      icon: '💰',
      color: 'from-yellow-400 to-yellow-600'
    },
    {
      id: 7,
      title: '🌙 Pulizie Sera',
      description: 'Pulizia finale e preparazione per il giorno successivo',
      priorita: 4,
      tempo_stimato: 60,
      fascia_oraria: 'sera',
      icon: '🌙',
      color: 'from-indigo-400 to-indigo-600'
    },
    {
      id: 8,
      title: '🌡️ Controllo Temperature',
      description: 'Verifica temperature frigoriferi e congelatori',
      priorita: 5,
      tempo_stimato: 20,
      fascia_oraria: 'mattina',
      icon: '🌡️',
      color: 'from-cyan-400 to-cyan-600'
    }
  ]

  const handleTemplateClick = async (template) => {
    if (loading) return

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(50)
    }

    setSelectedTemplate(template.id)
    setLoading(true)

    try {
      const taskData = {
        titolo: template.title,
        descrizione: template.description,
        priorita: template.priorita,
        tempo_stimato: template.tempo_stimato,
        reparto: currentUser.reparto || 'magazzino',
        fascia_oraria: template.fascia_oraria,
        stato: 'da_fare',
        creato_da: currentUser.id,
        data_scadenza: new Date().toISOString().split('T')[0] // Today
      }

      const { data, error } = await createTask(taskData)
      
      if (error) throw error

      if (data && data[0]) {
        onTaskCreated(data[0])
        
        // Success feedback
        if (navigator.vibrate) {
          navigator.vibrate([100, 50, 100])
        }

        // Auto close after success
        setTimeout(() => {
          onClose()
        }, 500)
      }
    } catch (error) {
      console.error('Error creating task:', error)
      
      // Error feedback
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200])
      }
    } finally {
      setLoading(false)
      setSelectedTemplate(null)
    }
  }

  const getTimeSlotEmoji = (fascia_oraria) => {
    const slots = {
      mattina: '🌅',
      pomeriggio: '☀️',
      sera: '🌙'
    }
    return slots[fascia_oraria] || '🕐'
  }

  const getPriorityStars = (priority) => {
    return '⭐'.repeat(priority)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center sm:justify-center">
      <div className="bg-white w-full max-w-lg mx-auto rounded-t-2xl sm:rounded-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-eurospin-blue" />
            <h2 className="text-lg font-semibold text-gray-900">
              Azioni Rapide
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-sm text-gray-600 mb-4">
            Crea rapidamente task comuni con un semplice tocco
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {quickTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleTemplateClick(template)}
                disabled={loading}
                className={`
                  relative overflow-hidden rounded-xl p-4 text-left transition-all duration-200
                  ${loading && selectedTemplate === template.id
                    ? 'scale-95 opacity-75'
                    : 'hover:scale-105 active:scale-95'
                  }
                  ${loading ? 'cursor-not-allowed' : 'cursor-pointer'}
                  bg-gradient-to-br ${template.color} text-white shadow-lg hover:shadow-xl
                `}
              >
                {/* Loading overlay */}
                {loading && selectedTemplate === template.id && (
                  <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}

                {/* Icon */}
                <div className="text-2xl mb-2">{template.icon}</div>

                {/* Title */}
                <h3 className="font-semibold text-sm mb-1 line-clamp-2">
                  {template.title.replace(template.icon, '').trim()}
                </h3>

                {/* Description */}
                <p className="text-xs text-white text-opacity-90 mb-3 line-clamp-2">
                  {template.description}
                </p>

                {/* Meta info */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span>{getTimeSlotEmoji(template.fascia_oraria)}</span>
                    <span>{template.tempo_stimato}min</span>
                  </div>
                  <div className="flex items-center">
                    <span>{getPriorityStars(template.priorita)}</span>
                  </div>
                </div>

                {/* Ripple effect */}
                <div className="absolute inset-0 rounded-xl opacity-0 hover:opacity-10 transition-opacity bg-white" />
              </button>
            ))}
          </div>

          {/* Tips */}
          <div className="mt-6 p-3 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-1">
              💡 Suggerimento
            </h4>
            <p className="text-xs text-blue-700">
              I task creati saranno assegnati al tuo reparto ({currentUser.reparto || 'magazzino'}) 
              e potrai modificarli dalla sezione Task.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuickActions