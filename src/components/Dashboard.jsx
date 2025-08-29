import { useState, useEffect } from 'react'
import { Plus, Zap, Calendar, BarChart3, RefreshCw, Filter, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { getTasks, subscribeToTasks } from '../lib/supabase'
import TaskCard from './TaskCard'
import AddTaskModal from './AddTaskModal'
import QuickActions from './QuickActions'

const Dashboard = ({ currentUser }) => {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [viewMode, setViewMode] = useState('day') // 'day' or 'week'
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showQuickActions, setShowQuickActions] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const timeSlots = [
    { value: 'all', label: 'Tutti', icon: '📋' },
    { value: 'mattina', label: 'Mattina', icon: '🌅', time: '6:00-13:00' },
    { value: 'pomeriggio', label: 'Pomeriggio', icon: '☀️', time: '13:00-18:00' },
    { value: 'sera', label: 'Sera', icon: '🌙', time: '18:00-22:00' }
  ]

  useEffect(() => {
    loadTasks()
    
    // Set up real-time subscription
    const subscription = subscribeToTasks(() => {
      loadTasks()
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [selectedTimeSlot])

  const loadTasks = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      const filters = {}
      if (selectedTimeSlot !== 'all') {
        filters.fascia_oraria = selectedTimeSlot
      }

      const { data, error } = await getTasks(filters)
      
      if (error) throw error

      setTasks(data || [])
      setLastRefresh(new Date())
    } catch (error) {
      console.error('Error loading tasks:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(50)
    }
    
    loadTasks(true)
  }

  const handleTaskUpdate = (updatedTask) => {
    setTasks(prev => prev.map(task => 
      task.id === updatedTask.id ? updatedTask : task
    ))
  }

  const handleTaskCreated = (newTask) => {
    setTasks(prev => [newTask, ...prev])
  }

  const handleAssignTask = (task) => {
    // Implementation for task assignment modal
    console.log('Assign task:', task)
  }

  const handleOpenComments = (task) => {
    // Implementation for comments modal
    console.log('Open comments for task:', task)
  }

  const getTaskStats = () => {
    const total = tasks.length
    const completed = tasks.filter(t => t.stato === 'completato').length
    const inProgress = tasks.filter(t => t.stato === 'in_corso').length
    const pending = tasks.filter(t => t.stato === 'da_fare').length
    const overdue = tasks.filter(t => {
      if (!t.data_scadenza) return false
      const dueDate = new Date(t.data_scadenza)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return dueDate < today && t.stato !== 'completato'
    }).length

    return { total, completed, inProgress, pending, overdue }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    const name = currentUser.nome?.split(' ')[0] || 'Utente'
    
    if (hour < 12) return `Buongiorno, ${name}!`
    if (hour < 18) return `Buon pomeriggio, ${name}!`
    return `Buonasera, ${name}!`
  }

  const getCurrentTimeSlot = () => {
    const hour = new Date().getHours()
    if (hour >= 6 && hour < 13) return 'mattina'
    if (hour >= 13 && hour < 18) return 'pomeriggio'
    return 'sera'
  }

  const filteredTasks = tasks.filter(task => {
    if (selectedTimeSlot === 'all') return true
    return task.fascia_oraria === selectedTimeSlot
  })

  const tasksByStatus = {
    da_fare: filteredTasks.filter(t => t.stato === 'da_fare'),
    in_corso: filteredTasks.filter(t => t.stato === 'in_corso'),
    completato: filteredTasks.filter(t => t.stato === 'completato')
  }

  const stats = getTaskStats()
  const currentSlot = getCurrentTimeSlot()

  if (loading && !refreshing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Caricamento dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-lg mx-auto p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {getGreeting()}
              </h1>
              <p className="text-sm text-gray-600">
                {currentUser.ruolo} - {currentUser.reparto}
              </p>
            </div>
            
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <RefreshCw className={`w-5 h-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-lg font-bold text-blue-600">{stats.total}</div>
              <div className="text-xs text-blue-600">Totali</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-lg font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-xs text-yellow-600">Da fare</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-lg font-bold text-orange-600">{stats.inProgress}</div>
              <div className="text-xs text-orange-600">In corso</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-lg font-bold text-green-600">{stats.completed}</div>
              <div className="text-xs text-green-600">Completati</div>
            </div>
          </div>

          {/* Overdue Alert */}
          {stats.overdue > 0 && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
                <span className="text-sm text-red-800">
                  {stats.overdue} task {stats.overdue === 1 ? 'scaduto' : 'scaduti'}
                </span>
              </div>
            </div>
          )}

          {/* Time Slot Filter */}
          <div className="flex space-x-1 mb-4">
            {timeSlots.map((slot) => (
              <button
                key={slot.value}
                onClick={() => setSelectedTimeSlot(slot.value)}
                className={`flex-1 p-2 rounded-lg text-xs font-medium transition-colors ${
                  selectedTimeSlot === slot.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                } ${slot.value === currentSlot ? 'ring-2 ring-blue-300 ring-opacity-50' : ''}`}
              >
                <div className="flex flex-col items-center">
                  <span className="text-sm mb-1">{slot.icon}</span>
                  <span>{slot.label}</span>
                  {slot.time && (
                    <span className="text-xs opacity-75">{slot.time}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto p-4">
        {/* Quick Actions (for managers) */}
        {['responsabile', 'admin'].includes(currentUser.ruolo) && (
          <div className="mb-6">
            <button
              onClick={() => setShowQuickActions(true)}
              className="w-full p-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95"
            >
              <div className="flex items-center justify-center space-x-2">
                <Zap className="w-5 h-5" />
                <span className="font-medium">Azioni Rapide</span>
              </div>
              <p className="text-sm text-blue-100 mt-1">
                Crea task comuni con un tocco
              </p>
            </button>
          </div>
        )}

        {/* Task Lists */}
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nessun task presente
            </h3>
            <p className="text-gray-600 mb-6">
              {selectedTimeSlot === 'all' 
                ? 'Non ci sono task da visualizzare'
                : `Nessun task per ${timeSlots.find(s => s.value === selectedTimeSlot)?.label.toLowerCase()}`
              }
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Crea Primo Task
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Pending Tasks */}
            {tasksByStatus.da_fare.length > 0 && (
              <div>
                <h3 className="flex items-center text-sm font-medium text-gray-600 mb-3">
                  <Clock className="w-4 h-4 mr-2" />
                  Da fare ({tasksByStatus.da_fare.length})
                </h3>
                <div className="space-y-3">
                  {tasksByStatus.da_fare.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      currentUser={currentUser}
                      onUpdate={handleTaskUpdate}
                      onOpenComments={handleOpenComments}
                      onAssign={handleAssignTask}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* In Progress Tasks */}
            {tasksByStatus.in_corso.length > 0 && (
              <div>
                <h3 className="flex items-center text-sm font-medium text-gray-600 mb-3">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  In corso ({tasksByStatus.in_corso.length})
                </h3>
                <div className="space-y-3">
                  {tasksByStatus.in_corso.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      currentUser={currentUser}
                      onUpdate={handleTaskUpdate}
                      onOpenComments={handleOpenComments}
                      onAssign={handleAssignTask}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Completed Tasks */}
            {tasksByStatus.completato.length > 0 && (
              <div>
                <h3 className="flex items-center text-sm font-medium text-gray-600 mb-3">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Completati ({tasksByStatus.completato.length})
                </h3>
                <div className="space-y-3">
                  {tasksByStatus.completato.slice(0, 5).map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      currentUser={currentUser}
                      onUpdate={handleTaskUpdate}
                      onOpenComments={handleOpenComments}
                      onAssign={handleAssignTask}
                    />
                  ))}
                  {tasksByStatus.completato.length > 5 && (
                    <p className="text-center text-sm text-gray-500">
                      +{tasksByStatus.completato.length - 5} altri completati
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Last Refresh */}
        <div className="text-center text-xs text-gray-400 mt-8">
          Ultimo aggiornamento: {lastRefresh.toLocaleTimeString('it-IT')}
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-20 right-4">
        <button
          onClick={() => setShowAddModal(true)}
          className="w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center justify-center"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddTaskModal
          currentUser={currentUser}
          onTaskCreated={handleTaskCreated}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {showQuickActions && (
        <QuickActions
          currentUser={currentUser}
          onTaskCreated={handleTaskCreated}
          onClose={() => setShowQuickActions(false)}
        />
      )}
    </div>
  )
}

export default Dashboard