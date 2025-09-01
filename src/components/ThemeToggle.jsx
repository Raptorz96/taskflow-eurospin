import { motion, AnimatePresence } from 'framer-motion'
import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'

const ThemeToggle = ({ className = '' }) => {
  const { theme, setLightMode, setDarkMode, setSystemMode } = useTheme()

  const themeOptions = [
    {
      id: 'light',
      name: 'Chiaro',
      icon: Sun,
      onClick: setLightMode,
      color: 'text-yellow-500'
    },
    {
      id: 'dark',
      name: 'Scuro',
      icon: Moon,
      onClick: setDarkMode,
      color: 'text-blue-400'
    },
    {
      id: 'system',
      name: 'Sistema',
      icon: Monitor,
      onClick: setSystemMode,
      color: 'text-gray-500'
    }
  ]

  const getCurrentTheme = () => {
    const savedTheme = localStorage.getItem('taskflow-theme')
    if (!savedTheme) return 'system'
    return savedTheme
  }

  const currentTheme = getCurrentTheme()

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center bg-white dark:bg-slate-800 rounded-xl p-1 shadow-lg border border-gray-200 dark:border-slate-700">
        {themeOptions.map((option) => {
          const Icon = option.icon
          const isActive = currentTheme === option.id
          
          return (
            <motion.button
              key={option.id}
              onClick={option.onClick}
              className={`
                relative flex items-center justify-center w-10 h-10 rounded-lg
                transition-colors duration-200
                ${isActive 
                  ? 'text-white' 
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }
              `}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Active background */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    layoutId="theme-active"
                    className="absolute inset-0 bg-blue-500 rounded-lg shadow-md"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </AnimatePresence>

              <Icon className="w-5 h-5 relative z-10" />

              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  {option.name}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

export default ThemeToggle