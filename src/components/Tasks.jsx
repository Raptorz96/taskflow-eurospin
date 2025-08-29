import { useState, useEffect } from 'react'
import { Search, Filter, SortAsc, Plus, Calendar, User, Building2, Star } from 'lucide-react'
import { getTasks, subscribeToTasks } from '../lib/supabase'
import TaskCard from './TaskCard'
import AddTaskModal from './AddTaskModal'

const Tasks = ({ currentUser }) => {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    stato: 'all',
    reparto: 'all',
    priorita: 'all',
    assegnato_a: 'all'
  })
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [showFilters, setShowFilters] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)

  const stati = [
    { value: 'all', label: 'Tutti gli stati' },
    { value: 'da_fare', label: 'Da fare' },
    { value: 'in_corso', label: 'In corso' },
    { value: 'completato', label: 'Completato' }
  ]

  const reparti = [
    { value: 'all', label: 'Tutti i reparti' },
    { value: 'ortofrutta', label: 'Ortofrutta', icon: '🥬' },
    { value: 'macelleria', label: 'Macelleria', icon: '🥩' },
    { value: 'gastronomia', label: 'Gastronomia', icon: '🍝' },
    { value: 'panetteria', label: 'Panetteria', icon: '🥖' },
    { value: 'magazzino', label: 'Magazzino', icon: '📦' },
    { value: 'casse', label: 'Casse', icon: '💰' }
  ]

  const priorita = [
    { value: 'all', label: 'Tutte le priorità' },
    { value: '5', label: '⭐⭐⭐⭐⭐ Critica' },
    { value: '4', label: '⭐⭐⭐⭐ Alta' },
    { value: '3', label: '⭐⭐⭐ Media' },
    { value: '2', label: '⭐⭐ Bassa' },
    { value: '1', label: '⭐ Molto bassa' }
  ]

  const sortOptions = [
    { value: 'created_at', label: 'Data creazione' },
    { value: 'data_scadenza', label: 'Data scadenza' },
    { value: 'priorita', label: 'Priorità' },
    { value: 'titolo', label: 'Titolo' }
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
  }, [])

  const loadTasks = async () => {
    try {
      setLoading(true)
      const { data, error } = await getTasks()
      
      if (error) throw error

      setTasks(data || [])
    } catch (error) {
      console.error('Error loading tasks:', error)
    } finally {
      setLoading(false)
    }
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
    // Implementation for task assignment
    console.log('Assign task:', task)
  }

  const handleOpenComments = (task) => {
    // Implementation for comments
    console.log('Open comments for task:', task)
  }

  const resetFilters = () => {
    setFilters({
      stato: 'all',
      reparto: 'all',
      priorita: 'all',
      assegnato_a: 'all'
    })
    setSearchTerm('')
    setSortBy('created_at')
    setSortOrder('desc')
  }

  const getFilteredAndSortedTasks = () => {
    let filtered = tasks.filter(task => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        if (!task.titolo.toLowerCase().includes(searchLower) &&
            !task.descrizione?.toLowerCase().includes(searchLower)) {
          return false
        }
      }

      // Status filter
      if (filters.stato !== 'all' && task.stato !== filters.stato) {
        return false
      }

      // Department filter
      if (filters.reparto !== 'all' && task.reparto !== filters.reparto) {
        return false
      }

      // Priority filter
      if (filters.priorita !== 'all' && task.priorita !== parseInt(filters.priorita)) {
        return false
      }

      // Assignment filter
      if (filters.assegnato_a !== 'all') {
        if (filters.assegnato_a === 'me' && task.assegnato_a !== currentUser.id) {
          return false
        }
        if (filters.assegnato_a === 'unassigned' && task.assegnato_a) {
          return false
        }
        if (filters.assegnato_a === 'others' && 
            (task.assegnato_a === currentUser.id || !task.assegnato_a)) {
          return false
        }
      }

      return true
    })

    // Sort
    filtered.sort((a, b) => {
      let aVal = a[sortBy]
      let bVal = b[sortBy]

      // Handle null values
      if (aVal == null) aVal = sortOrder === 'asc' ? '' : 'zzz'
      if (bVal == null) bVal = sortOrder === 'asc' ? '' : 'zzz'

      // Convert to comparable values
      if (sortBy === 'priorita') {
        aVal = parseInt(aVal) || 0
        bVal = parseInt(bVal) || 0
      } else if (sortBy === 'created_at' || sortBy === 'data_scadenza') {
        aVal = new Date(aVal)
        bVal = new Date(bVal)
      } else {
        aVal = String(aVal).toLowerCase()
        bVal = String(bVal).toLowerCase()
      }

      if (sortOrder === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0
      }
    })

    return filtered
  }

  const filteredTasks = getFilteredAndSortedTasks()
  const hasActiveFilters = Object.values(filters).some(f => f !== 'all') || searchTerm

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Caricamento task...</p>
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
            <h1 className="text-xl font-bold text-gray-900">Task</h1>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-full transition-colors ${
                  showFilters || hasActiveFilters 
                    ? 'bg-blue-600 text-white' 
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <Filter className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cerca task..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">Filtri</h3>
                {hasActiveFilters && (
                  <button
                    onClick={resetFilters}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Reset
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3">
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stato
                  </label>
                  <select
                    value={filters.stato}
                    onChange={(e) => setFilters(prev => ({ ...prev, stato: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    {stati.map(stato => (
                      <option key={stato.value} value={stato.value}>
                        {stato.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Department Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reparto
                  </label>
                  <select
                    value={filters.reparto}
                    onChange={(e) => setFilters(prev => ({ ...prev, reparto: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    {reparti.map(reparto => (
                      <option key={reparto.value} value={reparto.value}>
                        {reparto.icon ? `${reparto.icon} ` : ''}{reparto.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Priority Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priorità
                    </label>
                    <select
                      value={filters.priorita}
                      onChange={(e) => setFilters(prev => ({ ...prev, priorita: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      {priorita.map(prio => (
                        <option key={prio.value} value={prio.value}>
                          {prio.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Assignment Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assegnazione
                    </label>
                    <select
                      value={filters.assegnato_a}
                      onChange={(e) => setFilters(prev => ({ ...prev, assegnato_a: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="all">Tutti</option>
                      <option value="me">Assegnati a me</option>
                      <option value="unassigned">Non assegnati</option>
                      <option value="others">Assegnati ad altri</option>
                    </select>
                  </div>
                </div>

                {/* Sort Options */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ordina per
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      {sortOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ordine
                    </label>
                    <select
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="desc">Decrescente</option>
                      <option value="asc">Crescente</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Results Summary */}
          <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
            <span>
              {filteredTasks.length} task {filteredTasks.length === 1 ? 'trovato' : 'trovati'}
              {hasActiveFilters && ` (su ${tasks.length} totali)`}
            </span>
            {sortBy !== 'created_at' && (
              <span className="flex items-center">
                <SortAsc className="w-4 h-4 mr-1" />
                {sortOptions.find(opt => opt.value === sortBy)?.label}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="max-w-lg mx-auto p-4">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">
              {hasActiveFilters ? '🔍' : '📋'}
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {hasActiveFilters ? 'Nessun risultato' : 'Nessun task presente'}
            </h3>
            <p className="text-gray-600 mb-6">
              {hasActiveFilters 
                ? 'Prova a modificare i filtri di ricerca'
                : 'Crea il tuo primo task per iniziare'
              }
            </p>
            {hasActiveFilters ? (
              <button
                onClick={resetFilters}
                className="btn btn-secondary"
              >
                Rimuovi filtri
              </button>
            ) : (
              <button
                onClick={() => setShowAddModal(true)}
                className="btn btn-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Crea Task
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task) => (
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
        )}
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <AddTaskModal
          currentUser={currentUser}
          onTaskCreated={handleTaskCreated}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  )
}

export default Tasks