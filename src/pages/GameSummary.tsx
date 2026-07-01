import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useActiveGame } from '../store/activeGameStore'
import { useAuthStore } from '../store/authStore'
import { useOnline } from '../hooks/useOnline'
import { db } from '../db/local'
import { api } from '../lib/api'

export default function GameSummary() {
  const navigate   = useNavigate()
  const online     = useOnline()
  const { token }  = useAuthStore()
  const game       = useActiveGame()
  const [synced, setSynced] = useState<boolean | null>(null)

  const { gameId, players, claimsConfig, calledArray, markedClaims, startedAt } = game

  const payouts = players.map(p => {
    const wins  = markedClaims.filter(m => m.winnerLocalId === p.localId)
    const total = wins.reduce((s, m) => s + (claimsConfig.find(c => c.type === m.claimType)?.prize ?? 0), 0)
    return { ...p, wins, total }
  }).filter(p => p.total > 0)

  const grandTotal = payouts.reduce((s, p) => s + p.total, 0)

  useEffect(() => {
    if (!gameId) return

    async function saveAndSync() {
      const now = new Date().toISOString()

      await db.games.put({
        id:            gameId,
        hostId:        useAuthStore.getState().playerId ?? 'guest',
        mode:          'full',
        claimsConfig,
        startedAt,
        endedAt:       now,
        savedAt:       now,
        syncedAt:      null,
        players:       players.map(p => ({ playerId: p.playerId, nickname: p.nickname })),
        calledNumbers: calledArray.map((n, i) => ({ number: n, sequenceOrder: i + 1, calledAt: null })),
        claims:        markedClaims.map(m => ({
          claimType:      m.claimType,
          winnerPlayerId: players.find(p => p.localId === m.winnerLocalId)?.playerId ?? null,
          wonAt:          m.wonAt,
          winnerNickname: m.winnerNickname,
        })),
      })

      if (online && token) {
        try {
          await api.syncGame(token, {
            id:             gameId,
            mode:           'full',
            claims_config:  claimsConfig,
            started_at:     startedAt,
            ended_at:       now,
            players:        players.map(p => ({ player_id: p.playerId, nickname: p.nickname })),
            called_numbers: calledArray.map((n, i) => ({ number: n, sequence_order: i + 1, called_at: null })),
            claims:         markedClaims.map(m => ({
              claim_type:       m.claimType,
              winner_player_id: players.find(p => p.localId === m.winnerLocalId)?.playerId ?? null,
              won_at:           m.wonAt,
            })),
          })
          await db.games.update(gameId, { syncedAt: now })
          setSynced(true)
        } catch { setSynced(false) }
      } else {
        setSynced(false)
      }
    }

    saveAndSync()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleDone() {
    game.clearGame()
    navigate('/')
  }

  return (
    <div className="min-h-full flex flex-col bg-primary-50">
      <div className="px-4 pt-5 pb-2 text-center">
        <h1 className="text-2xl font-black text-gray-900">Game Over!</h1>
        <p className="text-sm text-gray-500 mt-1">
          {calledArray.length} numbers called · {markedClaims.length}/{claimsConfig.length} claims awarded
        </p>
        {synced === true  && <p className="text-xs text-emerald-500 mt-1">✓ Saved to your account</p>}
        {synced === false && <p className="text-xs text-gray-400 mt-1">Saved locally · will sync when online</p>}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-4 mt-4">
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h3 className="text-sm font-bold text-gray-700 mb-3">Claims & Winners</h3>
          <div className="space-y-2">
            {claimsConfig.map(cl => {
              const marked = markedClaims.find(m => m.claimType === cl.type)
              return (
                <div key={cl.type} className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800">{cl.label}</p>
                    {marked
                      ? <p className="text-xs text-emerald-600">🏆 {marked.winnerNickname}</p>
                      : <p className="text-xs text-gray-400">Not awarded</p>}
                  </div>
                  <span className={`text-sm font-bold ${marked ? 'text-gray-800' : 'text-gray-300'}`}>₹{cl.prize}</span>
                </div>
              )
            })}
          </div>
        </div>

        {payouts.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <h3 className="text-sm font-bold text-gray-700 mb-3">Payouts</h3>
            <div className="space-y-2">
              {payouts.map(p => (
                <div key={p.localId} className="flex items-center gap-2">
                  <span className="flex-1 text-sm font-semibold text-gray-800">{p.nickname}</span>
                  <span className="text-xs text-gray-400">
                    {p.wins.map(w => claimsConfig.find(c => c.type === w.claimType)?.label).join(', ')}
                  </span>
                  <span className="text-base font-black text-primary-700">₹{p.total}</span>
                </div>
              ))}
              <div className="border-t border-gray-100 pt-2 flex justify-between">
                <span className="text-sm font-bold text-gray-700">Total</span>
                <span className="text-base font-black text-gray-900">₹{grandTotal}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 py-4">
        <button onClick={handleDone} className="w-full py-4 rounded-2xl bg-primary-600 text-white text-lg font-bold shadow-md">
          Done
        </button>
      </div>
    </div>
  )
}
