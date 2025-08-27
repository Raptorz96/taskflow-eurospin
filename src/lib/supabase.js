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