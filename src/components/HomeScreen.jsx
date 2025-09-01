import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sun, 
  Moon, 
  Sunset, 
  TrendingUp, 
  Users, 
  Clock, 
  Target, 
  Zap,
  Calendar,
  MessageSquare,
  Bell,
  Cloud,
  CloudRain,
  CloudSnow,
  Thermometer,
  Wind
} from 'lucide-react'
import { getTasks } from '../lib/supabase'

const HomeScreen = ({ currentUser }) => {
  const [greeting, setGreeting] = useState('')
  const [stats, setStats] = useState({})
  const [focusTask, setFocusTask] = useState(null)
  const [teamActivity, setTeamActivity] = useState([])
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(true)

  const shortcuts = [
    { id: 'quick-task', icon: Zap, label: 'Task Rapido', color: 'bg-blue-500' },
    { id: 'team-chat', icon: MessageSquare, label: 'Chat Team', color: 'bg-green-500' },
    { id: 'calendar', icon: Calendar, label: 'Calendario', color: 'bg-purple-500' },
    { id: 'notifications', icon: Bell, label: 'Notifiche', color: 'bg-orange-500' },
    { id: 'stats', icon: TrendingUp, label: 'Statistiche', color: 'bg-pink-500' },
    { id: 'settings', icon: Target, label: 'Impostazioni', color: 'bg-gray-500' }
  ]

  useEffect(() => {
    initializeHomeScreen()
    
    // Update greeting every minute
    const interval = setInterval(updateGreeting, 60000)
    return () => clearInterval(interval)
  }, [])

  const initializeHomeScreen = async () => {
    try {
      updateGreeting()
      await Promise.all([
        loadDayStats(),
        loadFocusTask(),
        loadTeamActivity(),
        loadWeatherData()
      ])
    } catch (error) {
      console.error('Error initializing home screen:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateGreeting = () => {
    const hour = new Date().getHours()
    const name = currentUser.nome?.split(' ')[0] || 'Collega'
    
    if (hour < 6) {
      setGreeting(`Notte fonda, ${name}! 🌙`)
    } else if (hour < 12) {
      setGreeting(`Buongiorno, ${name}! ☀️`)
    } else if (hour < 18) {
      setGreeting(`Buon pomeriggio, ${name}! 🌤️`)
    } else if (hour < 22) {
      setGreeting(`Buonasera, ${name}! 🌅`)
    } else {
      setGreeting(`Buona serata, ${name}! 🌙`)
    }
  }

  const loadDayStats = async () => {
    try {
      // Mock stats for now - in production this would come from the database
      setStats({
        completed_today: 12,
        pending_tasks: 8,
        team_progress: 85,
        efficiency_score: 92
      })
    } catch (error) {
      console.error('Error loading day stats:', error)
      setStats({
        completed_today: 0,
        pending_tasks: 0,
        team_progress: 0,
        efficiency_score: 0
      })
    }
  }

  const loadFocusTask = async () => {
    try {
      const { data } = await getTasks({ 
        limit: 1, 
        status: 'da_fare',
        assigned_to: currentUser.id,
        order_by: 'priorita',
        order_direction: 'desc'
      })
      
      if (data && data.length > 0) {
        setFocusTask(data[0])
      }
    } catch (error) {
      console.error('Error loading focus task:', error)
    }
  }

  const loadTeamActivity = async () => {
    try {
      // Mock team activity data
      setTeamActivity([
        {
          id: 1,
          user_name: 'Marco R.',
          action: 'ha completato il task "Controllo scaffali"',
          time: '2 minuti fa',
          status: 'completed'
        },
        {
          id: 2,
          user_name: 'Giulia B.',
          action: 'ha iniziato "Riordino frigo"',
          time: '5 minuti fa',
          status: 'in_progress'
        },
        {
          id: 3,
          user_name: 'Antonio M.',
          action: 'ha creato "Inventario serale"',
          time: '10 minuti fa',
          status: 'created'
        }
      ])
    } catch (error) {
      console.error('Error loading team activity:', error)
      setTeamActivity([])
    }
  }

  const loadWeatherData = async () => {
    // Mock weather data - in production this would come from a weather API
    // You could integrate with OpenWeatherMap or similar service
    setWeather({
      temp: 22,
      condition: 'sunny',
      suggestion: 'Giornata perfetta per il controllo merci esterne!'
    })
  }

  const getTimeIcon = () => {
    const hour = new Date().getHours()
    if (hour < 6) return Moon
    if (hour < 12) return Sun
    if (hour < 18) return Sun
    return Sunset
  }

  const getWeatherIcon = (condition) => {
    switch (condition) {
      case 'sunny': return Sun
      case 'cloudy': return Cloud
      case 'rainy': return CloudRain
      case 'snowy': return CloudSnow
      default: return Cloud
    }
  }

  const StatCard = ({ icon: Icon, label, value, change, color = "blue" }) => (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className="card interactive bg-gradient-to-br from-white to-gray-50 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-gradient-to-br opacity-10"
           style={{ background: `var(--${color}-500)` }} />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <Icon className={`w-6 h-6 text-${color}-500`} />
          {change && (
            <span className={`text-xs px-2 py-1 rounded-full ${
              change > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {change > 0 ? '+' : ''}{change}%
            </span>
          )}
        </div>
        <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
        <div className="text-sm text-gray-600">{label}</div>
      </div>
    </motion.div>
  )

  const ProgressRing = ({ progress, size = 60 }) => {
    const radius = (size - 8) / 2
    const circumference = radius * 2 * Math.PI
    const strokeDashoffset = circumference - (progress / 100) * circumference

    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="progress-ring absolute inset-0" width={size} height={size}>
          <circle
            className="progress-ring-circle stroke-gray-200"
            strokeWidth="4"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
          <motion.circle
            className="progress-ring-circle stroke-current text-blue-500"
            strokeWidth="4"
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
          <span className="text-sm font-bold text-gray-700">{progress}%</span>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl font-bold">E</span>
          </div>
          <div className="skeleton w-32 h-4 mx-auto mb-4 rounded-full" />
          <div className="skeleton w-48 h-3 mx-auto rounded-full" />
        </motion.div>
      </div>
    )
  }

  const TimeIcon = getTimeIcon()
  const WeatherIcon = weather ? getWeatherIcon(weather.condition) : Cloud

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header with Greeting */}
      <motion.div 
        className="bg-gradient-to-br from-blue-600 to-blue-800 text-white"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-lg mx-auto p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <motion.div
                className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <TimeIcon className="w-6 h-6" />
              </motion.div>
              <div>
                <motion.h1 
                  className="text-xl font-bold"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                >
                  {greeting}
                </motion.h1>
                <motion.p 
                  className="text-blue-100 text-sm"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                >
                  {currentUser.ruolo} - {currentUser.reparto}
                </motion.p>
              </div>
            </div>

            <motion.div
              className="text-right"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <div className="text-sm opacity-75">
                {new Date().toLocaleDateString('it-IT', { 
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long'
                })}
              </div>
            </motion.div>
          </div>

          {/* Weather Widget */}
          {weather && (
            <motion.div 
              className="bg-white/10 rounded-xl p-4 backdrop-blur-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <WeatherIcon className="w-8 h-8" />
                  <div>
                    <div className="text-2xl font-bold">{weather.temp}°C</div>
                    <div className="text-xs text-blue-100 capitalize">{weather.condition}</div>
                  </div>
                </div>
                <div className="text-right max-w-40">
                  <div className="text-xs text-blue-100">{weather.suggestion}</div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      <div className="max-w-lg mx-auto p-4">
        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <div className="grid grid-cols-2 gap-4 mb-6">
            <StatCard
              icon={Target}
              label="Completati oggi"
              value={stats.completed_today}
              change={15}
              color="green"
            />
            <StatCard
              icon={Clock}
              label="Da completare"
              value={stats.pending_tasks}
              change={-8}
              color="orange"
            />
            <StatCard
              icon={Users}
              label="Team Progress"
              value={`${stats.team_progress}%`}
              change={12}
              color="purple"
            />
            <StatCard
              icon={TrendingUp}
              label="Efficienza"
              value={`${stats.efficiency_score}%`}
              change={5}
              color="blue"
            />
          </div>
        </motion.div>

        {/* Focus Section */}
        {focusTask && (
          <motion.div 
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            <h2 className="text-lg font-bold text-gray-900 mb-3">🎯 Focus Ora</h2>
            <div className="card bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{focusTask.titolo}</h3>
                  <p className="text-sm text-gray-600 mb-2">{focusTask.descrizione}</p>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span>Priorità {focusTask.priorita}/5</span>
                    <span>•</span>
                    <span>{focusTask.tempo_stimato}min</span>
                  </div>
                </div>
                <motion.button
                  className="btn btn-primary text-sm"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Inizia
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Shortcuts */}
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.6 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900">⚡ Azioni Rapide</h2>
            <button className="text-sm text-blue-600 hover:text-blue-800">
              Personalizza
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {shortcuts.map((shortcut, index) => {
              const Icon = shortcut.icon
              return (
                <motion.button
                  key={shortcut.id}
                  className="card interactive text-center p-4 hover:shadow-lg"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.1 + index * 0.1, duration: 0.4 }}
                >
                  <div className={`w-12 h-12 ${shortcut.color} text-white rounded-xl flex items-center justify-center mx-auto mb-2`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-medium text-gray-700">{shortcut.label}</span>
                </motion.button>
              )
            })}
          </div>
        </motion.div>

        {/* Team Activity Feed */}
        {teamActivity.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.6 }}
          >
            <h2 className="text-lg font-bold text-gray-900 mb-3">👥 Attività Team</h2>
            <div className="card">
              <div className="space-y-3">
                {teamActivity.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.5 + index * 0.1, duration: 0.4 }}
                  >
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold">
                        {activity.user_name?.[0]?.toUpperCase() || '?'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">{activity.user_name}</span>{' '}
                        {activity.action}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {activity.time}
                      </p>
                    </div>
                    {activity.status && (
                      <div className="flex-shrink-0">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          activity.status === 'completed' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {activity.status}
                        </span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default HomeScreen