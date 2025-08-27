import { useState, useEffect } from 'react'
import { Plus, Repeat, Edit, Trash2, ToggleLeft, ToggleRight, Star, Clock, Building2 } from 'lucide-react'
import { getRecurringTasks, createRecurringTask, updateRecurringTask } from '../lib/supabase'

const RecurringTasks = ({ currentUser }) => {
  const [recurringTasks, setRecurringTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingTask, setEditingTask] = useState(null)

  useEffect(() => {
    loadRecurringTasks()
  }, [])

  const loadRecurringTasks = async () => {
    try {
      setLoading(true)
      const { data, error } = await getRecurringTasks()
      
      if (error) throw error

      setRecurringTasks(data || [])
    } catch (error) {
      console.error('Error loading recurring tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleTaskStatus = async (task) => {
    try {
      const { data, error } = await updateRecurringTask(task.id, {
        attivo: !task.attivo
      })
      
      if (error) throw error

      setRecurringTasks(prev => 
        prev.map(t => t.id === task.id ? { ...t, attivo: !t.attivo } : t)
      )

      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(task.attivo ? 50 : 100)
      }
    } catch (error) {
      console.error('Error toggling task status:', error)
    }
  }

  const getDepartmentInfo = (reparto) => {
    const departments = {
      ortofrutta: { name: 'Ortofrutta', icon: '🥬', color: 'text-green-600' },
      macelleria: { name: 'Macelleria', icon: '🥩', color: 'text-red-600' },
      gastronomia: { name: 'Gastronomia', icon: '🍝', color: 'text-yellow-600' },
      panetteria: { name: 'Panetteria', icon: '🥖', color: 'text-orange-600' },
      magazzino: { name: 'Magazzino', icon: '📦', color: 'text-gray-600' },
      casse: { name: 'Casse', icon: '💰', color: 'text-blue-600' }
    }
    return departments[reparto] || { name: reparto, icon: '📝', color: 'text-gray-600' }
  }

  const getFrequencyInfo = (frequenza, giorni_settimana) => {
    switch (frequenza) {
      case 'daily':
        return { text: 'Giornaliero', icon: '📅' }
      case 'weekly':
        const giorni = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']
        const selectedDays = giorni_settimana?.map(d => giorni[d]).join(', ') || 'Tutti i giorni'
        return { text: `Settimanale (${selectedDays})`, icon: '📆' }
      case 'monthly':
        return { text: 'Mensile', icon: '🗓️' }
      default:
        return { text: frequenza, icon: '📋' }
    }
  }

  const getTimeSlotInfo = (fascia_oraria) => {
    const timeSlots = {
      mattina: { name: 'Mattina', icon: '🌅' },
      pomeriggio: { name: 'Pomeriggio', icon: '☀️' },
      sera: { name: 'Sera', icon: '🌙' }
    }
    return timeSlots[fascia_oraria] || { name: fascia_oraria, icon: '🕐' }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-eurospin-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Caricamento task ricorrenti...</p>
        </div>
      </div>
    )
  }

  const canManageRecurring = ['responsabile', 'admin'].includes(currentUser.ruolo)

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-lg mx-auto p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Task Ricorrenti</h1>
              <p className="text-sm text-gray-600">
                Template per task automatici
              </p>
            </div>
            
            {canManageRecurring && (
              <button
                onClick={() => setShowAddModal(true)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
              >
                <Plus className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto p-4">
        {!canManageRecurring && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="text-blue-600">ℹ️</div>
              <div>
                <h3 className="font-medium text-blue-900">Informazione</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Solo i responsabili e gli admin possono gestire i task ricorrenti. 
                  Puoi visualizzare i template esistenti.
                </p>
              </div>
            </div>
          </div>
        )}

        {recurringTasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔄</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nessun template ricorrente
            </h3>
            <p className="text-gray-600 mb-6">
              {canManageRecurring 
                ? 'Crea template per generare automaticamente task ricorrenti'
                : 'Non sono presenti template ricorrenti al momento'
              }
            </p>
            {canManageRecurring && (
              <button
                onClick={() => setShowAddModal(true)}
                className="btn btn-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Crea Template
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {recurringTasks.map((task) => {
              const departmentInfo = getDepartmentInfo(task.reparto)
              const frequencyInfo = getFrequencyInfo(task.frequenza, task.giorni_settimana)
              const timeSlotInfo = getTimeSlotInfo(task.fascia_oraria)

              return (
                <div
                  key={task.id}
                  className={`card ${task.attivo ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-gray-300 opacity-60'}`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{departmentInfo.icon}</span>
                      <div>
                        <span className={`text-sm font-medium ${departmentInfo.color}`}>
                          {departmentInfo.name}
                        </span>
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <span>{timeSlotInfo.icon}</span>
                          <span>{timeSlotInfo.name}</span>
                        </div>
                      </div>
                    </div>

                    {canManageRecurring && (
                      <button
                        onClick={() => toggleTaskStatus(task)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                      >
                        {task.attivo ? (
                          <ToggleRight className="w-6 h-6 text-green-600" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-gray-400" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {task.titolo_template}
                  </h3>

                  {/* Description */}
                  {task.descrizione_template && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {task.descrizione_template}
                    </p>
                  )}

                  {/* Priority */}
                  <div className="flex items-center mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= task.priorita
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="ml-2 text-xs text-gray-500">
                      Priorità {task.priorita}/5
                    </span>
                  </div>

                  {/* Frequency and Time */}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <span>{frequencyInfo.icon}</span>
                        <span>{frequencyInfo.text}</span>
                      </div>
                      
                      {task.tempo_stimato && (
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{task.tempo_stimato}min</span>
                        </div>
                      )}
                    </div>

                    {canManageRecurring && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingTask(task)}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                          <Edit className="w-4 h-4 text-gray-400 hover:text-blue-600" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div className="mt-3 flex items-center justify-between">
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      task.attivo 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      <div className={`w-2 h-2 rounded-full mr-2 ${
                        task.attivo ? 'bg-green-400' : 'bg-gray-400'
                      }`} />
                      {task.attivo ? 'Attivo' : 'Disattivato'}
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
            💡 Come funzionano i task ricorrenti
          </h4>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• I template attivi generano automaticamente nuovi task</li>
            <li>• La generazione avviene ogni giorno a mezzanotte</li>
            <li>• I task vengono creati in base alla frequenza impostata</li>
            <li>• I task generati possono essere modificati normalmente</li>
          </ul>
        </div>
      </div>

      {/* Modals would go here - AddRecurringTaskModal, etc. */}
      {/* For now, we'll skip the modal implementation to keep the example focused */}
    </div>
  )
}

export default RecurringTasks