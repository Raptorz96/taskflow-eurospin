import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, User, Star, MessageCircle, Calendar, ChevronRight, CheckCircle, UserCheck, Camera, Zap, AlertCircle } from 'lucide-react'
import { updateTask } from '../lib/supabase'

const TaskCard = ({ task, currentUser, onUpdate, onOpenComments, onAssign, isNearSuggestedTime = false }) => {
  const [isSwipeable, setIsSwipeable] = useState(true)
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const cardRef = useRef(null)
  const startX = useRef(0)
  const startTime = useRef(0)

  const getDepartmentInfo = (reparto) => {
    const departments = {
      ortofrutta: { name: 'Ortofrutta', color: 'department-ortofrutta', icon: '🥬' },
      macelleria: { name: 'Macelleria', color: 'department-macelleria', icon: '🥩' },
      gastronomia: { name: 'Gastronomia', color: 'department-gastronomia', icon: '🍝' },
      panetteria: { name: 'Panetteria', color: 'department-panetteria', icon: '🥖' },
      magazzino: { name: 'Magazzino', color: 'department-magazzino', icon: '📦' },
      casse: { name: 'Casse', color: 'department-casse', icon: '💰' }
    }
    return departments[reparto] || { name: reparto, color: 'bg-gray-50', icon: '📝' }
  }

  const getTimeSlotInfo = (fascia_oraria) => {
    const timeSlots = {
      mattina: { name: 'Mattina', time: '6:00-13:00', icon: '🌅' },
      pomeriggio: { name: 'Pomeriggio', time: '13:00-18:00', icon: '☀️' },
      sera: { name: 'Sera', time: '18:00-22:00', icon: '🌙' }
    }
    return timeSlots[fascia_oraria] || { name: fascia_oraria, time: '', icon: '🕐' }
  }

  const getStatusColor = (stato) => {
    const colors = {
      da_fare: 'bg-red-100 text-red-800',
      in_corso: 'bg-yellow-100 text-yellow-800',
      completato: 'bg-green-100 text-green-800'
    }
    return colors[stato] || 'bg-gray-100 text-gray-800'
  }

  const getStatusText = (stato) => {
    const statuses = {
      da_fare: 'Da fare',
      in_corso: 'In corso',
      completato: 'Completato'
    }
    return statuses[stato] || stato
  }

  const formatDate = (dateString) => {
    if (!dateString) return null
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = date - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Oggi'
    if (diffDays === 1) return 'Domani'
    if (diffDays === -1) return 'Ieri'
    if (diffDays < -1) return `${Math.abs(diffDays)} giorni fa`
    if (diffDays > 1) return `Tra ${diffDays} giorni`
    
    return date.toLocaleDateString('it-IT')
  }

  const canAssignTask = () => {
    const userRole = currentUser.ruolo
    return ['responsabile', 'admin'].includes(userRole) && task.stato !== 'completato'
  }

  const canCompleteTask = () => {
    const isAssigned = task.assegnato_a === currentUser.id
    const isCreator = task.creato_da === currentUser.id
    const isManager = ['responsabile', 'admin'].includes(currentUser.ruolo)
    return (isAssigned || isCreator || isManager) && task.stato !== 'completato'
  }

  const handleTouchStart = (e) => {
    if (!isSwipeable || task.stato === 'completato') return
    
    setIsDragging(true)
    startX.current = e.touches[0].clientX
    startTime.current = Date.now()
    
    // Add haptic feedback if available
    if (navigator.vibrate) {
      navigator.vibrate(10)
    }
  }

  const handleTouchMove = (e) => {
    if (!isDragging) return
    
    const currentX = e.touches[0].clientX
    const diffX = currentX - startX.current
    const maxSwipe = 120
    
    // Limit swipe distance
    const limitedDiff = Math.max(-maxSwipe, Math.min(maxSwipe, diffX))
    setSwipeOffset(limitedDiff)
  }

  const handleTouchEnd = async () => {
    if (!isDragging) return
    
    setIsDragging(false)
    const swipeThreshold = 60
    const swipeTime = Date.now() - startTime.current
    
    try {
      if (Math.abs(swipeOffset) > swipeThreshold && swipeTime < 300) {
        if (swipeOffset > 0 && canAssignTask()) {
          // Right swipe - assign task
          if (navigator.vibrate) {
            navigator.vibrate([50, 50, 50])
          }
          onAssign(task)
        } else if (swipeOffset < 0 && canCompleteTask()) {
          // Left swipe - complete task
          if (navigator.vibrate) {
            navigator.vibrate([100])
          }
          const updatedTask = { ...task, stato: 'completato' }
          await updateTask(task.id, { stato: 'completato' })
          onUpdate(updatedTask)
        }
      }
    } catch (error) {
      console.error('Error updating task:', error)
    }
    
    setSwipeOffset(0)
  }

  const handleMouseDown = (e) => {
    if (!isSwipeable || task.stato === 'completato') return
    
    setIsDragging(true)
    startX.current = e.clientX
    startTime.current = Date.now()
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return
    
    const currentX = e.clientX
    const diffX = currentX - startX.current
    const maxSwipe = 120
    
    const limitedDiff = Math.max(-maxSwipe, Math.min(maxSwipe, diffX))
    setSwipeOffset(limitedDiff)
  }

  const handleMouseUp = async () => {
    if (!isDragging) return
    
    setIsDragging(false)
    const swipeThreshold = 60
    const swipeTime = Date.now() - startTime.current
    
    try {
      if (Math.abs(swipeOffset) > swipeThreshold && swipeTime < 300) {
        if (swipeOffset > 0 && canAssignTask()) {
          onAssign(task)
        } else if (swipeOffset < 0 && canCompleteTask()) {
          const updatedTask = { ...task, stato: 'completato' }
          await updateTask(task.id, { stato: 'completato' })
          onUpdate(updatedTask)
        }
      }
    } catch (error) {
      console.error('Error updating task:', error)
    }
    
    setSwipeOffset(0)
  }

  const departmentInfo = getDepartmentInfo(task.reparto)
  const timeSlotInfo = getTimeSlotInfo(task.fascia_oraria)
  const dueDateInfo = formatDate(task.data_scadenza)

  const getPriorityColor = (priority) => {
    const colors = {
      5: 'from-red-50 to-red-100 border-red-200',
      4: 'from-orange-50 to-orange-100 border-orange-200', 
      3: 'from-yellow-50 to-yellow-100 border-yellow-200',
      2: 'from-blue-50 to-blue-100 border-blue-200',
      1: 'from-purple-50 to-purple-100 border-purple-200'
    }
    return colors[priority] || 'from-gray-50 to-gray-100 border-gray-200'
  }

  const getStatusIcon = (stato) => {
    switch (stato) {
      case 'completato': return CheckCircle
      case 'in_corso': return Zap
      case 'da_fare': return Clock
      default: return Clock
    }
  }

  const isOverdue = dueDateInfo && dueDateInfo.includes('fa')
  const isUrgent = task.priorita >= 4
  const isDueToday = dueDateInfo === 'Oggi'

  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      {/* Swipe Actions Background */}
      <div className="absolute inset-0 flex items-center justify-between px-6 rounded-xl overflow-hidden z-0">
        {/* Right swipe action - Assign */}
        {canAssignTask() && (
          <motion.div 
            className="flex items-center space-x-2 text-blue-600"
            initial={{ opacity: 0, x: -20 }}
            animate={{ 
              opacity: swipeOffset > 30 ? 1 : 0.3,
              x: swipeOffset > 30 ? 0 : -20,
              scale: swipeOffset > 60 ? 1.1 : 1
            }}
            transition={{ duration: 0.1 }}
          >
            <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <span className="font-medium">Assegna</span>
          </motion.div>
        )}
        
        {/* Left swipe action - Complete */}
        {canCompleteTask() && (
          <motion.div 
            className="flex items-center space-x-2 text-green-600 ml-auto"
            initial={{ opacity: 0, x: 20 }}
            animate={{ 
              opacity: swipeOffset < -30 ? 1 : 0.3,
              x: swipeOffset < -30 ? 0 : 20,
              scale: swipeOffset < -60 ? 1.1 : 1
            }}
            transition={{ duration: 0.1 }}
          >
            <span className="font-medium">Completa</span>
            <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
          </motion.div>
        )}
      </div>

      {/* Task Card */}
      <motion.div
        ref={cardRef}
        className={`card interactive relative z-10 bg-gradient-to-br ${getPriorityColor(task.priorita)} ${
          isDragging ? 'transition-none' : 'transition-smooth'
        } ${
          isNearSuggestedTime ? 'ring-2 ring-orange-400 ring-offset-2' : ''
        } ${
          isOverdue ? 'ring-2 ring-red-400 ring-offset-2' : ''
        } ${
          task.stato === 'completato' ? 'opacity-75' : ''
        }`}
        style={{ 
          transform: `translateX(${swipeOffset}px)`,
          touchAction: 'pan-y pinch-zoom'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        whileTap={{ scale: 0.98 }}
      >
        {/* Priority Indicator */}
        <div className="absolute top-0 right-0 w-0 h-0 border-l-[20px] border-l-transparent border-b-[20px] overflow-hidden rounded-tr-lg"
             style={{ 
               borderBottomColor: task.priorita >= 4 ? '#EF4444' : 
                                  task.priorita >= 3 ? '#F59E0B' :
                                  task.priorita >= 2 ? '#3B82F6' : '#8B5CF6'
             }}>
        </div>

        {/* Urgent/Overdue Badges */}
        <AnimatePresence>
          {(isUrgent || isOverdue || isDueToday) && (
            <motion.div 
              className="absolute -top-2 -left-2 flex flex-col gap-1"
              initial={{ scale: 0, rotate: -12 }}
              animate={{ scale: 1, rotate: -12 }}
              exit={{ scale: 0, rotate: -12 }}
            >
              {isOverdue && (
                <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg">
                  SCADUTO
                </div>
              )}
              {isDueToday && !isOverdue && (
                <div className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg">
                  OGGI
                </div>
              )}
              {isUrgent && !isOverdue && !isDueToday && (
                <div className="bg-yellow-500 text-black text-xs px-2 py-1 rounded-full font-bold shadow-lg">
                  URGENTE
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Near Suggested Time Indicator */}
        {isNearSuggestedTime && (
          <motion.div 
            className="absolute -top-1 right-4 bg-orange-400 text-white p-1 rounded-full"
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 10, -10, 0]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              repeatDelay: 3
            }}
          >
            <AlertCircle className="w-4 h-4" />
          </motion.div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <motion.div 
              className="w-12 h-12 bg-white/80 rounded-xl flex items-center justify-center shadow-sm"
              whileHover={{ scale: 1.1 }}
            >
              <span className="text-xl">{departmentInfo.icon}</span>
            </motion.div>
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-sm font-bold text-gray-800">
                  {departmentInfo.name}
                </span>
                <div className="w-1 h-1 bg-gray-400 rounded-full" />
                <span className="text-xs text-gray-500">
                  {timeSlotInfo.name}
                </span>
              </div>
              <div className="flex items-center space-x-1 text-xs text-gray-400">
                <span>{timeSlotInfo.icon}</span>
                <span>{timeSlotInfo.time}</span>
              </div>
            </div>
          </div>
          
          <motion.div 
            className="flex items-center space-x-2"
            whileHover={{ scale: 1.05 }}
          >
            {React.createElement(getStatusIcon(task.stato), {
              className: `w-5 h-5 ${
                task.stato === 'completato' ? 'text-green-500' :
                task.stato === 'in_corso' ? 'text-blue-500' :
                'text-gray-400'
              }`
            })}
            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(task.stato)}`}>
              {getStatusText(task.stato)}
            </div>
          </motion.div>
        </div>

        {/* Title & Description */}
        <div className="mb-4">
          <h3 className="font-bold text-gray-900 mb-2 text-lg leading-tight line-clamp-2">
            {task.titolo}
          </h3>
          {task.descrizione && (
            <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
              {task.descrizione}
            </p>
          )}
        </div>

        {/* Priority & Time Info */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            {/* Priority Stars - More Compact */}
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <motion.div
                  key={star}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.8 }}
                >
                  <Star
                    className={`w-3 h-3 ${
                      star <= task.priorita
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                </motion.div>
              ))}
            </div>
            <span className="text-xs text-gray-500 font-medium">
              P{task.priorita}
            </span>
          </div>

          {/* Time Info */}
          <div className="flex items-center space-x-3 text-xs text-gray-500">
            {task.tempo_stimato && (
              <div className="flex items-center space-x-1 bg-white/80 px-2 py-1 rounded-full">
                <Clock className="w-3 h-3" />
                <span className="font-medium">{task.tempo_stimato}m</span>
              </div>
            )}
            
            {task.orario_suggerito && (
              <div className={`flex items-center space-x-1 px-2 py-1 rounded-full ${
                isNearSuggestedTime 
                  ? 'bg-orange-100 text-orange-700 font-bold' 
                  : 'bg-white/80'
              }`}>
                <Clock className="w-3 h-3" />
                <span>{task.orario_suggerito}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/50">
          <div className="flex items-center space-x-4">
            {/* Assigned User */}
            {task.assegnato_profile && (
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                  {task.assegnato_profile.nome?.[0]?.toUpperCase() || '?'}
                </div>
                <span className="text-xs text-gray-600 font-medium truncate max-w-20">
                  {task.assegnato_profile.nome}
                </span>
              </div>
            )}

            {/* Photo Indicator */}
            {task.photo_url && (
              <motion.div 
                className="flex items-center space-x-1 text-blue-600 bg-blue-50 px-2 py-1 rounded-full"
                whileHover={{ scale: 1.05 }}
              >
                <Camera className="w-3 h-3" />
                <span className="text-xs font-medium">Foto</span>
              </motion.div>
            )}

            {/* Due Date */}
            {dueDateInfo && (
              <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                isOverdue ? 'bg-red-100 text-red-700' :
                isDueToday ? 'bg-orange-100 text-orange-700' :
                'bg-gray-100 text-gray-600'
              }`}>
                <Calendar className="w-3 h-3" />
                <span>{dueDateInfo}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            <motion.button
              onClick={(e) => {
                e.stopPropagation()
                onOpenComments(task)
              }}
              className="flex items-center space-x-1 text-gray-400 hover:text-blue-600 focus-ring p-2 rounded-lg transition-smooth"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <MessageCircle className="w-4 h-4" />
              <span className="text-xs font-medium">0</span>
            </motion.button>

            <motion.div
              whileHover={{ x: 2 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </motion.div>
          </div>
        </div>

        {/* Swipe Indicators */}
        {isSwipeable && task.stato !== 'completato' && (
          <AnimatePresence>
            {(Math.abs(swipeOffset) < 20) && (
              <motion.div 
                className="absolute -bottom-8 left-0 right-0 flex justify-center"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="glass px-3 py-1 rounded-full">
                  <div className="flex items-center space-x-3 text-xs text-gray-500">
                    {canAssignTask() && (
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-blue-400 rounded-full" />
                        <span>Scorri → per assegnare</span>
                      </div>
                    )}
                    {canCompleteTask() && (
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full" />
                        <span>Scorri ← per completare</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </motion.div>
    </motion.div>
  )
}

export default TaskCard