import { useState, useEffect } from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import { supabase, getCurrentUser, getUserProfile } from './lib/supabase'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import Tasks from './components/Tasks'
import RecurringTasks from './components/RecurringTasks'
import ProductAlerts from './components/ProductAlerts'
import BottomNav from './components/BottomNav'

function App() {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')

  useEffect(() => {
    // Check current session
    getCurrentUser().then(user => {
      if (user) {
        setUser(user)
        loadUserProfile(user.id)
      } else {
        setLoading(false)
      }
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

    return () => subscription.unsubscribe()
  }, [])

  const loadUserProfile = async (userId) => {
    try {
      const { data, error } = await getUserProfile(userId)
      if (error) throw error
      
      if (data) {
        setUserProfile(data)
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
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
      case 'tasks':
        return <Tasks currentUser={userProfile} />
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
        />

        {/* Logout Button - Hidden but accessible via settings */}
        <button
          onClick={handleLogout}
          className="fixed top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors z-50 bg-white rounded-full shadow-sm"
          title="Logout"
          style={{ display: 'none' }} // Hidden for now, can be made visible in settings
        >
          🚪
        </button>
      </div>
    </Router>
  )
}

export default App
