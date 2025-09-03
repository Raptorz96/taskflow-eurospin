import { useState, useEffect } from 'react'
import { X, Plus, Star, Clock, Calendar, User, Building2 } from 'lucide-react'
import { createTask, getUserProfile } from '../lib/supabase'

const AddTaskModal = ({ currentUser, onTaskCreated, onClose, editTask = null }) => {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    titolo: '',
    descrizione: '',
    priorita: 3,
    tempo_stimato: 30,
    reparto: currentUser.reparto || '',
    fascia_oraria: 'mattina',
    data_scadenza: new Date().toISOString().split('T')[0],
    assegnato_a: ''
  })
  const [profiles, setProfiles] = useState([])

  const reparti = [
    { value: 'ortofrutta', label: 'Ortofrutta', icon: '🥬', color: 'text-green-600' },
    { value: 'macelleria', label: 'Macelleria', icon: '🥩', color: 'text-red-600' },
    { value: 'gastronomia', label: 'Gastronomia', icon: '🍝', color: 'text-yellow-600' },
    { value: 'panetteria', label: 'Panetteria', icon: '🥖', color: 'text-orange-600' },
    { value: 'magazzino', label: 'Magazzino', icon: '📦', color: 'text-gray-600' },
    { value: 'casse', label: 'Casse', icon: '💰', color: 'text-blue-600' }
  ]

  const fasceOrarie = [
    { value: 'mattina', label: 'Mattina', time: '6:00-13:00', icon: '🌅' },
    { value: 'pomeriggio', label: 'Pomeriggio', time: '13:00-18:00', icon: '☀️' },
    { value: 'sera', label: 'Sera', time: '18:00-22:00', icon: '🌙' }
  ]

  useEffect(() => {
    if (editTask) {
      setFormData({
        titolo: editTask.titolo || '',
        descrizione: editTask.descrizione || '',
        priorita: editTask.priorita || 3,
        tempo_stimato: editTask.tempo_stimato || 30,
        reparto: editTask.reparto || currentUser.reparto || '',
        fascia_oraria: editTask.fascia_oraria || 'mattina',
        data_scadenza: editTask.data_scadenza?.split('T')[0] || new Date().toISOString().split('T')[0],
        assegnato_a: editTask.assegnato_a || ''
      })
    }
  }, [editTask, currentUser.reparto])

  const handleChange = (e) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }))
  }

  const handlePriorityChange = (priority) => {
    setFormData(prev => ({ ...prev, priorita: priority }))
    
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(30)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const taskData = {
        ...formData,
        creato_da: currentUser.id,
        stato: 'da_fare',
        assegnato_a: formData.assegnato_a || null
      }

      const { data, error } = await createTask(taskData)
      
      if (error) throw error

      if (data && data[0]) {
        onTaskCreated(data[0])
        
        // Success feedback
        if (navigator.vibrate) {
          navigator.vibrate([100, 50, 100])
        }
        
        onClose()
      }
    } catch (error) {
      console.error('Error creating task:', error)
      
      // Error feedback
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200])
      }
    } finally {
      setLoading(false)
    }
  }

  const getMinDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  const getPriorityColor = (priority) => {
    const colors = {
      1: 'text-gray-400',
      2: 'text-blue-400',
      3: 'text-yellow-400',
      4: 'text-orange-400',
      5: 'text-red-400'
    }
    return colors[priority] || 'text-gray-400'
  }

  const getPriorityLabel = (priority) => {
    const labels = {
      1: 'Molto Bassa',
      2: 'Bassa',
      3: 'Media',
      4: 'Alta',
      5: 'Critica'
    }
    return labels[priority] || 'Media'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center sm:justify-center">
      <div className="bg-white w-full max-w-lg mx-auto rounded-t-2xl sm:rounded-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Plus className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              {editTask ? 'Modifica Task' : 'Nuovo Task'}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="titolo" className="block text-sm font-medium text-gray-700 mb-1">
              Titolo *
            </label>
            <input
              type="text"
              id="titolo"
              name="titolo"
              required
              value={formData.titolo}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              style={{
                WebkitTextFillColor: '#111827',
                color: '#111827',
                backgroundColor: '#ffffff',
                fontSize: '16px',
                opacity: 1
              }}
              placeholder="es. Controllo temperature frigoriferi"
              maxLength={100}
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="descrizione" className="block text-sm font-medium text-gray-700 mb-1">
              Descrizione
            </label>
            <textarea
              id="descrizione"
              name="descrizione"
              value={formData.descrizione}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none"
              style={{
                WebkitTextFillColor: '#111827',
                color: '#111827',
                backgroundColor: '#ffffff',
                fontSize: '16px',
                opacity: 1
              }}
              placeholder="Descrizione dettagliata del task (opzionale)"
              maxLength={500}
            />
            <div className="text-xs text-gray-500 text-right mt-1">
              {formData.descrizione.length}/500
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priorità: {getPriorityLabel(formData.priorita)}
            </label>
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((priority) => (
                <button
                  key={priority}
                  type="button"
                  onClick={() => handlePriorityChange(priority)}
                  className="p-1 rounded transition-transform hover:scale-110 active:scale-95"
                >
                  <Star
                    className={`w-8 h-8 ${
                      priority <= formData.priorita
                        ? `${getPriorityColor(priority)} fill-current`
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Time and Department Row */}
          <div className="grid grid-cols-2 gap-3">
            {/* Estimated Time */}
            <div>
              <label htmlFor="tempo_stimato" className="block text-sm font-medium text-gray-700 mb-1">
                <Clock className="w-4 h-4 inline mr-1" />
                Tempo (min)
              </label>
              <input
                type="number"
                id="tempo_stimato"
                name="tempo_stimato"
                value={formData.tempo_stimato}
                onChange={handleChange}
                min="5"
                max="480"
                step="5"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                style={{
                  WebkitTextFillColor: '#111827',
                  color: '#111827',
                  backgroundColor: '#ffffff',
                  fontSize: '16px',
                  opacity: 1
                }}
              />
            </div>

            {/* Department */}
            <div>
              <label htmlFor="reparto" className="block text-sm font-medium text-gray-700 mb-1">
                <Building2 className="w-4 h-4 inline mr-1" />
                Reparto *
              </label>
              <select
                id="reparto"
                name="reparto"
                required
                value={formData.reparto}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                style={{
                  WebkitTextFillColor: '#111827',
                  color: '#111827',
                  backgroundColor: '#ffffff',
                  fontSize: '16px',
                  opacity: 1
                }}
              >
                <option value="">Seleziona</option>
                {reparti.map((reparto) => (
                  <option key={reparto.value} value={reparto.value}>
                    {reparto.icon} {reparto.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Time Slot */}
          <div>
            <label htmlFor="fascia_oraria" className="block text-sm font-medium text-gray-700 mb-1">
              Fascia Oraria *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {fasceOrarie.map((fascia) => (
                <button
                  key={fascia.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, fascia_oraria: fascia.value }))}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    formData.fascia_oraria === fascia.value
                      ? 'border-blue-600 bg-blue-50 text-blue-600'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-xl mb-1">{fascia.icon}</div>
                    <div className="text-xs font-medium">{fascia.label}</div>
                    <div className="text-xs text-gray-500">{fascia.time}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label htmlFor="data_scadenza" className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="w-4 h-4 inline mr-1" />
              Data Scadenza
            </label>
            <input
              type="date"
              id="data_scadenza"
              name="data_scadenza"
              value={formData.data_scadenza}
              onChange={handleChange}
              min={getMinDate()}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              style={{
                WebkitTextFillColor: '#111827',
                color: '#111827',
                backgroundColor: '#ffffff',
                fontSize: '16px',
                opacity: 1
              }}
            />
          </div>

          {/* Assign To (for managers) */}
          {['responsabile', 'admin'].includes(currentUser.ruolo) && (
            <div>
              <label htmlFor="assegnato_a" className="block text-sm font-medium text-gray-700 mb-1">
                <User className="w-4 h-4 inline mr-1" />
                Assegna a
              </label>
              <select
                id="assegnato_a"
                name="assegnato_a"
                value={formData.assegnato_a}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                style={{
                  WebkitTextFillColor: '#111827',
                  color: '#111827',
                  backgroundColor: '#ffffff',
                  fontSize: '16px',
                  opacity: 1
                }}
              >
                <option value="">Non assegnato</option>
                <option value={currentUser.id}>Me stesso</option>
                {/* Add other team members here */}
              </select>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 btn btn-secondary"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={loading || !formData.titolo.trim()}
              className="flex-1 btn btn-primary flex items-center justify-center"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              {editTask ? 'Salva' : 'Crea Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddTaskModal