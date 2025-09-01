import { Home, CheckSquare, Repeat, AlertTriangle, Tag } from 'lucide-react'

const BottomNav = ({ activeTab, onTabChange }) => {
  const tabs = [
    {
      id: 'dashboard',
      label: 'Home',
      icon: Home,
      color: 'text-blue-600'
    },
    {
      id: 'tasks',
      label: 'Task',
      icon: CheckSquare,
      color: 'text-green-600'
    },
    {
      id: 'recurring',
      label: 'Ricorrenti',
      icon: Repeat,
      color: 'text-purple-600'
    },
    {
      id: 'alerts',
      label: 'Avvisi',
      icon: AlertTriangle,
      color: 'text-orange-600'
    },
    {
      id: 'promozioni',
      label: 'Promo',
      icon: Tag,
      color: 'text-pink-600'
    }
  ]

  const handleTabClick = (tabId) => {
    onTabChange(tabId)
    
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(30)
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`
                  flex-1 flex flex-col items-center py-2 px-1 transition-all duration-200
                  ${isActive 
                    ? `${tab.color} bg-gray-50` 
                    : 'text-gray-400 hover:text-gray-600'
                  }
                  active:scale-95 min-h-[60px]
                `}
              >
                <Icon 
                  className={`w-6 h-6 mb-1 ${
                    isActive ? 'scale-110' : ''
                  } transition-transform`} 
                />
                <span className={`text-xs font-medium ${
                  isActive ? 'font-semibold' : ''
                }`}>
                  {tab.label}
                </span>
                
                {/* Active indicator */}
                {isActive && (
                  <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-1 ${tab.color.replace('text-', 'bg-')} rounded-t-full`} />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default BottomNav