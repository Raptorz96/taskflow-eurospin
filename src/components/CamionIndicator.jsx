import { useState, useEffect } from 'react'
import { Truck, X } from 'lucide-react'

const CamionIndicator = ({ onCamionChange }) => {
  const [hasCamion, setHasCamion] = useState(false)

  // Check if today is a truck day (Monday=1, Wednesday=3, Friday=5)
  const getTruckDayForToday = () => {
    const today = new Date().getDay() // 0=Sunday, 1=Monday, etc.
    return [1, 3, 5].includes(today)
  }

  // Load initial state from localStorage or default to truck schedule
  useEffect(() => {
    const savedState = localStorage.getItem('camion-oggi')
    if (savedState !== null) {
      const camionState = JSON.parse(savedState)
      setHasCamion(camionState)
      onCamionChange?.(camionState)
    } else {
      // Default to schedule: truck on Monday, Wednesday, Friday
      const defaultState = getTruckDayForToday()
      setHasCamion(defaultState)
      onCamionChange?.(defaultState)
      localStorage.setItem('camion-oggi', JSON.stringify(defaultState))
    }
  }, [onCamionChange])

  const handleToggle = () => {
    const newState = !hasCamion
    setHasCamion(newState)
    localStorage.setItem('camion-oggi', JSON.stringify(newState))
    onCamionChange?.(newState)
    
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(50)
    }
  }

  const getTodayName = () => {
    const days = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato']
    return days[new Date().getDay()]
  }

  const isTruckDay = getTruckDayForToday()

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`
            p-2 rounded-full transition-colors
            ${hasCamion 
              ? 'bg-orange-100 text-orange-600' 
              : 'bg-gray-100 text-gray-500'
            }
          `}>
            {hasCamion ? (
              <Truck className="w-5 h-5" />
            ) : (
              <div className="relative">
                <Truck className="w-5 h-5" />
                <X className="w-3 h-3 absolute -top-1 -right-1 bg-white rounded-full" />
              </div>
            )}
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900">
              Camion Oggi ({getTodayName()})
            </h3>
            <p className="text-sm text-gray-600">
              {hasCamion 
                ? 'Pulizie bagni + parcheggio dalle 19:00'
                : 'Pulizie negozio dalle 19:00'
              }
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Default schedule indicator */}
          {isTruckDay && (
            <div className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
              Giorno camion
            </div>
          )}
          
          {/* Toggle switch */}
          <button
            onClick={handleToggle}
            className={`
              relative inline-flex h-6 w-11 items-center rounded-full transition-colors
              ${hasCamion 
                ? 'bg-orange-500 hover:bg-orange-600' 
                : 'bg-gray-300 hover:bg-gray-400'
              }
            `}
            role="switch"
            aria-checked={hasCamion}
            aria-label="Attiva/disattiva presenza camion oggi"
          >
            <span
              className={`
                inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                ${hasCamion ? 'translate-x-6' : 'translate-x-1'}
              `}
            />
          </button>
        </div>
      </div>

      {/* Status badge */}
      <div className="mt-3 flex justify-center">
        <div className={`
          inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
          ${hasCamion 
            ? 'bg-orange-100 text-orange-800 border border-orange-200'
            : 'bg-gray-100 text-gray-800 border border-gray-200'
          }
        `}>
          {hasCamion ? (
            <>
              <Truck className="w-4 h-4 mr-2" />
              CON camion - Pulizie bagni e parcheggio
            </>
          ) : (
            <>
              <div className="relative mr-2">
                <Truck className="w-4 h-4" />
                <X className="w-2 h-2 absolute -top-0.5 -right-0.5 bg-white rounded-full" />
              </div>
              SENZA camion - Pulizie negozio
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default CamionIndicator