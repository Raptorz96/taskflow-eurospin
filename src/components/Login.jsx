import { useState } from 'react'
import { signIn, signUp } from '../lib/supabase'
import { LogIn, UserPlus, Loader2 } from 'lucide-react'

const Login = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nome: '',
    ruolo: 'dipendente',
    reparto: ''
  })
  const [error, setError] = useState('')

  const reparti = [
    { value: 'ortofrutta', label: 'Ortofrutta', color: 'text-green-600' },
    { value: 'macelleria', label: 'Macelleria', color: 'text-red-600' },
    { value: 'gastronomia', label: 'Gastronomia', color: 'text-yellow-600' },
    { value: 'panetteria', label: 'Panetteria', color: 'text-orange-600' },
    { value: 'magazzino', label: 'Magazzino', color: 'text-gray-600' },
    { value: 'casse', label: 'Casse', color: 'text-blue-600' }
  ]

  const ruoli = [
    { value: 'dipendente', label: 'Dipendente' },
    { value: 'vice', label: 'Vice Responsabile' },
    { value: 'responsabile', label: 'Responsabile' },
    { value: 'admin', label: 'Admin' }
  ]

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isLogin) {
        const { data, error } = await signIn(formData.email, formData.password)
        if (error) throw error
        if (data.user) {
          onLogin(data.user)
        }
      } else {
        const { data, error } = await signUp(formData.email, formData.password, {
          nome: formData.nome,
          ruolo: formData.ruolo,
          reparto: formData.reparto
        })
        if (error) throw error
        if (data.user) {
          setError('Registrazione completata! Controlla la tua email per confermare l\'account.')
          setIsLogin(true)
        }
      }
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold">E</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">TaskFlow</h1>
          <p className="text-gray-600">Gestione task Eurospin</p>
        </div>

        {/* Form Card */}
        <div className="card">
          <div className="mb-6">
            <div className="flex rounded-lg bg-gray-100 p-1">
              <button
                type="button"
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  isLogin
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => {
                  setIsLogin(true)
                  setError('')
                }}
              >
                <LogIn className="w-4 h-4 inline mr-2" />
                Accedi
              </button>
              <button
                type="button"
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  !isLogin
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => {
                  setIsLogin(false)
                  setError('')
                }}
              >
                <UserPlus className="w-4 h-4 inline mr-2" />
                Registrati
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">
                  Nome completo
                </label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  required={!isLogin}
                  value={formData.nome}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-base text-gray-900 bg-white placeholder-gray-500"
                  placeholder="Mario Rossi"
                  autoComplete="name"
                  autoCapitalize="words"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-base text-gray-900 bg-white placeholder-gray-500"
                placeholder="mario.rossi@eurospin.it"
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                inputMode="email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-base text-gray-900 bg-white placeholder-gray-500"
                placeholder="••••••••"
                minLength={6}
                autoComplete="current-password"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
              />
            </div>

            {!isLogin && (
              <>
                <div>
                  <label htmlFor="ruolo" className="block text-sm font-medium text-gray-700 mb-1">
                    Ruolo
                  </label>
                  <select
                    id="ruolo"
                    name="ruolo"
                    value={formData.ruolo}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-base text-gray-900 bg-white placeholder-gray-500"
                  >
                    {ruoli.map((ruolo) => (
                      <option key={ruolo.value} value={ruolo.value}>
                        {ruolo.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="reparto" className="block text-sm font-medium text-gray-700 mb-1">
                    Reparto
                  </label>
                  <select
                    id="reparto"
                    name="reparto"
                    value={formData.reparto}
                    onChange={handleChange}
                    required={!isLogin}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-base text-gray-900 bg-white placeholder-gray-500"
                  >
                    <option value="">Seleziona reparto</option>
                    {reparti.map((reparto) => (
                      <option key={reparto.value} value={reparto.value}>
                        {reparto.label}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {error && (
              <div className={`p-3 rounded-md text-sm ${
                error.includes('completata') 
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary flex items-center justify-center"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : isLogin ? (
                <LogIn className="w-4 h-4 mr-2" />
              ) : (
                <UserPlus className="w-4 h-4 mr-2" />
              )}
              {loading ? 'Attendere...' : isLogin ? 'Accedi' : 'Registrati'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              TaskFlow Eurospin v1.0 - Sistema di gestione task
            </p>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}

export default Login