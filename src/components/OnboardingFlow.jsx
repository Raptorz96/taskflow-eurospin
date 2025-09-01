import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft, 
  Zap, 
  Users, 
  Target,
  Bell,
  Camera,
  Sparkles,
  Play,
  X
} from 'lucide-react'

const OnboardingFlow = ({ currentUser, onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState(new Set())
  const [isPlaying, setIsPlaying] = useState(false)

  const onboardingSteps = [
    {
      id: 'welcome',
      title: `Benvenuto in TaskFlow, ${currentUser.nome?.split(' ')[0] || 'Collega'}!`,
      description: 'La tua nuova piattaforma per gestire i task del reparto in modo efficiente e moderno.',
      illustration: '🎉',
      features: [
        'Gestione task intelligente',
        'Collaborazione in tempo reale', 
        'Notifiche smart',
        'Analytics avanzati'
      ]
    },
    {
      id: 'navigation',
      title: 'Navigazione Semplice',
      description: 'Esplora le sezioni principali dell\'app con un tocco. Ogni scheda ha un colore e funzioni dedicate.',
      illustration: '🧭',
      interactive: true,
      features: [
        '🏠 Dashboard - Panoramica generale',
        '✅ Tasks - Gestisci le attività',
        '📦 Magazzino - Inventario e scorte',
        '🔄 Ricorrenti - Task automatici'
      ]
    },
    {
      id: 'quickactions',
      title: 'Azioni Rapide',
      description: 'Crea task in pochi secondi con le nostre azioni rapide. Foto, voice-to-text e template predefiniti.',
      illustration: '⚡',
      interactive: true,
      features: [
        '📸 Foto Task - Scatta e crea automaticamente',
        '🎤 Voice Input - Parla per creare task',
        '📋 Template - Task comuni preimpostati',
        '➕ Quick Add - Creazione veloce'
      ]
    }
  ]

  const nextStep = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCompletedSteps(prev => new Set([...prev, currentStep]))
      setCurrentStep(prev => prev + 1)
    } else {
      onComplete()
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const skipOnboarding = () => {
    onSkip()
  }

  const handleInteractiveDemo = () => {
    setIsPlaying(true)
    
    // Simulate interactive demo
    setTimeout(() => {
      setIsPlaying(false)
      setCompletedSteps(prev => new Set([...prev, currentStep]))
    }, 2000)
  }

  const step = onboardingSteps[currentStep]
  const progress = ((currentStep + 1) / onboardingSteps.length) * 100

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", duration: 0.5 }}
      >
        {/* Header */}
        <div className="relative p-6 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
          <button
            onClick={skipOnboarding}
            className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span>Passaggio {currentStep + 1} di {onboardingSteps.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-blue-700/50 rounded-full h-2">
              <motion.div
                className="bg-white rounded-full h-2"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-center space-x-3 mb-6">
            {onboardingSteps.map((_, index) => (
              <motion.div
                key={index}
                className={`w-3 h-3 rounded-full border-2 border-white/50 ${
                  index <= currentStep ? 'bg-white' : 'bg-transparent'
                }`}
                animate={{
                  scale: index === currentStep ? 1.2 : 1,
                  backgroundColor: completedSteps.has(index) ? '#10B981' : 
                                  index === currentStep ? '#FFFFFF' : 'transparent'
                }}
                transition={{ duration: 0.3 }}
              >
                <AnimatePresence>
                  {completedSteps.has(index) && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <CheckCircle className="w-3 h-3 text-white" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            className="p-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Illustration */}
            <motion.div 
              className="text-center mb-6"
              animate={{ 
                scale: isPlaying ? [1, 1.1, 1] : 1,
                rotate: isPlaying ? [0, 5, -5, 0] : 0
              }}
              transition={{ 
                duration: isPlaying ? 0.5 : 0,
                repeat: isPlaying ? 3 : 0 
              }}
            >
              <div className="text-6xl mb-4">{step.illustration}</div>
              <motion.div
                className="w-20 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto"
                animate={{ scaleX: isPlaying ? [1, 1.5, 1] : 1 }}
                transition={{ duration: 0.5 }}
              />
            </motion.div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-4">
              {step.title}
            </h2>

            {/* Description */}
            <p className="text-gray-600 dark:text-gray-300 text-center mb-6 leading-relaxed">
              {step.description}
            </p>

            {/* Features */}
            <div className="space-y-3 mb-8">
              {step.features.map((feature, index) => (
                <motion.div
                  key={index}
                  className="flex items-center p-3 bg-gray-50 dark:bg-slate-700 rounded-xl"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                </motion.div>
              ))}
            </div>

            {/* Interactive Demo Button */}
            {step.interactive && (
              <motion.button
                onClick={handleInteractiveDemo}
                disabled={isPlaying}
                className={`w-full mb-4 p-4 rounded-xl border-2 border-dashed transition-all ${
                  completedSteps.has(currentStep)
                    ? 'border-green-300 bg-green-50 text-green-700'
                    : 'border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
                whileHover={{ scale: completedSteps.has(currentStep) ? 1 : 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-center space-x-2">
                  {completedSteps.has(currentStep) ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Demo Completato!</span>
                    </>
                  ) : isPlaying ? (
                    <>
                      <motion.div
                        className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      <span className="font-medium">In Riproduzione...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      <span className="font-medium">Prova Demo Interattiva</span>
                    </>
                  )}
                </div>
              </motion.button>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between p-6 bg-gray-50 dark:bg-slate-700">
          <motion.button
            onClick={prevStep}
            disabled={currentStep === 0}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all ${
              currentStep === 0 
                ? 'text-gray-400 cursor-not-allowed' 
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
            }`}
            whileHover={{ x: currentStep === 0 ? 0 : -2 }}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Indietro</span>
          </motion.button>

          <div className="flex items-center space-x-2">
            <motion.button
              onClick={skipOnboarding}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 px-4 py-2 rounded-xl transition-colors text-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Salta
            </motion.button>

            <motion.button
              onClick={nextStep}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
              whileHover={{ scale: 1.05, y: -1 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="flex items-center space-x-2">
                <span>{currentStep === onboardingSteps.length - 1 ? 'Inizia!' : 'Avanti'}</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default OnboardingFlow