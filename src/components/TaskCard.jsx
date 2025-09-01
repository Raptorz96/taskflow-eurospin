import { useState, useRef } from 'react'
import { Clock, User, Star, MessageCircle, Calendar, ChevronRight, CheckCircle, UserCheck } from 'lucide-react'
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

  return (
    <div className="relative">
      {/* Swipe Actions Background */}
      <div className="absolute inset-0 flex items-center justify-between px-4 rounded-xl overflow-hidden">
        {/* Right swipe action - Assign */}
        {canAssignTask() && (
          <div className={`flex items-center space-x-2 text-blue-600 transition-opacity ${
            swipeOffset > 30 ? 'opacity-100' : 'opacity-50'
          }`}>
            <UserCheck className="w-5 h-5" />
            <span className="font-medium">Assegna</span>
          </div>
        )}
        
        {/* Left swipe action - Complete */}
        {canCompleteTask() && (
          <div className={`flex items-center space-x-2 text-green-600 ml-auto transition-opacity ${
            swipeOffset < -30 ? 'opacity-100' : 'opacity-50'
          }`}>
            <span className="font-medium">Completa</span>
            <CheckCircle className="w-5 h-5" />
          </div>
        )}
      </div>

      {/* Task Card */}
      <div
        ref={cardRef}
        className={`card ${departmentInfo.color} transform transition-transform cursor-pointer select-none ${
          isDragging ? 'transition-none' : 'transition-transform duration-200'
        } ${
          isNearSuggestedTime ? 'ring-2 ring-orange-400 ring-offset-2 bg-orange-50' : ''
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
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{departmentInfo.icon}</span>
            <div>
              <span className="text-xs font-medium text-gray-600">
                {departmentInfo.name}
              </span>
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <span>{timeSlotInfo.icon}</span>
                <span>{timeSlotInfo.name}</span>
                <span>•</span>
                <span>{timeSlotInfo.time}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.stato)}`}>
              {getStatusText(task.stato)}
            </div>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
          {task.titolo}
        </h3>

        {/* Description */}
        {task.descrizione && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {task.descrizione}
          </p>
        )}

        {/* Priority Stars */}
        <div className="flex items-center mb-3">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-4 h-4 ${
                star <= task.priorita
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300'
              }`}
            />
          ))}
          <span className="ml-2 text-xs text-gray-500">
            Priorità {task.priorita}/5
          </span>
        </div>

        {/* Info Row */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            {/* Estimated Time */}
            {task.tempo_stimato && (
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{task.tempo_stimato}min</span>
              </div>
            )}

            {/* Assigned User */}
            {task.assegnato_profile && (
              <div className="flex items-center space-x-1">
                <User className="w-4 h-4" />
                <span className="truncate max-w-20">
                  {task.assegnato_profile.nome}
                </span>
              </div>
            )}

            {/* Suggested Time */}
            {task.orario_suggerito && (
              <div className={`flex items-center space-x-1 ${
                isNearSuggestedTime ? 'text-orange-600 font-medium' : ''
              }`}>
                <Clock className="w-4 h-4" />
                <span>{task.orario_suggerito}</span>
                {isNearSuggestedTime && <span className="text-xs">⏰</span>}
              </div>
            )}

            {/* Due Date */}
            {dueDateInfo && (
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span className={dueDateInfo.includes('fa') ? 'text-red-500' : ''}>
                  {dueDateInfo}
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {/* Comments */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onOpenComments(task)
              }}
              className="flex items-center space-x-1 text-gray-400 hover:text-blue-600 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="text-xs">0</span>
            </button>

            {/* More Actions */}
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </div>
        </div>

        {/* Swipe hint */}
        {isSwipeable && task.stato !== 'completato' && (
          <div className="absolute -bottom-6 left-0 right-0 text-center">
            <div className="inline-flex items-center space-x-2 text-xs text-gray-400 bg-white px-2 py-1 rounded-full shadow-sm">
              {canAssignTask() && <span>👉 Assegna</span>}
              {canAssignTask() && canCompleteTask() && <span>•</span>}
              {canCompleteTask() && <span>👈 Completa</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TaskCard