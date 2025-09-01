// Notification utilities for TaskFlow Eurospin

export class InventoryNotificationManager {
  constructor() {
    this.permission = null
    this.init()
  }

  async init() {
    if ('Notification' in window) {
      this.permission = await Notification.requestPermission()
    }
  }

  canShowNotifications() {
    return this.permission === 'granted'
  }

  showLowStockAlert(product, quantity) {
    if (!this.canShowNotifications()) return

    const title = '🚨 Scorte basse!'
    const body = `${product.nome}: ${quantity} ${product.unita_misura} (min: ${product.soglia_minima})`
    
    const notification = new Notification(title, {
      body,
      icon: '/icon-192x192.png',
      tag: `low-stock-${product.id}`,
      requireInteraction: true,
      data: {
        type: 'low_stock',
        product_id: product.id,
        quantity: quantity
      }
    })

    notification.onclick = () => {
      window.focus()
      // Navigate to inventory page
      if (window.location.pathname !== '/magazzino') {
        window.location.href = '/magazzino'
      }
      notification.close()
    }

    // Auto-close after 10 seconds
    setTimeout(() => notification.close(), 10000)
  }

  showZeroStockAlert(product) {
    if (!this.canShowNotifications()) return

    const title = '❌ Prodotto esaurito!'
    const body = `${product.nome} è completamente esaurito`
    
    const notification = new Notification(title, {
      body,
      icon: '/icon-192x192.png',
      tag: `zero-stock-${product.id}`,
      requireInteraction: true,
      data: {
        type: 'zero_stock',
        product_id: product.id
      }
    })

    notification.onclick = () => {
      window.focus()
      if (window.location.pathname !== '/magazzino') {
        window.location.href = '/magazzino'
      }
      notification.close()
    }
  }

  showDailySummary(stats) {
    if (!this.canShowNotifications()) return

    const criticalCount = stats.zero_stock + stats.critical_stock
    if (criticalCount === 0) return

    const title = '📊 Riepilogo giornaliero magazzino'
    const body = `${criticalCount} prodotti necessitano attenzione`
    
    const notification = new Notification(title, {
      body,
      icon: '/icon-192x192.png',
      tag: 'daily-summary',
      data: {
        type: 'daily_summary',
        stats: stats
      }
    })

    notification.onclick = () => {
      window.focus()
      if (window.location.pathname !== '/magazzino') {
        window.location.href = '/magazzino'
      }
      notification.close()
    }

    setTimeout(() => notification.close(), 15000)
  }

  showOutdatedInventoryAlert(products) {
    if (!this.canShowNotifications() || products.length === 0) return

    const title = '⏰ Inventario non aggiornato'
    const body = `${products.length} prodotti non aggiornati da oltre 3 giorni`
    
    const notification = new Notification(title, {
      body,
      icon: '/icon-192x192.png',
      tag: 'outdated-inventory',
      data: {
        type: 'outdated_inventory',
        products: products
      }
    })

    notification.onclick = () => {
      window.focus()
      if (window.location.pathname !== '/magazzino') {
        window.location.href = '/magazzino'
      }
      notification.close()
    }
  }
}

// Scheduling utilities for daily notifications
export class NotificationScheduler {
  constructor(notificationManager) {
    this.manager = notificationManager
    this.scheduledTasks = new Map()
  }

  scheduleDailySummary(hour = 7, minute = 0) {
    // Clear existing schedule
    if (this.scheduledTasks.has('daily-summary')) {
      clearTimeout(this.scheduledTasks.get('daily-summary'))
    }

    const scheduleNext = () => {
      const now = new Date()
      const targetTime = new Date()
      targetTime.setHours(hour, minute, 0, 0)

      // If target time has passed today, schedule for tomorrow
      if (targetTime <= now) {
        targetTime.setDate(targetTime.getDate() + 1)
      }

      const delay = targetTime.getTime() - now.getTime()
      
      const timeoutId = setTimeout(async () => {
        try {
          // Load inventory stats and show summary
          const { getInventorySummary } = await import('../lib/supabase')
          const { data: summary } = await getInventorySummary()
          
          if (summary && summary.length > 0) {
            const totalStats = summary.reduce((acc, dept) => ({
              zero_stock: acc.zero_stock + dept.zero_stock,
              critical_stock: acc.critical_stock + dept.critical_stock,
              low_stock: acc.low_stock + dept.low_stock
            }), { zero_stock: 0, critical_stock: 0, low_stock: 0 })
            
            this.manager.showDailySummary(totalStats)
          }
        } catch (error) {
          console.error('Error showing daily summary:', error)
        }
        
        // Schedule next day
        scheduleNext()
      }, delay)

      this.scheduledTasks.set('daily-summary', timeoutId)
    }

    scheduleNext()
  }

  scheduleOrderReminders() {
    // Check every hour for upcoming order deadlines
    const hourlyCheck = setInterval(async () => {
      const now = new Date()
      const currentHour = now.getHours()
      
      // Only check during business hours
      if (currentHour < 6 || currentHour > 22) return
      
      try {
        // Check for orders due today
        const { getOrdiniOggi } = await import('../lib/supabase')
        const { data: orders } = await getOrdiniOggi()
        
        // Show notifications for orders approaching deadline
        orders?.forEach(order => {
          if (order.stato === 'da_fare' && order.config?.orario_limite) {
            const deadline = new Date()
            const [hours, minutes] = order.config.orario_limite.split(':')
            deadline.setHours(parseInt(hours), parseInt(minutes), 0, 0)
            
            const timeUntilDeadline = deadline.getTime() - now.getTime()
            const hoursUntilDeadline = timeUntilDeadline / (1000 * 60 * 60)
            
            // Notify 2 hours before deadline
            if (hoursUntilDeadline <= 2 && hoursUntilDeadline > 1.5) {
              if (this.manager.canShowNotifications()) {
                new Notification('⏰ Scadenza ordine vicina', {
                  body: `Ordine ${order.tipo_ordine} scade alle ${order.config.orario_limite}`,
                  icon: '/icon-192x192.png',
                  tag: `order-reminder-${order.id}`
                })
              }
            }
          }
        })
      } catch (error) {
        console.error('Error checking order reminders:', error)
      }
    }, 1000 * 60 * 30) // Check every 30 minutes

    this.scheduledTasks.set('order-reminders', hourlyCheck)
  }

  clearAll() {
    this.scheduledTasks.forEach((taskId) => {
      if (typeof taskId === 'number') {
        clearTimeout(taskId)
      } else {
        clearInterval(taskId)
      }
    })
    this.scheduledTasks.clear()
  }
}

// Local storage for notification preferences
export const NotificationPreferences = {
  getPreferences() {
    const prefs = localStorage.getItem('notification_preferences')
    return prefs ? JSON.parse(prefs) : {
      lowStock: true,
      zeroStock: true,
      dailySummary: true,
      outdatedInventory: true,
      orderReminders: true,
      dailySummaryTime: '07:00'
    }
  },

  setPreferences(prefs) {
    localStorage.setItem('notification_preferences', JSON.stringify(prefs))
  },

  isEnabled(type) {
    const prefs = this.getPreferences()
    return prefs[type] !== false
  }
}

// Global notification manager instance
export const notificationManager = new InventoryNotificationManager()
export const notificationScheduler = new NotificationScheduler(notificationManager)

// Initialize daily scheduling
if (NotificationPreferences.isEnabled('dailySummary')) {
  const time = NotificationPreferences.getPreferences().dailySummaryTime || '07:00'
  const [hour, minute] = time.split(':').map(Number)
  notificationScheduler.scheduleDailySummary(hour, minute)
}

if (NotificationPreferences.isEnabled('orderReminders')) {
  notificationScheduler.scheduleOrderReminders()
}