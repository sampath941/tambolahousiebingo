import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { DEFAULT_CLAIMS, type ClaimConfig, type GamePlayer } from '../store/gameStore'
import { useAuthStore } from '../store/authStore'
import { useActiveGame } from '../store/activeGameStore'
import { db, type LocalContact } from '../db/local'

export default function GameSetup() {
  const navigate = useNavigate()
  const { nickname: hostNickname, playerId: hostPlayerId } = useAuthStore()
  const game = useActiveGame()

  const hostPlayer: GamePlayer = {
    localId:  'host',
    playerId: hostPlayerId,
    nickname: (hostNickname ?? 'Host').toUpperCase(),
  }

  // ── Players state ──────────────────────────────────────────────────────────
  const [contacts, setContacts] = useState<LocalContact[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [newName,  setNewName]  = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  // ── Claims state ───────────────────────────────────────────────────────────
  const [claims,       setClaims]       = useState<ClaimConfig[]>(DEFAULT_CLAIMS)
  const [saveStatus,   setSaveStatus]   = useState<'idle' | 'saving' | 'saved'>('idle')

  // Load contacts + saved claims preset on mount
  useEffect(() => {
    if (!hostPlayerId) return
    db.contacts.where('hostId').equals(hostPlayerId).sortBy('createdAt').then(setContacts)
    db.claimsPresets.get(hostPlayerId).then(preset => {
      if (preset) setClaims(preset.claims)
    })
  }, [hostPlayerId])

  // ── Player helpers ─────────────────────────────────────────────────────────
  async function addNewPlayer() {
    const name = newName.trim().toUpperCase()
    if (!name || !hostPlayerId) return
    const contact: LocalContact = {
      id: crypto.randomUUID(), hostId: hostPlayerId,
      nickname: name, createdAt: new Date().toISOString(),
    }
    await db.contacts.put(contact)
    setContacts(prev => [...prev, contact])
    setSelected(prev => new Set([...prev, contact.id]))
    setNewName('')
  }

  async function deleteContact(id: string) {
    await db.contacts.delete(id)
    setContacts(prev => prev.filter(c => c.id !== id))
    setSelected(prev => { prev.delete(id); return new Set(prev) })
    setDeleting(null)
  }

  function toggleContact(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // ── Claims helpers ─────────────────────────────────────────────────────────
  function updateLabel(type: string, label: string) {
    setClaims(c => c.map(cl => cl.type === type ? { ...cl, label } : cl))
  }

  function updatePrize(type: string, value: string) {
    setClaims(c => c.map(cl => cl.type === type ? { ...cl, prize: Number(value) || 0 } : cl))
  }

  function removeClaim(type: string) {
    setClaims(c => c.filter(cl => cl.type !== type))
  }

  function addClaim() {
    setClaims(c => [...c, { type: crypto.randomUUID(), label: '', prize: 0 }])
  }

  async function handleSaveDefault() {
    if (!hostPlayerId) return
    setSaveStatus('saving')
    await db.claimsPresets.put({ hostId: hostPlayerId, claims, savedAt: new Date().toISOString() })
    setSaveStatus('saved')
    setTimeout(() => setSaveStatus('idle'), 2000)
  }

  function resetToDefault() {
    setClaims(DEFAULT_CLAIMS)
  }

  // ── Start game ─────────────────────────────────────────────────────────────
  function startGame() {
    const validClaims = claims.filter(c => c.label.trim())
    const gamePlayers: GamePlayer[] = [
      hostPlayer,
      ...contacts.filter(c => selected.has(c.id)).map(c => ({
        localId: crypto.randomUUID(), playerId: null, nickname: c.nickname,
      })),
    ]
    game.startFull(crypto.randomUUID(), gamePlayers, validClaims)
    navigate('/full-game')
  }

  const playerCount = 1 + selected.size
  const validClaims = claims.filter(c => c.label.trim())

  return (
    <div className="min-h-full flex flex-col bg-primary-50">

      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
        <button onClick={() => navigate('/')} className="text-gray-500 text-xl p-1">←</button>
        <h2 className="flex-1 text-lg font-bold text-gray-800">New Game</h2>
        <span className="text-sm text-gray-500">{playerCount} player{playerCount !== 1 ? 's' : ''}</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-5">

        {/* ── Players ── */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h3 className="text-sm font-bold text-gray-700 mb-1">Players</h3>
          <p className="text-xs text-gray-400 mb-3">Tap to add to game · × to remove from list</p>

          {/* Host */}
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-[9px] font-bold">✓</span>
            </div>
            <span className="flex-1 text-sm text-gray-800 bg-gray-50 rounded-xl px-3 py-2">
              {hostPlayer.nickname}
              <span className="ml-2 text-[10px] text-primary-500 font-semibold">YOU</span>
            </span>
          </div>

          {/* Saved contacts */}
          <div className="space-y-2">
            {contacts.map(c => {
              const inGame = selected.has(c.id)
              return (
                <div key={c.id} className="flex items-center gap-2">
                  <button
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors
                      ${inGame ? 'bg-primary-600 border-primary-600' : 'border-gray-300 bg-white'}`}
                    onClick={() => toggleContact(c.id)}
                  >
                    {inGame && <span className="text-white text-[9px] font-bold">✓</span>}
                  </button>
                  <button
                    className={`flex-1 text-sm text-left rounded-xl px-3 py-2 transition-colors
                      ${inGame ? 'bg-primary-50 text-primary-800 font-medium' : 'bg-gray-50 text-gray-600'}`}
                    onClick={() => toggleContact(c.id)}
                  >
                    {c.nickname}
                  </button>
                  <button
                    className="text-gray-300 hover:text-red-400 text-lg px-1 transition-colors"
                    onClick={() => setDeleting(c.id)}
                  >×</button>
                </div>
              )
            })}
          </div>

          {contacts.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-2">No saved players yet</p>
          )}

          {/* Add new player */}
          <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
            <input
              type="text"
              placeholder="Add new player name"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addNewPlayer()}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
            <button
              onClick={addNewPlayer}
              disabled={!newName.trim()}
              className="px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-xl disabled:opacity-40"
            >Save &amp; Add</button>
          </div>
        </div>

        {/* ── Claims & Prizes ── */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex items-center mb-3">
            <h3 className="text-sm font-bold text-gray-700 flex-1">Claims &amp; Prizes (₹)</h3>
            <div className="flex gap-2">
              <button
                onClick={resetToDefault}
                className="text-xs text-gray-400 font-medium"
              >Reset</button>
              <button
                onClick={handleSaveDefault}
                disabled={saveStatus === 'saving'}
                className={`text-xs font-semibold px-2 py-1 rounded-lg transition-colors
                  ${saveStatus === 'saved'
                    ? 'text-emerald-600 bg-emerald-50'
                    : 'text-primary-600 bg-primary-50'}`}
              >
                {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? '✓ Saved' : 'Save as Default'}
              </button>
            </div>
          </div>

          {/* Column labels */}
          <div className="flex gap-2 mb-1.5 px-0.5">
            <span className="flex-1 text-[10px] text-gray-400 font-medium uppercase tracking-wide">Claim name</span>
            <span className="w-[72px] text-[10px] text-gray-400 font-medium uppercase tracking-wide text-right">Prize</span>
            <span className="w-6" />
          </div>

          <div className="space-y-2">
            {claims.map(cl => (
              <div key={cl.type} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={cl.label}
                  onChange={e => updateLabel(cl.type, e.target.value)}
                  placeholder="Claim name"
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                />
                <div className="flex items-center gap-0.5 w-[72px] border border-gray-200 rounded-xl px-2 py-2">
                  <span className="text-gray-400 text-xs">₹</span>
                  <input
                    type="number"
                    value={cl.prize || ''}
                    onChange={e => updatePrize(cl.type, e.target.value)}
                    placeholder="0"
                    className="flex-1 text-sm text-right focus:outline-none min-w-0"
                  />
                </div>
                <button
                  onClick={() => removeClaim(cl.type)}
                  className="w-6 text-gray-300 hover:text-red-400 text-lg text-center transition-colors"
                >×</button>
              </div>
            ))}
          </div>

          <button
            onClick={addClaim}
            className="mt-3 w-full py-2 text-sm text-primary-600 font-semibold border border-dashed border-primary-300 rounded-xl hover:bg-primary-50 transition-colors"
          >
            + Add Claim
          </button>
        </div>
      </div>

      {/* Start button */}
      <div className="px-4 py-4 bg-primary-50 border-t border-gray-100">
        <button
          onClick={startGame}
          disabled={validClaims.length === 0}
          className="w-full py-4 rounded-2xl bg-primary-600 text-white text-lg font-bold shadow-md disabled:opacity-40"
        >
          Start Game with {playerCount} Player{playerCount !== 1 ? 's' : ''} →
        </button>
      </div>

      {/* Delete contact confirm */}
      {deleting && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50"
          onClick={() => setDeleting(null)}
        >
          <div className="bg-white rounded-t-3xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <p className="text-base font-bold text-gray-800 mb-1">Remove from your list?</p>
            <p className="text-sm text-gray-500 mb-5">
              "{contacts.find(c => c.id === deleting)?.nickname}" will be removed from saved players.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleting(null)}
                className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold"
              >Keep</button>
              <button onClick={() => deleteContact(deleting)}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-semibold"
              >Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
