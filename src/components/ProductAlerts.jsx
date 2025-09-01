import { useState, useEffect } from 'react'
import { Plus, AlertTriangle, Calendar, Package, Trash2, CheckCircle } from 'lucide-react'
import { getScadenzeStats } from '../lib/supabase'
import ScadenzeManager from './ScadenzeManager'

const ProductAlerts = ({ currentUser }) => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showScadenzeManager, setShowScadenzeManager] = useState(false)

  const reparti = [
    { value: 'ortofrutta', label: 'Ortofrutta', icon: '🥬' },
    { value: 'macelleria', label: 'Macelleria', icon: '🥩' },
    { value: 'gastronomia', label: 'Gastronomia', icon: '🍝' },
    { value: 'panetteria', label: 'Panetteria', icon: '🥖' },
    { value: 'magazzino', label: 'Magazzino', icon: '📦' },
    { value: 'casse', label: 'Casse', icon: '💰' }
  ]

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      const { data, error } = await getScadenzeStats()
      
      if (error) throw error

      setStats(data)
    } catch (error) {
      console.error('Error loading expiration stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCriticalCount = () => {
    if (!stats) return 0
    return stats.scaduto + stats.oggi + stats.critico
  }

  const handleOpenManager = () => {
    setShowScadenzeManager(true)
  }

  const criticalCount = getCriticalCount()

  if (loading) {
    return (
      <div className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-400 rounded-full text-sm">
        <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin mr-2" />
        <span>Caricamento...</span>
      </div>
    )
  }

  return (
    <>
      <button
        onClick={handleOpenManager}
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors ${
          criticalCount > 0 
            ? 'bg-red-100 text-red-800 hover:bg-red-200 border border-red-200' 
            : 'bg-green-100 text-green-800 hover:bg-green-200 border border-green-200'
        }`}
      >
        <AlertTriangle className={`w-4 h-4 mr-2 ${criticalCount > 0 ? 'text-red-600' : 'text-green-600'}`} />
        <span>Scadenze</span>
        {criticalCount > 0 && (
          <span className="ml-2 px-2 py-0.5 bg-red-600 text-white text-xs rounded-full">
            {criticalCount}
          </span>
        )}
      </button>

      {showScadenzeManager && (
        <ScadenzeManager
          currentUser={currentUser}
          onClose={() => setShowScadenzeManager(false)}
        />
      )}
    </>
  )
}

export default ProductAlerts