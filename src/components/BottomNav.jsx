import { motion, AnimatePresence } from 'framer-motion'
import { Home, CheckSquare, Repeat, AlertTriangle, Tag, Package, BarChart3 } from 'lucide-react'

const BottomNav = ({ activeTab, onTabChange, inventoryAlerts = 0 }) => {
  const tabs = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      color: '#3B82F6',
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      id: 'tasks',
      label: 'Tasks',
      icon: CheckSquare,
      color: '#10B981',
      gradient: 'from-emerald-500 to-green-600'
    },
    {
      id: 'magazzino',
      label: 'Magazzino',
      icon: Package,
      color: '#8B5CF6',
      gradient: 'from-violet-500 to-purple-600',
      badge: inventoryAlerts
    },
    {
      id: 'recurring',
      label: 'Ricorrenti',
      icon: Repeat,
      color: '#F59E0B',
      gradient: 'from-amber-500 to-orange-600'
    },
    {
      id: 'alerts',
      label: 'Avvisi',
      icon: AlertTriangle,
      color: '#EF4444',
      gradient: 'from-red-500 to-red-600'
    }
  ]

  const handleTabClick = (tabId) => {
    onTabChange(tabId)
    
    // Enhanced haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate([20, 10, 20])
    }
  }

  return (
    <motion.div 
      className="fixed bottom-0 left-0 right-0 z-40"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* Glass Background */}
      <div className="glass backdrop-blur-xl bg-white/80 border-t border-gray-200/50">
        <div className="max-w-lg mx-auto px-2 py-2">
          <div className="flex items-center justify-around">
            {tabs.map((tab, index) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className="relative flex flex-col items-center py-2 px-3 min-w-[64px]"
                  whileTap={{ scale: 0.9 }}
                  initial={false}
                >
                  {/* Active Background */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className={`absolute inset-0 bg-gradient-to-r ${tab.gradient} rounded-2xl shadow-lg`}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                  </AnimatePresence>

                  {/* Icon Container */}
                  <div className="relative z-10 mb-1">
                    <motion.div
                      animate={{
                        scale: isActive ? 1.1 : 1,
                        y: isActive ? -2 : 0
                      }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <Icon 
                        className={`w-6 h-6 transition-colors duration-200 ${
                          isActive ? 'text-white' : 'text-gray-500'
                        }`}
                        style={{ color: isActive ? 'white' : undefined }}
                      />
                    </motion.div>
                    
                    {/* Animated Badge */}
                    <AnimatePresence>
                      {tab.badge > 0 && (
                        <motion.div 
                          className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-lg"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          whileHover={{ scale: 1.1 }}
                        >
                          {tab.badge > 99 ? '99+' : tab.badge}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  {/* Label */}
                  <motion.span 
                    className={`text-xs font-medium transition-all duration-200 ${
                      isActive 
                        ? 'text-white font-bold' 
                        : 'text-gray-600'
                    }`}
                    animate={{
                      scale: isActive ? 0.9 : 0.85,
                      y: isActive ? 0 : 2
                    }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    {tab.label}
                  </motion.span>
                  
                  {/* Ripple Effect on Tap */}
                  <motion.div
                    className="absolute inset-0 rounded-2xl"
                    whileTap={{
                      background: "radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)",
                    }}
                    transition={{ duration: 0.1 }}
                  />
                </motion.button>
              )
            })}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default BottomNav