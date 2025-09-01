import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Zap, Calendar, BarChart3, RefreshCw, Filter, Clock, CheckCircle, AlertCircle, Tag, Camera, Users, Target, TrendingUp, Bell, ChevronDown, ChevronUp } from 'lucide-react'
import { getTasks, subscribeToTasks, getOrdiniOggi, getScadenzeStats, supabase, createTask } from '../lib/supabase'
import TaskCard from './TaskCard'
import AddTaskModal from './AddTaskModal'
import QuickActions from './QuickActions'
import OrderManager from './OrderManager'
import CamionIndicator from './CamionIndicator'
import ProductAlerts from './ProductAlerts'
import CameraCapture from './CameraCapture'
import QuickCameraInput from './QuickCameraInput'

const Dashboard = ({ currentUser }) => {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [viewMode, setViewMode] = useState('day') // 'day' or 'week'
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showQuickActions, setShowQuickActions] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [hasOrdersToday, setHasOrdersToday] = useState(false)
  const [hasCamion, setHasCamion] = useState(false)
  const [expirationStats, setExpirationStats] = useState(null)
  const [promoNotification, setPromoNotification] = useState(null)
  const [showCamera, setShowCamera] = useState(false)
  const [showCameraInput, setShowCameraInput] = useState(false)
  const [capturedPhoto, setCapturedPhoto] = useState(null)
  const [cameraUsageCount, setCameraUsageCount] = useState(() => {
    return parseInt(localStorage.getItem('camera_usage_count') || '0')
  })
  const [headerCollapsed, setHeaderCollapsed] = useState(false)
  const [teamOnline, setTeamOnline] = useState(0)

  const timeSlots = [
    { value: 'all', label: 'Tutti', icon: '📋' },
    { value: 'mattina', label: 'Mattina', icon: '🌅', time: '6:00-13:00' },
    { value: 'pomeriggio', label: 'Pomeriggio', icon: '☀️', time: '13:00-18:00' },
    { value: 'sera', label: 'Sera', icon: '🌙', time: '18:00-22:00' }
  ]

  useEffect(() => {
    loadTasks()
    checkOrdersToday()
    loadExpirationStats()
    checkPromoNotifications()
    
    // Set up real-time subscription
    const subscription = subscribeToTasks(() => {
      loadTasks()
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [selectedTimeSlot])

  const checkOrdersToday = async () => {
    try {
      const { data } = await getOrdiniOggi()
      setHasOrdersToday(data && data.length > 0)
    } catch (error) {
      console.error('Error checking orders:', error)
    }
  }

  const loadExpirationStats = async () => {
    try {
      const { data, error } = await getScadenzeStats()
      if (error) throw error
      setExpirationStats(data)
    } catch (error) {
      console.error('Error loading expiration stats:', error)
    }
  }

  const checkPromoNotifications = async () => {
    try {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowStr = tomorrow.toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('promo_config')
        .select('*')
        .eq('data_inizio', tomorrowStr)
        .eq('stato', 'preparazione')

      if (error) throw error
      
      if (data && data.length > 0) {
        setPromoNotification(data[0])
      }
    } catch (error) {
      console.error('Error checking promo notifications:', error)
    }
  }

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

  const handleCamionChange = (camionState) => {
    setHasCamion(camionState)
  }

  const handleCameraCapture = (photoData) => {
    setCapturedPhoto(photoData)
    setShowCamera(false)
    setShowCameraInput(true)
    
    // Update usage count
    const newCount = cameraUsageCount + 1
    setCameraUsageCount(newCount)
    localStorage.setItem('camera_usage_count', newCount.toString())
  }

  const handleCameraTaskSave = async (taskData) => {
    try {
      // Upload photo to Supabase storage if needed
      let photoUrl = null
      if (taskData.photo_url && taskData.photo_url.startsWith('data:')) {
        // Convert base64 to blob and upload
        const response = await fetch(taskData.photo_url)
        const blob = await response.blob()
        const fileName = `task-photo-${Date.now()}.jpg`
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('task-photos')
          .upload(fileName, blob, {
            contentType: 'image/jpeg'
          })

        if (!uploadError && uploadData) {
          const { data: { publicUrl } } = supabase.storage
            .from('task-photos')
            .getPublicUrl(uploadData.path)
          photoUrl = publicUrl
        }
      }

      // Create task with photo data
      const newTaskData = {
        titolo: taskData.titolo,
        descrizione: taskData.descrizione,
        categoria: taskData.categoria,
        priorita: taskData.priorita,
        stato: 'da_fare',
        assegnato_a: currentUser.id,
        creato_da: currentUser.id,
        data_scadenza: taskData.scadenza || null,
        reparto: taskData.reparto || currentUser.reparto,
        photo_url: photoUrl,
        captured_data: taskData.captured_data,
        extracted_text: taskData.extracted_text
      }

      const { data: newTask, error } = await createTask(newTaskData)
      
      if (error) throw error

      handleTaskCreated(newTask)
      setShowCameraInput(false)
      setCapturedPhoto(null)

      // Show success feedback
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100])
      }
    } catch (error) {
      console.error('Error saving camera task:', error)
      alert('Errore durante il salvataggio del task')
    }
  }

  const isNearSuggestedTime = (orario_suggerito) => {
    if (!orario_suggerito) return false
    
    const now = new Date()
    const currentTime = now.getHours() * 60 + now.getMinutes()
    
    const [hours, minutes] = orario_suggerito.split(':').map(Number)
    const suggestedTime = hours * 60 + minutes
    
    // Return true if within 30 minutes of suggested time
    return Math.abs(currentTime - suggestedTime) <= 30
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
    // Time slot filter
    if (selectedTimeSlot !== 'all' && task.fascia_oraria !== selectedTimeSlot) {
      return false
    }
    
    // Camion condition filter
    if (task.condizione_camion === 'con_camion' && !hasCamion) {
      return false
    }
    if (task.condizione_camion === 'senza_camion' && hasCamion) {
      return false
    }
    
    return true
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

  const ProgressRing = ({ progress, size = 80, strokeWidth = 8 }) => {
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const strokeDashoffset = circumference - (progress / 100) * circumference

    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="progress-ring absolute inset-0" width={size} height={size}>
          <circle
            className="progress-ring-circle stroke-gray-200"
            strokeWidth={strokeWidth}
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
          <motion.circle
            className="progress-ring-circle stroke-current text-blue-500"
            strokeWidth={strokeWidth}
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-xl font-bold text-gray-700">{progress}%</div>
            <div className="text-xs text-gray-500">Completato</div>
          </div>
        </div>
      </div>
    )
  }

  const InfoWidget = ({ icon: Icon, title, value, subtitle, color = "blue", trend, onClick }) => (
    <motion.div
      className={`card interactive bg-gradient-to-br from-${color}-50 to-${color}-100 border-${color}-200 relative overflow-hidden`}
      whileHover={{ y: -2, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
    >
      <div className={`absolute top-0 right-0 w-16 h-16 rounded-full bg-${color}-200 opacity-20 -mr-8 -mt-8`} />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <Icon className={`w-6 h-6 text-${color}-600`} />
          {trend && (
            <div className={`text-xs px-2 py-1 rounded-full ${
              trend > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {trend > 0 ? '+' : ''}{trend}%
            </div>
          )}
        </div>
        
        <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
        <div className="text-sm text-gray-600">{title}</div>
        {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
      </div>
    </motion.div>
  )

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Collapsible Header */}
      <motion.div 
        className="bg-gradient-to-br from-blue-600 to-blue-800 text-white sticky top-0 z-30"
        animate={{ height: headerCollapsed ? 80 : 'auto' }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <div className="max-w-lg mx-auto p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <motion.h1 
                className="text-xl font-bold"
                animate={{ fontSize: headerCollapsed ? '1rem' : '1.25rem' }}
              >
                {headerCollapsed ? '📊 Dashboard' : getGreeting()}
              </motion.h1>
              <AnimatePresence>
                {!headerCollapsed && (
                  <motion.p 
                    className="text-blue-100 text-sm"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {currentUser.ruolo} - {currentUser.reparto}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
            
            <div className="flex items-center space-x-2">
              <motion.button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </motion.button>
              
              <motion.button
                onClick={() => setHeaderCollapsed(!headerCollapsed)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {headerCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
              </motion.button>
            </div>
          </div>

          <AnimatePresence>
            {!headerCollapsed && (
              <motion.div
                initial={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Widget Grid 2x2 */}
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <motion.div 
                    className="bg-white/10 rounded-xl p-4 backdrop-blur-sm"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Target className="w-5 h-5" />
                      <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Oggi</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold">{stats.completed}</div>
                        <div className="text-xs text-blue-100">Task Completati</div>
                      </div>
                      <ProgressRing 
                        progress={stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}
                        size={60}
                        strokeWidth={6}
                      />
                    </div>
                  </motion.div>

                  <motion.div 
                    className="bg-white/10 rounded-xl p-4 backdrop-blur-sm"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <AlertCircle className="w-5 h-5" />
                      <span className="text-xs bg-red-400 text-white px-2 py-1 rounded-full">
                        {stats.overdue > 0 ? 'CRITICO' : 'OK'}
                      </span>
                    </div>
                    <div className="text-2xl font-bold">{stats.overdue || 0}</div>
                    <div className="text-xs text-blue-100">Scadenze Critiche</div>
                  </motion.div>

                  <motion.div 
                    className="bg-white/10 rounded-xl p-4 backdrop-blur-sm"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Users className="w-5 h-5" />
                      <div className="flex space-x-1">
                        {[1,2,3].map(i => (
                          <div key={i} className="w-2 h-2 bg-green-400 rounded-full pulse-dot" />
                        ))}
                      </div>
                    </div>
                    <div className="text-2xl font-bold">{teamOnline || 5}</div>
                    <div className="text-xs text-blue-100">Team Online</div>
                  </motion.div>

                  <motion.div 
                    className="bg-white/10 rounded-xl p-4 backdrop-blur-sm"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <TrendingUp className="w-5 h-5" />
                      <span className="text-xs bg-green-400 text-white px-2 py-1 rounded-full">+15%</span>
                    </div>
                    <div className="text-2xl font-bold">92%</div>
                    <div className="text-xs text-blue-100">Performance Reparto</div>
                  </motion.div>
                </div>

                {/* Time Slot Filter - Improved */}
                <div className="mt-6">
                  <div className="grid grid-cols-4 gap-2">
                    {timeSlots.map((slot) => (
                      <motion.button
                        key={slot.value}
                        onClick={() => setSelectedTimeSlot(slot.value)}
                        className={`p-3 rounded-xl text-xs font-medium transition-all ${
                          selectedTimeSlot === slot.value
                            ? 'bg-white text-blue-600 shadow-lg'
                            : 'bg-white/10 text-white hover:bg-white/20'
                        } ${slot.value === currentSlot ? 'ring-2 ring-yellow-300' : ''}`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <div className="text-lg mb-1">{slot.icon}</div>
                        <div className="font-semibold">{slot.label}</div>
                        {slot.time && (
                          <div className="text-xs opacity-75 mt-1">{slot.time}</div>
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Content */}
      <div className="max-w-lg mx-auto p-4 space-y-6">
        
        {/* Notifications & Alerts */}
        <AnimatePresence>
          {(hasOrdersToday || promoNotification || (expirationStats && (expirationStats.scaduto > 0 || expirationStats.oggi > 0 || expirationStats.critico > 0))) && (
            <motion.div 
              className="space-y-3"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {hasOrdersToday && (
                <motion.div 
                  className="card bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-blue-900">Ordini programmati oggi</div>
                      <div className="text-sm text-blue-700">Controlla i dettagli nel sistema</div>
                    </div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full pulse-dot" />
                  </div>
                </motion.div>
              )}

              {promoNotification && (
                <motion.div 
                  className="card bg-gradient-to-r from-pink-50 to-rose-50 border-pink-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                      <Tag className="w-5 h-5 text-pink-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-pink-900">Cambio promozione domani!</div>
                      <div className="text-sm text-pink-700">
                        {promoNotification.nome_promo} 
                        {promoNotification.corsie && ` - Corsie: ${promoNotification.corsie.join(', ')}`}
                      </div>
                    </div>
                    <div className="text-xs bg-pink-200 text-pink-800 px-2 py-1 rounded-full font-bold">
                      DOMANI
                    </div>
                  </div>
                </motion.div>
              )}

              {expirationStats && (expirationStats.scaduto > 0 || expirationStats.oggi > 0 || expirationStats.critico > 0) && (
                <motion.div 
                  className="card bg-gradient-to-r from-red-50 to-orange-50 border-red-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-red-900">Prodotti in scadenza critici!</div>
                        <div className="text-sm text-red-700">
                          {expirationStats.scaduto > 0 && `${expirationStats.scaduto} scaduti`}
                          {expirationStats.oggi > 0 && `${expirationStats.scaduto > 0 ? ', ' : ''}${expirationStats.oggi} oggi`}
                          {expirationStats.critico > 0 && `${(expirationStats.scaduto > 0 || expirationStats.oggi > 0) ? ', ' : ''}${expirationStats.critico} critici`}
                        </div>
                      </div>
                    </div>
                    <ProductAlerts currentUser={currentUser} />
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Azioni Rapide - Always Visible */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <Zap className="w-5 h-5 mr-2 text-blue-600" />
            Azioni Rapide
          </h2>
          
          <div className="grid grid-cols-2 gap-3">
            <motion.button
              onClick={() => setShowAddModal(true)}
              className="card interactive bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 text-center p-4"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="font-semibold text-blue-900">Nuovo Task</div>
              <div className="text-xs text-blue-700">Crea rapidamente</div>
            </motion.button>

            <motion.button
              onClick={() => setShowCamera(true)}
              className="card interactive bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 text-center p-4 relative overflow-hidden"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <Camera className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="font-semibold text-purple-900">Foto Task</div>
              <div className="text-xs text-purple-700">Scatta e crea</div>
              {cameraUsageCount < 3 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                  NEW!
                </div>
              )}
            </motion.button>

            {['responsabile', 'admin'].includes(currentUser.ruolo) && (
              <motion.button
                onClick={() => setShowQuickActions(true)}
                className="card interactive bg-gradient-to-br from-green-50 to-green-100 border-green-200 text-center p-4"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <Target className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="font-semibold text-green-900">Task Comuni</div>
                <div className="text-xs text-green-700">Templates rapidi</div>
              </motion.button>
            )}

            <motion.button
              className="card interactive bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 text-center p-4"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <BarChart3 className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <div className="font-semibold text-orange-900">Statistiche</div>
              <div className="text-xs text-orange-700">Visualizza report</div>
            </motion.button>
          </div>
        </motion.div>

        {/* Order Manager */}
        <OrderManager currentUser={currentUser} />

        {/* Camion Indicator */}
        <CamionIndicator onCamionChange={handleCamionChange} />

        {/* Smart Task Grouping */}
        {filteredTasks.length === 0 ? (
          <motion.div 
            className="text-center py-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <motion.div 
              className="text-6xl mb-4"
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                repeatDelay: 3
              }}
            >
              📋
            </motion.div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nessun task presente
            </h3>
            <p className="text-gray-600 mb-6">
              {selectedTimeSlot === 'all' 
                ? 'Non ci sono task da visualizzare'
                : `Nessun task per ${timeSlots.find(s => s.value === selectedTimeSlot)?.label.toLowerCase()}`
              }
            </p>
            <motion.button
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Crea Primo Task
            </motion.button>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {/* Urgent Tasks Section */}
            {(() => {
              const urgentTasks = filteredTasks.filter(task => 
                task.priorita >= 4 || 
                (task.data_scadenza && formatDate(task.data_scadenza)?.includes('fa')) ||
                formatDate(task.data_scadenza) === 'Oggi'
              ).filter(task => task.stato !== 'completato')
              
              return urgentTasks.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="flex items-center text-lg font-bold text-red-700">
                      <AlertCircle className="w-5 h-5 mr-2" />
                      🔥 Urgenti ({urgentTasks.length})
                    </h3>
                    <div className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full font-bold">
                      PRIORITÀ ALTA
                    </div>
                  </div>
                  <div className="space-y-4">
                    {urgentTasks.map((task, index) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + index * 0.1 }}
                      >
                        <TaskCard
                          task={task}
                          currentUser={currentUser}
                          onUpdate={handleTaskUpdate}
                          onOpenComments={handleOpenComments}
                          onAssign={handleAssignTask}
                          isNearSuggestedTime={isNearSuggestedTime(task.orario_suggerito)}
                        />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )
            })()}

            {/* In Progress Tasks */}
            {tasksByStatus.in_corso.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="flex items-center text-lg font-bold text-blue-700">
                    <Zap className="w-5 h-5 mr-2" />
                    ⚡ In Corso ({tasksByStatus.in_corso.length})
                  </h3>
                  <div className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-bold">
                    ATTIVI
                  </div>
                </div>
                <div className="space-y-4">
                  {tasksByStatus.in_corso.map((task, index) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                    >
                      <TaskCard
                        task={task}
                        currentUser={currentUser}
                        onUpdate={handleTaskUpdate}
                        onOpenComments={handleOpenComments}
                        onAssign={handleAssignTask}
                        isNearSuggestedTime={isNearSuggestedTime(task.orario_suggerito)}
                      />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Planned Tasks (Non-urgent) */}
            {(() => {
              const plannedTasks = filteredTasks.filter(task => 
                task.stato === 'da_fare' && 
                task.priorita < 4 &&
                !(task.data_scadenza && (formatDate(task.data_scadenza)?.includes('fa') || formatDate(task.data_scadenza) === 'Oggi'))
              )
              
              return plannedTasks.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="flex items-center text-lg font-bold text-gray-700">
                      <Clock className="w-5 h-5 mr-2" />
                      📋 Pianificati ({plannedTasks.length})
                    </h3>
                    <div className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-medium">
                      DA FARE
                    </div>
                  </div>
                  <div className="space-y-4">
                    {plannedTasks.map((task, index) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 + index * 0.1 }}
                      >
                        <TaskCard
                          task={task}
                          currentUser={currentUser}
                          onUpdate={handleTaskUpdate}
                          onOpenComments={handleOpenComments}
                          onAssign={handleAssignTask}
                          isNearSuggestedTime={isNearSuggestedTime(task.orario_suggerito)}
                        />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )
            })()}

            {/* Recently Completed Tasks - Collapsible */}
            {tasksByStatus.completato.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="flex items-center text-lg font-bold text-green-700">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    ✅ Completati ({tasksByStatus.completato.length})
                  </h3>
                  <div className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold">
                    FINITI
                  </div>
                </div>
                <div className="space-y-4">
                  {tasksByStatus.completato.slice(0, 3).map((task, index) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.0 + index * 0.1 }}
                    >
                      <TaskCard
                        task={task}
                        currentUser={currentUser}
                        onUpdate={handleTaskUpdate}
                        onOpenComments={handleOpenComments}
                        onAssign={handleAssignTask}
                        isNearSuggestedTime={isNearSuggestedTime(task.orario_suggerito)}
                      />
                    </motion.div>
                  ))}
                  {tasksByStatus.completato.length > 3 && (
                    <motion.div
                      className="text-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.3 }}
                    >
                      <button className="text-sm text-gray-500 hover:text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-100 transition-colors">
                        Mostra altri {tasksByStatus.completato.length - 3} task completati
                      </button>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Last Refresh */}
        <div className="text-center text-xs text-gray-400 mt-8">
          Ultimo aggiornamento: {lastRefresh.toLocaleTimeString('it-IT')}
        </div>
      </div>

      {/* Modern Floating Action Button */}
      <motion.div 
        className="fixed bottom-24 right-6 z-40"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 1.5, type: "spring", stiffness: 200 }}
      >
        <motion.button
          onClick={() => setShowAddModal(true)}
          className="w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full shadow-2xl flex items-center justify-center relative overflow-hidden"
          whileHover={{ scale: 1.1, boxShadow: "0 20px 40px rgba(59, 130, 246, 0.4)" }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full blur opacity-50 animate-pulse" />
          <Plus className="w-7 h-7 relative z-10" />
        </motion.button>
      </motion.div>

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

      {/* Camera Components */}
      {showCamera && (
        <CameraCapture
          isOpen={showCamera}
          onClose={() => setShowCamera(false)}
          onPhotoCapture={handleCameraCapture}
        />
      )}

      {showCameraInput && (
        <QuickCameraInput
          isOpen={showCameraInput}
          onClose={() => {
            setShowCameraInput(false)
            setCapturedPhoto(null)
          }}
          photoData={capturedPhoto}
          onSaveTask={handleCameraTaskSave}
        />
      )}
    </div>
  )
}

export default Dashboard