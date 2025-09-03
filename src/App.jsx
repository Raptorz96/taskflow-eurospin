import { useState, useEffect } from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import { supabase, getCurrentUser, getUserProfile, getInventoryAlerts } from './lib/supabase'
import { useTheme } from './hooks/useTheme'
import ThemeToggle from './components/ThemeToggle'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import HomeScreen from './components/HomeScreen'
import Tasks from './components/Tasks'
import RecurringTasks from './components/RecurringTasks'
import ProductAlerts from './components/ProductAlerts'
import PromoManager from './components/PromoManager'
import InventoryManager from './components/InventoryManager'
import BottomNav from './components/BottomNav'

function App() {
  const { theme } = useTheme()
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [inventoryAlerts, setInventoryAlerts] = useState(0)

  useEffect(() => {
    // Check current session
    getCurrentUser().then(user => {
      if (user) {
        setUser(user)
        loadUserProfile(user.id)
      } else {
        setLoading(false)
      }
    }).catch(error => {
      console.error('Error in getCurrentUser:', error)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user)
          await loadUserProfile(session.user.id)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setUserProfile(null)
          setActiveTab('dashboard')
        }
      }
    )

    // Mobile input visibility fix - JavaScript fallback
    const handleInputFocus = (event) => {
      const input = event.target
      if (input.tagName === 'INPUT' || input.tagName === 'TEXTAREA' || input.tagName === 'SELECT') {
        // Force visible text color on focus
        input.style.webkitTextFillColor = '#111827'
        input.style.color = '#111827'
        input.style.backgroundColor = '#ffffff'
        input.style.opacity = '1'
      }
    }

    // Add global focus listener for all inputs
    document.addEventListener('focusin', handleInputFocus, true)

    return () => {
      subscription.unsubscribe()
      document.removeEventListener('focusin', handleInputFocus, true)
    }
  }, [])

  useEffect(() => {
    // Load inventory alerts
    if (userProfile) {
      loadInventoryAlerts()
      
      // Set up interval to refresh alerts
      const alertsInterval = setInterval(loadInventoryAlerts, 2 * 60 * 1000) // Every 2 minutes
      
      return () => clearInterval(alertsInterval)
    }
  }, [userProfile])

  const loadInventoryAlerts = async () => {
    try {
      const { data, error } = await getInventoryAlerts({ unread_only: true })
      if (!error && data) {
        setInventoryAlerts(data.length)
      }
    } catch (error) {
      console.error('Error loading inventory alerts:', error)
    }
  }

  const loadUserProfile = async (userId) => {
    try {
      const { data, error } = await getUserProfile(userId)
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned - profile doesn't exist
          setUser(null)
        } else if (error.code === 'TIMEOUT') {
          // Query timeout - probably database connection issue
          setUser(null)
        } else {
          // Other error
          throw error
        }
      } else if (data) {
        setUserProfile(data)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
      setUser(null) // Force logout on other errors
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = (user) => {
    setUser(user)
    loadUserProfile(user.id)
  }

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const renderCurrentTab = () => {
    if (!userProfile) return null

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard currentUser={userProfile} />
      case 'home':
        return <HomeScreen currentUser={userProfile} />
      case 'tasks':
        return <Tasks currentUser={userProfile} />
      case 'magazzino':
        return <InventoryManager currentUser={userProfile} />
      case 'recurring':
        return <RecurringTasks currentUser={userProfile} />
      case 'alerts':
        return <ProductAlerts currentUser={userProfile} />
      default:
        return <Dashboard currentUser={userProfile} />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold">E</span>
          </div>
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Caricamento TaskFlow...</p>
        </div>
      </div>
    )
  }

  if (!user || !userProfile) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Main Content */}
        <main>
          {renderCurrentTab()}
        </main>

        {/* Bottom Navigation */}
        <BottomNav 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
          inventoryAlerts={inventoryAlerts}
        />

        {/* Theme Toggle & Logout - Fixed position */}
        <div className="fixed top-4 right-4 flex items-center space-x-2 z-50">
          <ThemeToggle />
          <button
            onClick={handleLogout}
            className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400 transition-colors bg-white dark:bg-slate-800 rounded-full shadow-sm border border-gray-200 dark:border-slate-700"
            title="Logout"
          >
            🚪
          </button>
        </div>
      </div>
    </Router>
  )
}

export default App
