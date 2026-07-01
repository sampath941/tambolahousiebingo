import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, ApiError } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { useActiveGame } from '../store/activeGameStore'
import { db } from '../db/local'

type Mode = 'login' | 'register'

export default function SignIn() {
  const navigate   = useNavigate()
  const signIn     = useAuthStore(s => s.signIn)
  const activeGame = useActiveGame()
  const [mode, setMode]         = useState<Mode>('login')
  const [phone, setPhone]       = useState('')
  const [pin, setPin]           = useState('')
  const [nickname, setNickname] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = mode === 'register'
        ? await api.register(phone, pin, nickname)
        : await api.login(phone, pin)

      // Cache player locally so it's available offline
      await db.players.put({
        id: res.player_id, phone, nickname: res.nickname, createdAt: new Date().toISOString(),
      })

      signIn(res.token, res.player_id, res.nickname, phone)
      // If a full game was waiting for sign-in, resume it
      navigate(activeGame.type === 'full' ? '/full-game' : '/')
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) setError('This phone number is already registered. Try signing in instead.')
        else if (err.status === 401) setError('Wrong phone number or PIN.')
        else if (err.status === 422) setError('Check your phone number (10 digits) and PIN (4–6 digits).')
        else setError(err.message)
      } else {
        setError('Could not reach the server. Check your connection.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-full flex flex-col items-center justify-center p-6 bg-primary-50">
      <div className="w-full max-w-sm">

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black text-primary-700">Thambola</h1>
          <p className="text-gray-500 text-sm mt-1">
            {mode === 'login' ? 'Sign in to track games & players' : 'Create your account'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Phone number</label>
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]{10}"
                maxLength={10}
                placeholder="10-digit mobile number"
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Your name</label>
                <input
                  type="text"
                  placeholder="Nickname"
                  maxLength={50}
                  value={nickname}
                  onChange={e => setNickname(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">PIN</label>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]{4,6}"
                minLength={4}
                maxLength={6}
                placeholder="4–6 digit PIN"
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary-400 tracking-widest"
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-primary-600 text-white font-bold text-base disabled:opacity-50"
            >
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {/* Toggle */}
          <div className="mt-5 text-center text-sm text-gray-500">
            {mode === 'login' ? (
              <>
                No account?{' '}
                <button
                  onClick={() => { setMode('register'); setError(null) }}
                  className="text-primary-600 font-semibold"
                >
                  Create one
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  onClick={() => { setMode('login'); setError(null) }}
                  className="text-primary-600 font-semibold"
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>

        <button
          onClick={() => navigate('/')}
          className="mt-6 w-full text-center text-sm text-gray-400"
        >
          ← Back
        </button>
      </div>
    </div>
  )
}
