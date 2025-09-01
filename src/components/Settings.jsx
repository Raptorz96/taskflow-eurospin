import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Settings as SettingsIcon, 
  Bell, 
  Keyboard, 
  Download, 
  Upload, 
  Wifi, 
  WifiOff, 
  BarChart3, 
  Bug, 
  Shield, 
  Palette, 
  Volume2, 
  VolumeX, 
  Smartphone, 
  Monitor, 
  ToggleLeft, 
  ToggleRight,
  Save,
  RotateCcw,
  X,
  CheckCircle,
  AlertTriangle,
  Database,
  HardDrive,
  Zap,
  Clock,
  Camera
} from 'lucide-react'
import { supabase } from '../lib/supabase'

const Settings = ({ currentUser, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('notifications')
  const [settings, setSettings] = useState({
    notifications: {
      push_enabled: true,
      email_enabled: false,
      sound_enabled: true,
      vibration_enabled: true,
      task_reminders: true,
      scadenze_alerts: true,
      inventory_alerts: true,
      promo_changes: false,
      daily_summary: true
    },
    shortcuts: {
      quick_add_task: 'Space',
      voice_commands: 'V',
      camera_capture: 'C',
      refresh_dashboard: 'R',
      toggle_camion: 'T',
      open_inventory: 'I',
      mark_complete: 'Enter'
    },
    appearance: {
      theme: 'system',
      compact_view: false,
      animations_enabled: true,
      high_contrast: false,
      large_text: false,
      card_density: 'normal'
    },
    performance: {
      auto_refresh: true,
      refresh_interval: 120,
      image_quality: 'high',
      cache_enabled: true,
      offline_mode: true,
      preload_images: true,
      lazy_loading: true
    },
    advanced: {
      debug_mode: false,
      performance_metrics: false,
      api_logging: false,
      error_reporting: true,
      beta_features: false,
      developer_mode: false
    }
  })
  
  const [isDirty, setIsDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [backupData, setBackupData] = useState(null)
  const [storageInfo, setStorageInfo] = useState(null)
  const [performanceMetrics, setPerformanceMetrics] = useState(null)

  const tabs = [
    { id: 'notifications', label: 'Notifiche', icon: Bell },
    { id: 'shortcuts', label: 'Shortcuts', icon: Keyboard },
    { id: 'appearance', label: 'Aspetto', icon: Palette },
    { id: 'performance', label: 'Performance', icon: Zap },
    { id: 'data', label: 'Dati', icon: Database },
    { id: 'advanced', label: 'Avanzate', icon: SettingsIcon }
  ]

  useEffect(() => {
    if (isOpen) {
      loadSettings()
      loadStorageInfo()
      loadPerformanceMetrics()
    }
  }, [isOpen])

  const loadSettings = async () => {
    try {
      const savedSettings = localStorage.getItem('taskflow_settings')
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings)
        setSettings(prevSettings => ({
          ...prevSettings,
          ...parsed
        }))
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  const loadStorageInfo = async () => {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate()
        setStorageInfo({
          used: estimate.usage,
          total: estimate.quota,
          percentage: Math.round((estimate.usage / estimate.quota) * 100)
        })
      }

      // Get cache info
      const cacheSize = localStorage.getItem('cache_size') || '0'
      setStorageInfo(prev => ({
        ...prev,
        cacheSize: parseInt(cacheSize)
      }))
    } catch (error) {
      console.error('Error loading storage info:', error)
    }
  }

  const loadPerformanceMetrics = () => {
    const metrics = {
      memoryUsage: performance.memory?.usedJSHeapSize || 0,
      loadTime: Math.round(performance.timing.loadEventEnd - performance.timing.navigationStart),
      renderTime: Math.round(performance.now()),
      apiCalls: parseInt(localStorage.getItem('api_calls_count') || '0'),
      cacheHitRate: parseFloat(localStorage.getItem('cache_hit_rate') || '0')
    }
    setPerformanceMetrics(metrics)
  }

  const updateSetting = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }))
    setIsDirty(true)
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      localStorage.setItem('taskflow_settings', JSON.stringify(settings))
      
      // Apply settings immediately
      applySettings()
      
      // Save to user profile if needed
      await supabase
        .from('profiles')
        .update({ settings: settings })
        .eq('id', currentUser.id)

      setIsDirty(false)
      
      // Show success feedback
      showToast('Impostazioni salvate con successo', 'success')
    } catch (error) {
      console.error('Error saving settings:', error)
      showToast('Errore nel salvataggio delle impostazioni', 'error')
    } finally {
      setSaving(false)
    }
  }

  const applySettings = () => {
    // Apply theme
    if (settings.appearance.theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else if (settings.appearance.theme === 'light') {
      document.documentElement.classList.remove('dark')
    }

    // Apply performance settings
    if (settings.performance.auto_refresh) {
      localStorage.setItem('auto_refresh_interval', settings.performance.refresh_interval.toString())
    }

    // Apply other settings...
  }

  const resetSettings = () => {
    if (confirm('Sei sicuro di voler ripristinare tutte le impostazioni?')) {
      const defaultSettings = {
        notifications: {
          push_enabled: true,
          email_enabled: false,
          sound_enabled: true,
          vibration_enabled: true,
          task_reminders: true,
          scadenze_alerts: true,
          inventory_alerts: true,
          promo_changes: false,
          daily_summary: true
        },
        shortcuts: {
          quick_add_task: 'Space',
          voice_commands: 'V',
          camera_capture: 'C',
          refresh_dashboard: 'R',
          toggle_camion: 'T',
          open_inventory: 'I',
          mark_complete: 'Enter'
        },
        appearance: {
          theme: 'system',
          compact_view: false,
          animations_enabled: true,
          high_contrast: false,
          large_text: false,
          card_density: 'normal'
        },
        performance: {
          auto_refresh: true,
          refresh_interval: 120,
          image_quality: 'high',
          cache_enabled: true,
          offline_mode: true,
          preload_images: true,
          lazy_loading: true
        },
        advanced: {
          debug_mode: false,
          performance_metrics: false,
          api_logging: false,
          error_reporting: true,
          beta_features: false,
          developer_mode: false
        }
      }
      
      setSettings(defaultSettings)
      setIsDirty(true)
      showToast('Impostazioni ripristinate', 'info')
    }
  }

  const exportSettings = async () => {
    try {
      const dataToExport = {
        settings,
        user: {
          id: currentUser.id,
          nome: currentUser.nome,
          ruolo: currentUser.ruolo,
          reparto: currentUser.reparto
        },
        timestamp: new Date().toISOString(),
        version: '1.0'
      }

      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
        type: 'application/json'
      })

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `taskflow-backup-${currentUser.id}-${Date.now()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      showToast('Backup esportato con successo', 'success')
    } catch (error) {
      console.error('Error exporting settings:', error)
      showToast('Errore durante l\'esportazione', 'error')
    }
  }

  const importSettings = (event) => {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result)
        
        if (imported.settings && imported.version) {
          setSettings(imported.settings)
          setIsDirty(true)
          showToast('Backup importato con successo', 'success')
        } else {
          throw new Error('Formato backup non valido')
        }
      } catch (error) {
        console.error('Error importing settings:', error)
        showToast('Errore durante l\'importazione', 'error')
      }
    }
    reader.readAsText(file)
    
    // Reset input
    event.target.value = ''
  }

  const clearCache = async () => {
    if (confirm('Vuoi cancellare tutti i dati della cache? L\'app potrebbe essere più lenta al prossimo caricamento.')) {
      try {
        // Clear localStorage cache
        const keysToRemove = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && key.startsWith('cache_')) {
            keysToRemove.push(key)
          }
        }
        
        keysToRemove.forEach(key => localStorage.removeItem(key))
        
        // Clear ServiceWorker cache if available
        if ('caches' in window) {
          const cacheNames = await caches.keys()
          await Promise.all(cacheNames.map(name => caches.delete(name)))
        }
        
        localStorage.setItem('cache_size', '0')
        loadStorageInfo()
        showToast('Cache cancellata con successo', 'success')
      } catch (error) {
        console.error('Error clearing cache:', error)
        showToast('Errore durante la cancellazione della cache', 'error')
      }
    }
  }

  const showToast = (message, type = 'info') => {
    // Simple toast implementation
    const toast = document.createElement('div')
    toast.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-medium ${
      type === 'success' ? 'bg-green-500' : 
      type === 'error' ? 'bg-red-500' : 
      type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
    }`
    toast.textContent = message
    document.body.appendChild(toast)
    
    setTimeout(() => {
      document.body.removeChild(toast)
    }, 3000)
  }

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const Toggle = ({ enabled, onChange }) => (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? 'bg-blue-500' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )

  const SettingRow = ({ label, description, children }) => (
    <div className="flex items-start justify-between py-3 border-b border-gray-100 last:border-b-0">
      <div className="flex-1 min-w-0 mr-4">
        <h4 className="text-sm font-medium text-gray-900">{label}</h4>
        {description && (
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        )}
      </div>
      <div className="flex-shrink-0">
        {children}
      </div>
    </div>
  )

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          initial={{ scale: 0.9, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 50 }}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-700 rounded-xl flex items-center justify-center">
                  <SettingsIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Impostazioni</h2>
                  <p className="text-sm text-gray-600">Personalizza TaskFlow secondo le tue esigenze</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {isDirty && (
                  <motion.button
                    onClick={saveSettings}
                    disabled={saving}
                    className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Salvataggio...' : 'Salva'}</span>
                  </motion.button>
                )}
                
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 mt-6 overflow-x-auto">
              {tabs.map((tab) => {
                const IconComponent = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'notifications' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Notifiche</h3>
                      <div className="bg-gray-50 rounded-xl p-4 space-y-0">
                        <SettingRow
                          label="Notifiche Push"
                          description="Ricevi notifiche per task e aggiornamenti"
                        >
                          <Toggle
                            enabled={settings.notifications.push_enabled}
                            onChange={(value) => updateSetting('notifications', 'push_enabled', value)}
                          />
                        </SettingRow>
                        
                        <SettingRow
                          label="Notifiche Email"
                          description="Ricevi riassunti giornalieri via email"
                        >
                          <Toggle
                            enabled={settings.notifications.email_enabled}
                            onChange={(value) => updateSetting('notifications', 'email_enabled', value)}
                          />
                        </SettingRow>

                        <SettingRow
                          label="Suoni"
                          description="Riproduce suoni per le notifiche"
                        >
                          <Toggle
                            enabled={settings.notifications.sound_enabled}
                            onChange={(value) => updateSetting('notifications', 'sound_enabled', value)}
                          />
                        </SettingRow>

                        <SettingRow
                          label="Vibrazione"
                          description="Vibrazione per feedback tattile"
                        >
                          <Toggle
                            enabled={settings.notifications.vibration_enabled}
                            onChange={(value) => updateSetting('notifications', 'vibration_enabled', value)}
                          />
                        </SettingRow>

                        <SettingRow
                          label="Promemoria Task"
                          description="Notifiche per task in scadenza"
                        >
                          <Toggle
                            enabled={settings.notifications.task_reminders}
                            onChange={(value) => updateSetting('notifications', 'task_reminders', value)}
                          />
                        </SettingRow>

                        <SettingRow
                          label="Alert Scadenze"
                          description="Notifiche per prodotti in scadenza"
                        >
                          <Toggle
                            enabled={settings.notifications.scadenze_alerts}
                            onChange={(value) => updateSetting('notifications', 'scadenze_alerts', value)}
                          />
                        </SettingRow>

                        <SettingRow
                          label="Alert Inventario"
                          description="Notifiche per rimanenze critiche"
                        >
                          <Toggle
                            enabled={settings.notifications.inventory_alerts}
                            onChange={(value) => updateSetting('notifications', 'inventory_alerts', value)}
                          />
                        </SettingRow>

                        <SettingRow
                          label="Riassunto Giornaliero"
                          description="Riepilogo quotidiano delle attività"
                        >
                          <Toggle
                            enabled={settings.notifications.daily_summary}
                            onChange={(value) => updateSetting('notifications', 'daily_summary', value)}
                          />
                        </SettingRow>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'shortcuts' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Scorciatoie Personalizzate</h3>
                      <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                        {Object.entries(settings.shortcuts).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between py-2">
                            <span className="text-sm font-medium text-gray-700 capitalize">
                              {key.replace(/_/g, ' ')}
                            </span>
                            <input
                              type="text"
                              value={value}
                              onChange={(e) => updateSetting('shortcuts', key, e.target.value)}
                              className="w-20 px-3 py-1 text-center text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Key"
                            />
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                        <h4 className="font-semibold text-blue-900 mb-2">💡 Scorciatoie Disponibili</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm text-blue-700">
                          <div>• <kbd className="bg-blue-200 px-1 rounded">Space</kbd> Nuovo task</div>
                          <div>• <kbd className="bg-blue-200 px-1 rounded">C</kbd> Camera</div>
                          <div>• <kbd className="bg-blue-200 px-1 rounded">V</kbd> Comandi vocali</div>
                          <div>• <kbd className="bg-blue-200 px-1 rounded">R</kbd> Aggiorna</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'appearance' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Aspetto e Interfaccia</h3>
                      <div className="bg-gray-50 rounded-xl p-4 space-y-0">
                        <SettingRow
                          label="Tema"
                          description="Scegli il tema dell'interfaccia"
                        >
                          <select
                            value={settings.appearance.theme}
                            onChange={(e) => updateSetting('appearance', 'theme', e.target.value)}
                            className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="light">Chiaro</option>
                            <option value="dark">Scuro</option>
                            <option value="system">Sistema</option>
                          </select>
                        </SettingRow>

                        <SettingRow
                          label="Vista Compatta"
                          description="Riduci il padding e gli spazi"
                        >
                          <Toggle
                            enabled={settings.appearance.compact_view}
                            onChange={(value) => updateSetting('appearance', 'compact_view', value)}
                          />
                        </SettingRow>

                        <SettingRow
                          label="Animazioni"
                          description="Abilita transizioni e animazioni"
                        >
                          <Toggle
                            enabled={settings.appearance.animations_enabled}
                            onChange={(value) => updateSetting('appearance', 'animations_enabled', value)}
                          />
                        </SettingRow>

                        <SettingRow
                          label="Alto Contrasto"
                          description="Migliora la leggibilità"
                        >
                          <Toggle
                            enabled={settings.appearance.high_contrast}
                            onChange={(value) => updateSetting('appearance', 'high_contrast', value)}
                          />
                        </SettingRow>

                        <SettingRow
                          label="Testo Grande"
                          description="Aumenta la dimensione del testo"
                        >
                          <Toggle
                            enabled={settings.appearance.large_text}
                            onChange={(value) => updateSetting('appearance', 'large_text', value)}
                          />
                        </SettingRow>

                        <SettingRow
                          label="Densità Card"
                          description="Spaziatura delle card"
                        >
                          <select
                            value={settings.appearance.card_density}
                            onChange={(e) => updateSetting('appearance', 'card_density', e.target.value)}
                            className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="compact">Compatta</option>
                            <option value="normal">Normale</option>
                            <option value="spacious">Spaziosa</option>
                          </select>
                        </SettingRow>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'performance' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance e Ottimizzazione</h3>
                      <div className="bg-gray-50 rounded-xl p-4 space-y-0">
                        <SettingRow
                          label="Aggiornamento Automatico"
                          description="Aggiorna i dati automaticamente"
                        >
                          <Toggle
                            enabled={settings.performance.auto_refresh}
                            onChange={(value) => updateSetting('performance', 'auto_refresh', value)}
                          />
                        </SettingRow>

                        <SettingRow
                          label="Intervallo Aggiornamento"
                          description="Secondi tra gli aggiornamenti automatici"
                        >
                          <select
                            value={settings.performance.refresh_interval}
                            onChange={(e) => updateSetting('performance', 'refresh_interval', parseInt(e.target.value))}
                            className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            disabled={!settings.performance.auto_refresh}
                          >
                            <option value="30">30s</option>
                            <option value="60">1 min</option>
                            <option value="120">2 min</option>
                            <option value="300">5 min</option>
                          </select>
                        </SettingRow>

                        <SettingRow
                          label="Qualità Immagini"
                          description="Qualità delle foto scattate"
                        >
                          <select
                            value={settings.performance.image_quality}
                            onChange={(e) => updateSetting('performance', 'image_quality', e.target.value)}
                            className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="low">Bassa</option>
                            <option value="medium">Media</option>
                            <option value="high">Alta</option>
                          </select>
                        </SettingRow>

                        <SettingRow
                          label="Cache Abilitata"
                          description="Memorizza dati per accesso più veloce"
                        >
                          <Toggle
                            enabled={settings.performance.cache_enabled}
                            onChange={(value) => updateSetting('performance', 'cache_enabled', value)}
                          />
                        </SettingRow>

                        <SettingRow
                          label="Modalità Offline"
                          description="Funzionalità di base senza connessione"
                        >
                          <Toggle
                            enabled={settings.performance.offline_mode}
                            onChange={(value) => updateSetting('performance', 'offline_mode', value)}
                          />
                        </SettingRow>

                        <SettingRow
                          label="Precarica Immagini"
                          description="Scarica le immagini in anticipo"
                        >
                          <Toggle
                            enabled={settings.performance.preload_images}
                            onChange={(value) => updateSetting('performance', 'preload_images', value)}
                          />
                        </SettingRow>

                        <SettingRow
                          label="Lazy Loading"
                          description="Carica i contenuti solo quando visibili"
                        >
                          <Toggle
                            enabled={settings.performance.lazy_loading}
                            onChange={(value) => updateSetting('performance', 'lazy_loading', value)}
                          />
                        </SettingRow>
                      </div>
                    </div>

                    {/* Performance Metrics */}
                    {performanceMetrics && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Metriche Performance</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                            <div className="flex items-center space-x-2 mb-2">
                              <Clock className="w-4 h-4 text-blue-600" />
                              <span className="text-sm font-medium text-blue-900">Tempo di Caricamento</span>
                            </div>
                            <div className="text-2xl font-bold text-blue-700">{performanceMetrics.loadTime}ms</div>
                          </div>

                          <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                            <div className="flex items-center space-x-2 mb-2">
                              <BarChart3 className="w-4 h-4 text-green-600" />
                              <span className="text-sm font-medium text-green-900">API Calls</span>
                            </div>
                            <div className="text-2xl font-bold text-green-700">{performanceMetrics.apiCalls}</div>
                          </div>

                          <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                            <div className="flex items-center space-x-2 mb-2">
                              <HardDrive className="w-4 h-4 text-purple-600" />
                              <span className="text-sm font-medium text-purple-900">Memoria Utilizzata</span>
                            </div>
                            <div className="text-2xl font-bold text-purple-700">{formatBytes(performanceMetrics.memoryUsage)}</div>
                          </div>

                          <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
                            <div className="flex items-center space-x-2 mb-2">
                              <Zap className="w-4 h-4 text-orange-600" />
                              <span className="text-sm font-medium text-orange-900">Cache Hit Rate</span>
                            </div>
                            <div className="text-2xl font-bold text-orange-700">{(performanceMetrics.cacheHitRate * 100).toFixed(1)}%</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'data' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Gestione Dati</h3>
                      
                      {/* Storage Info */}
                      {storageInfo && (
                        <div className="bg-gray-50 rounded-xl p-4 mb-6">
                          <h4 className="font-semibold text-gray-900 mb-3">Utilizzo Storage</h4>
                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>Spazio utilizzato</span>
                                <span>{formatBytes(storageInfo.used)} di {formatBytes(storageInfo.total)}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-500 h-2 rounded-full transition-all"
                                  style={{ width: `${storageInfo.percentage}%` }}
                                />
                              </div>
                            </div>
                            <div className="text-sm text-gray-600">
                              Cache: {formatBytes(storageInfo.cacheSize || 0)}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Backup & Restore */}
                      <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                        <h4 className="font-semibold text-gray-900">Backup e Ripristino</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <button
                            onClick={exportSettings}
                            className="flex items-center justify-center space-x-2 p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                          >
                            <Download className="w-4 h-4" />
                            <span>Esporta Backup</span>
                          </button>

                          <label className="flex items-center justify-center space-x-2 p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors cursor-pointer">
                            <Upload className="w-4 h-4" />
                            <span>Importa Backup</span>
                            <input
                              type="file"
                              accept=".json"
                              onChange={importSettings}
                              className="hidden"
                            />
                          </label>
                        </div>

                        <button
                          onClick={clearCache}
                          className="w-full flex items-center justify-center space-x-2 p-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                        >
                          <Database className="w-4 h-4" />
                          <span>Cancella Cache</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'advanced' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Impostazioni Avanzate</h3>
                      
                      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                        <div className="flex items-start space-x-2">
                          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <h4 className="font-semibold text-yellow-900">Attenzione</h4>
                            <p className="text-sm text-yellow-800">Queste impostazioni sono per utenti esperti. Modificarle potrebbe influenzare le prestazioni o la stabilità dell'app.</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-xl p-4 space-y-0">
                        <SettingRow
                          label="Modalità Debug"
                          description="Mostra informazioni di debug nella console"
                        >
                          <Toggle
                            enabled={settings.advanced.debug_mode}
                            onChange={(value) => updateSetting('advanced', 'debug_mode', value)}
                          />
                        </SettingRow>

                        <SettingRow
                          label="Metriche Performance"
                          description="Raccoglie dati sulle performance"
                        >
                          <Toggle
                            enabled={settings.advanced.performance_metrics}
                            onChange={(value) => updateSetting('advanced', 'performance_metrics', value)}
                          />
                        </SettingRow>

                        <SettingRow
                          label="Log API"
                          description="Registra tutte le chiamate API"
                        >
                          <Toggle
                            enabled={settings.advanced.api_logging}
                            onChange={(value) => updateSetting('advanced', 'api_logging', value)}
                          />
                        </SettingRow>

                        <SettingRow
                          label="Segnalazione Errori"
                          description="Invia automaticamente i report di errore"
                        >
                          <Toggle
                            enabled={settings.advanced.error_reporting}
                            onChange={(value) => updateSetting('advanced', 'error_reporting', value)}
                          />
                        </SettingRow>

                        <SettingRow
                          label="Funzionalità Beta"
                          description="Abilita funzionalità sperimentali"
                        >
                          <Toggle
                            enabled={settings.advanced.beta_features}
                            onChange={(value) => updateSetting('advanced', 'beta_features', value)}
                          />
                        </SettingRow>

                        {['admin', 'developer'].includes(currentUser.ruolo) && (
                          <SettingRow
                            label="Modalità Sviluppatore"
                            description="Funzionalità per sviluppatori"
                          >
                            <Toggle
                              enabled={settings.advanced.developer_mode}
                              onChange={(value) => updateSetting('advanced', 'developer_mode', value)}
                            />
                          </SettingRow>
                        )}
                      </div>

                      <div className="flex space-x-3">
                        <button
                          onClick={resetSettings}
                          className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span>Reset Completo</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default Settings