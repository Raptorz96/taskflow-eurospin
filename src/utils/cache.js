// Local caching system for TaskFlow Eurospin
// Provides offline-first functionality and performance optimization

export class LocalCache {
  constructor(namespace = 'taskflow', maxAge = 5 * 60 * 1000) { // 5 minutes default
    this.namespace = namespace
    this.maxAge = maxAge
    this.storage = window.localStorage
  }

  generateKey(key) {
    return `${this.namespace}:${key}`
  }

  set(key, data, customMaxAge = null) {
    try {
      const cacheEntry = {
        data,
        timestamp: Date.now(),
        maxAge: customMaxAge || this.maxAge
      }
      
      this.storage.setItem(this.generateKey(key), JSON.stringify(cacheEntry))
      return true
    } catch (error) {
      console.warn('Failed to cache data:', error)
      return false
    }
  }

  get(key) {
    try {
      const cached = this.storage.getItem(this.generateKey(key))
      if (!cached) return null

      const cacheEntry = JSON.parse(cached)
      const now = Date.now()
      
      // Check if expired
      if (now - cacheEntry.timestamp > cacheEntry.maxAge) {
        this.delete(key)
        return null
      }

      return cacheEntry.data
    } catch (error) {
      console.warn('Failed to retrieve cached data:', error)
      return null
    }
  }

  delete(key) {
    try {
      this.storage.removeItem(this.generateKey(key))
      return true
    } catch (error) {
      console.warn('Failed to delete cached data:', error)
      return false
    }
  }

  clear() {
    try {
      const keys = Object.keys(this.storage).filter(key => 
        key.startsWith(`${this.namespace}:`)
      )
      
      keys.forEach(key => this.storage.removeItem(key))
      return true
    } catch (error) {
      console.warn('Failed to clear cache:', error)
      return false
    }
  }

  // Get all cached keys for this namespace
  getKeys() {
    try {
      return Object.keys(this.storage)
        .filter(key => key.startsWith(`${this.namespace}:`))
        .map(key => key.replace(`${this.namespace}:`, ''))
    } catch (error) {
      console.warn('Failed to get cache keys:', error)
      return []
    }
  }

  // Get cache statistics
  getStats() {
    const keys = this.getKeys()
    let totalSize = 0
    let expiredCount = 0
    const now = Date.now()

    keys.forEach(key => {
      try {
        const cached = this.storage.getItem(this.generateKey(key))
        if (cached) {
          totalSize += cached.length
          const cacheEntry = JSON.parse(cached)
          if (now - cacheEntry.timestamp > cacheEntry.maxAge) {
            expiredCount++
          }
        }
      } catch (error) {
        // Ignore parsing errors
      }
    })

    return {
      keyCount: keys.length,
      expiredCount,
      totalSizeBytes: totalSize,
      totalSizeKB: Math.round(totalSize / 1024),
      storageUsagePercent: Math.round((totalSize / (5 * 1024 * 1024)) * 100) // Assume 5MB limit
    }
  }

  // Clean up expired entries
  cleanup() {
    const keys = this.getKeys()
    let cleanedCount = 0

    keys.forEach(key => {
      try {
        const cached = this.storage.getItem(this.generateKey(key))
        if (cached) {
          const cacheEntry = JSON.parse(cached)
          const now = Date.now()
          
          if (now - cacheEntry.timestamp > cacheEntry.maxAge) {
            this.delete(key)
            cleanedCount++
          }
        }
      } catch (error) {
        // If we can't parse it, delete it
        this.delete(key)
        cleanedCount++
      }
    })

    return cleanedCount
  }
}

// Specialized caches for different data types
export const inventoryCache = new LocalCache('inventory', 2 * 60 * 1000) // 2 minutes
export const productsCache = new LocalCache('products', 10 * 60 * 1000) // 10 minutes
export const alertsCache = new LocalCache('alerts', 1 * 60 * 1000) // 1 minute
export const tasksCache = new LocalCache('tasks', 30 * 1000) // 30 seconds
export const userCache = new LocalCache('users', 30 * 60 * 1000) // 30 minutes

// Cached wrapper functions for Supabase calls
export class CachedSupabaseClient {
  constructor() {
    this.isOnline = navigator.onLine
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true
    })
    
    window.addEventListener('offline', () => {
      this.isOnline = false
    })
  }

  async cachedCall(cacheInstance, key, supabaseFunction, ...args) {
    // Try cache first
    const cached = cacheInstance.get(key)
    if (cached) {
      return { data: cached, error: null, fromCache: true }
    }

    // If offline, return cached data even if expired, or error
    if (!this.isOnline) {
      const expiredCached = this.getExpiredCache(cacheInstance, key)
      if (expiredCached) {
        return { data: expiredCached, error: null, fromCache: true, expired: true }
      }
      return { 
        data: null, 
        error: { code: 'OFFLINE', message: 'Offline and no cached data available' }, 
        fromCache: false 
      }
    }

    try {
      // Make the actual call
      const result = await supabaseFunction(...args)
      
      // Cache successful results
      if (!result.error && result.data) {
        cacheInstance.set(key, result.data)
      }
      
      return { ...result, fromCache: false }
    } catch (error) {
      // On network error, try to return expired cache
      const expiredCached = this.getExpiredCache(cacheInstance, key)
      if (expiredCached) {
        return { data: expiredCached, error: null, fromCache: true, expired: true }
      }
      
      return { data: null, error, fromCache: false }
    }
  }

  getExpiredCache(cacheInstance, key) {
    try {
      const cached = cacheInstance.storage.getItem(cacheInstance.generateKey(key))
      if (cached) {
        const cacheEntry = JSON.parse(cached)
        return cacheEntry.data
      }
    } catch (error) {
      // Ignore parsing errors
    }
    return null
  }
}

export const cachedSupabase = new CachedSupabaseClient()

// Auto cleanup expired cache entries every 5 minutes
setInterval(() => {
  inventoryCache.cleanup()
  productsCache.cleanup()
  alertsCache.cleanup()
  tasksCache.cleanup()
  userCache.cleanup()
}, 5 * 60 * 1000)

// Cache usage tracking
export const CacheMetrics = {
  hits: 0,
  misses: 0,
  
  recordHit() {
    this.hits++
    this.updateStats()
  },
  
  recordMiss() {
    this.misses++
    this.updateStats()
  },
  
  getHitRate() {
    const total = this.hits + this.misses
    return total > 0 ? (this.hits / total * 100).toFixed(1) : 0
  },
  
  updateStats() {
    // Store stats in localStorage for persistence
    try {
      localStorage.setItem('cache_metrics', JSON.stringify({
        hits: this.hits,
        misses: this.misses,
        updated: Date.now()
      }))
    } catch (error) {
      // Ignore storage errors
    }
  },
  
  loadStats() {
    try {
      const stats = localStorage.getItem('cache_metrics')
      if (stats) {
        const parsed = JSON.parse(stats)
        this.hits = parsed.hits || 0
        this.misses = parsed.misses || 0
      }
    } catch (error) {
      // Ignore parsing errors
    }
  },
  
  reset() {
    this.hits = 0
    this.misses = 0
    this.updateStats()
  }
}

// Load existing stats on init
CacheMetrics.loadStats()

// Helper function to create cache keys
export const createCacheKey = (prefix, params = {}) => {
  const paramString = Object.keys(params)
    .sort()
    .map(key => `${key}:${params[key]}`)
    .join('|')
    
  return paramString ? `${prefix}:${paramString}` : prefix
}

// Prefetch common data
export const prefetchCommonData = async () => {
  try {
    const { getProducts, getInventorySummary, getCurrentUser } = await import('../lib/supabase')
    
    // Prefetch user profile
    const user = await getCurrentUser()
    if (user) {
      userCache.set('current', user, 60 * 60 * 1000) // Cache for 1 hour
    }
    
    // Prefetch products for user's department
    if (user?.reparto) {
      const { data: products } = await getProducts({ reparto: user.reparto })
      if (products) {
        productsCache.set(`department:${user.reparto}`, products)
      }
    }
    
    // Prefetch inventory summary
    const { data: summary } = await getInventorySummary()
    if (summary) {
      inventoryCache.set('summary', summary)
    }
  } catch (error) {
    console.warn('Failed to prefetch data:', error)
  }
}

// Initialize prefetching on app load
if (typeof window !== 'undefined') {
  // Prefetch after a short delay to avoid blocking initial render
  setTimeout(prefetchCommonData, 1000)
}