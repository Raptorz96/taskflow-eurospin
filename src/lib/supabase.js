import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper functions
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export const signUp = async (email, password, userData) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: userData
    }
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getUserProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return { data, error }
}

export const updateUserProfile = async (userId, updates) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
  return { data, error }
}

// Task functions
export const getTasks = async (filters = {}) => {
  let query = supabase
    .from('tasks')
    .select(`
      *,
      assegnato_profile:profiles!tasks_assegnato_a_fkey(nome),
      creato_profile:profiles!tasks_creato_da_fkey(nome)
    `)
    .order('created_at', { ascending: false })

  if (filters.reparto) {
    query = query.eq('reparto', filters.reparto)
  }
  
  if (filters.stato) {
    query = query.eq('stato', filters.stato)
  }
  
  if (filters.data_scadenza) {
    query = query.gte('data_scadenza', filters.data_scadenza)
  }

  const { data, error } = await query
  return { data, error }
}

export const createTask = async (taskData) => {
  const { data, error } = await supabase
    .from('tasks')
    .insert([taskData])
    .select()
  return { data, error }
}

export const updateTask = async (taskId, updates) => {
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId)
    .select()
  return { data, error }
}

export const deleteTask = async (taskId) => {
  const { data, error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)
  return { data, error }
}

// Comments functions
export const getTaskComments = async (taskId) => {
  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      user:profiles(nome)
    `)
    .eq('task_id', taskId)
    .order('created_at', { ascending: true })
  return { data, error }
}

export const addTaskComment = async (taskId, userId, text) => {
  const { data, error } = await supabase
    .from('comments')
    .insert([{
      task_id: taskId,
      user_id: userId,
      testo: text
    }])
    .select()
  return { data, error }
}

// Recurring tasks functions
export const getRecurringTasks = async () => {
  const { data, error } = await supabase
    .from('recurring_tasks')
    .select('*')
    .order('titolo_template')
  return { data, error }
}

export const createRecurringTask = async (recurringTaskData) => {
  const { data, error } = await supabase
    .from('recurring_tasks')
    .insert([recurringTaskData])
    .select()
  return { data, error }
}

export const updateRecurringTask = async (id, updates) => {
  const { data, error } = await supabase
    .from('recurring_tasks')
    .update(updates)
    .eq('id', id)
    .select()
  return { data, error }
}

// Product alerts functions
export const getProductAlerts = async () => {
  const { data, error } = await supabase
    .from('product_alerts')
    .select('*')
    .order('data_scadenza')
  return { data, error }
}

export const createProductAlert = async (alertData) => {
  const { data, error } = await supabase
    .from('product_alerts')
    .insert([alertData])
    .select()
  return { data, error }
}

// Order functions
export const getOrdiniConfig = async () => {
  const { data, error } = await supabase
    .from('ordini_config')
    .select('*')
    .eq('attivo', true)
    .order('tipo_ordine')
  return { data, error }
}

export const getOrdiniOggi = async (oggi = new Date()) => {
  const today = oggi.toISOString().split('T')[0]
  const currentDay = oggi.getDay()
  const currentTime = oggi.toTimeString().split(' ')[0]
  
  // Get orders for today based on configuration
  const { data: config, error: configError } = await supabase
    .from('ordini_config')
    .select('*')
    .eq('attivo', true)
  
  if (configError) return { data: null, error: configError }
  
  const ordersForToday = []
  
  // Check each order type
  for (const orderConfig of config) {
    let shouldOrderToday = false
    
    if (orderConfig.tipo_ordine === 'sala') {
      // Sala orders on specific days
      shouldOrderToday = orderConfig.giorno_ordine === currentDay
    } else if (orderConfig.tipo_ordine === 'surgelati') {
      // Surgelati every day except Saturday (6)
      shouldOrderToday = currentDay !== 6
    } else if (orderConfig.tipo_ordine === 'pesce') {
      // Pesce on Monday, Wednesday, Friday
      shouldOrderToday = orderConfig.giorno_ordine === currentDay
    }
    
    if (shouldOrderToday) {
      // Check if order already exists for today
      const { data: existingOrder } = await supabase
        .from('ordini_log')
        .select('*')
        .eq('tipo_ordine', orderConfig.tipo_ordine)
        .eq('data_ordine', today)
        .single()
      
      if (!existingOrder) {
        // Create new order for today
        const { data: newOrder, error: insertError } = await supabase
          .from('ordini_log')
          .insert([{
            tipo_ordine: orderConfig.tipo_ordine,
            data_ordine: today,
            stato: 'da_fare'
          }])
          .select()
          .single()
        
        if (!insertError && newOrder) {
          ordersForToday.push({
            ...newOrder,
            config: orderConfig
          })
        }
      } else {
        ordersForToday.push({
          ...existingOrder,
          config: orderConfig
        })
      }
    }
  }
  
  return { data: ordersForToday, error: null }
}

export const completeOrdine = async (ordineId, userId, note = null) => {
  const { data, error } = await supabase
    .from('ordini_log')
    .update({
      stato: 'completato',
      ora_completamento: new Date().toISOString(),
      completato_da: userId,
      note: note
    })
    .eq('id', ordineId)
    .select()
  return { data, error }
}

export const startOrdine = async (ordineId, userId) => {
  const { data, error } = await supabase
    .from('ordini_log')
    .update({
      stato: 'in_corso',
      ora_inizio: new Date().toISOString()
    })
    .eq('id', ordineId)
    .select()
  return { data, error }
}

export const updateRipassoOrdine = async (ordineId, ripassoFatto) => {
  const { data, error } = await supabase
    .from('ordini_log')
    .update({
      ripasso_fatto: ripassoFatto
    })
    .eq('id', ordineId)
    .select()
  return { data, error }
}

export const getOrdiniLog = async (limit = 50) => {
  const { data, error } = await supabase
    .from('ordini_log')
    .select(`
      *,
      completato_profile:profiles!ordini_log_completato_da_fkey(nome)
    `)
    .order('data_ordine', { ascending: false })
    .limit(limit)
  return { data, error }
}

// Real-time subscriptions
export const subscribeToTasks = (callback) => {
  return supabase
    .channel('tasks')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, callback)
    .subscribe()
}

export const subscribeToComments = (taskId, callback) => {
  return supabase
    .channel(`comments:${taskId}`)
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'comments', filter: `task_id=eq.${taskId}` }, 
      callback
    )
    .subscribe()
}