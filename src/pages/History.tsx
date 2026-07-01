import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db, type LocalGame } from '../db/local'
import { useAuthStore } from '../store/authStore'
import { useOnline } from '../hooks/useOnline'
import { api, type GameSyncPayload } from '../lib/api'

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso))
}

function toSyncPayload(g: LocalGame): GameSyncPayload {
  return {
    id:             g.id,
    mode:           g.mode,
    claims_config:  g.claimsConfig,
    started_at:     g.startedAt,
    ended_at:       g.endedAt,
    players:        g.players.map(p => ({ player_id: p.playerId, nickname: p.nickname })),
    called_numbers: g.calledNumbers.map(n => ({
      number: n.number, sequence_order: n.sequenceOrder, called_at: n.calledAt,
    })),
    claims: g.claims.map(c => ({
      claim_type: c.claimType, winner_player_id: c.winnerPlayerId, won_at: c.wonAt,
    })),
  }
}

export default function History() {
  const navigate     = useNavigate()
  const online       = useOnline()
  const { token }    = useAuthStore()
  const [games, setGames]     = useState<LocalGame[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  async function reload() {
    const local = await db.games.orderBy('savedAt').reverse().toArray()
    setGames(local)
  }

  useEffect(() => {
    async function load() {
      setLoading(true)
      await reload()
      setLoading(false)

      if (!online || !token) return

      setSyncing(true)
      try {
        // Push any unsynced local games to the server
        const allLocal  = await db.games.toArray()
        const unsynced  = allLocal.filter(g => !g.syncedAt)
        await Promise.allSettled(
          unsynced.map(async g => {
            await api.syncGame(token, toSyncPayload(g))
            await db.games.update(g.id, { syncedAt: new Date().toISOString() })
          })
        )
      } catch { /* keep going */ }
      setSyncing(false)
      await reload()
    }

    load()
  }, [online, token]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalGames   = games.length
  const totalPrize   = games.reduce((sum, g) =>
    sum + g.claims.reduce((s, c) => s + (g.claimsConfig?.find(cl => cl.type === c.claimType)?.prize ?? 0), 0), 0
  )
  const unsyncedCount = games.filter(g => !g.syncedAt).length

  return (
    <div className="min-h-full flex flex-col bg-primary-50">

      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
        <button onClick={() => navigate('/')} className="text-gray-500 text-xl p-1">←</button>
        <h2 className="flex-1 text-lg font-bold text-gray-800">Past Games</h2>
        {syncing && <span className="text-xs text-primary-500 animate-pulse">Syncing…</span>}
      </div>

      {/* Offline banner */}
      {!online && (
        <div className="mx-4 mb-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-xs text-amber-700">Offline — showing locally saved games</p>
        </div>
      )}

      {/* Pending sync banner */}
      {online && unsyncedCount > 0 && !syncing && (
        <div className="mx-4 mb-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-xs text-blue-700">{unsyncedCount} game{unsyncedCount > 1 ? 's' : ''} syncing to your account…</p>
        </div>
      )}

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-400 text-sm">Loading…</p>
        </div>
      ) : games.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-8 gap-2">
          <span className="text-5xl">🎮</span>
          <p className="text-gray-700 font-semibold text-lg">No games yet</p>
          <p className="text-gray-400 text-sm">Complete a game with players to see it here.</p>
          <button onClick={() => navigate('/game-setup')}
            className="mt-4 px-6 py-3 bg-primary-600 text-white rounded-2xl font-semibold text-sm"
          >Start a Game</button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pb-8">

          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-3 px-4 py-3">
            {[
              { label: 'Games',    value: totalGames },
              { label: 'Prizes',   value: `₹${totalPrize}` },
              { label: 'Unsynced', value: unsyncedCount },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl p-3 text-center shadow-sm">
                <p className="text-xl font-black text-gray-800">{s.value}</p>
                <p className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-wide">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Game cards */}
          <div className="px-4 space-y-4">
            {games.map(g => <GameCard key={g.id} game={g} />)}
          </div>
        </div>
      )}
    </div>
  )
}

function GameCard({ game }: { game: LocalGame }) {
  const [expanded, setExpanded] = useState(false)

  const totalPrize = game.claims.reduce((sum, c) =>
    sum + (game.claimsConfig?.find(cl => cl.type === c.claimType)?.prize ?? 0), 0
  )

  // Per-player payout summary
  const playerPayouts = game.players
    .map(p => {
      const wins = game.claims.filter(c => c.winnerNickname === p.nickname)
      const total = wins.reduce((s, c) =>
        s + (game.claimsConfig?.find(cl => cl.type === c.claimType)?.prize ?? 0), 0
      )
      return { nickname: p.nickname, wins, total }
    })
    .filter(p => p.total > 0)

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">

      {/* Card header — always visible */}
      <button
        className="w-full px-4 py-3 flex items-start gap-3 text-left"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-gray-400">{formatDate(game.endedAt ?? game.savedAt)}</p>
          <p className="text-sm font-semibold text-gray-800 mt-0.5">
            {game.players.length} player{game.players.length !== 1 ? 's' : ''}
            {' · '}
            {game.calledNumbers.length} numbers called
          </p>

          {/* Winner pills — compact preview */}
          {!expanded && game.claims.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {game.claims.slice(0, 3).map((c, i) => (
                <span key={i} className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                  {c.winnerNickname}
                </span>
              ))}
              {game.claims.length > 3 && (
                <span className="text-[10px] text-gray-400">+{game.claims.length - 3} more</span>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className="text-base font-black text-primary-700">₹{totalPrize}</span>
          {game.syncedAt
            ? <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">✓ synced</span>
            : <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">pending</span>
          }
          <span className="text-gray-300 text-xs">{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-gray-50 px-4 pb-4 pt-3 space-y-4">

          {/* Claims detail */}
          {game.claimsConfig && game.claimsConfig.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Claims</p>
              <div className="space-y-1.5">
                {game.claimsConfig.map(cl => {
                  const won = game.claims.find(c => c.claimType === cl.type)
                  return (
                    <div key={cl.type} className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-24 flex-shrink-0">{cl.label}</span>
                      {won
                        ? <span className="flex-1 text-xs font-semibold text-gray-800">🏆 {won.winnerNickname}</span>
                        : <span className="flex-1 text-xs text-gray-300">Not awarded</span>
                      }
                      <span className={`text-xs font-bold ${won ? 'text-primary-600' : 'text-gray-200'}`}>₹{cl.prize}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Per-player payouts */}
          {playerPayouts.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Payouts</p>
              <div className="space-y-1">
                {playerPayouts.map(p => (
                  <div key={p.nickname} className="flex items-center gap-2">
                    <span className="flex-1 text-xs font-semibold text-gray-800">{p.nickname}</span>
                    <span className="text-xs text-gray-400">
                      {p.wins.map(w => game.claimsConfig?.find(c => c.type === w.claimType)?.label ?? w.claimType).join(', ')}
                    </span>
                    <span className="text-sm font-black text-gray-800">₹{p.total}</span>
                  </div>
                ))}
                <div className="border-t border-gray-100 pt-1.5 flex justify-between">
                  <span className="text-xs text-gray-500 font-medium">Total</span>
                  <span className="text-sm font-black text-gray-900">₹{totalPrize}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
