import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { LANGUAGES } from '../lib/languages'
import { speakNumber, cancelSpeech } from '../lib/tts'
import { preloadAudio, playAudio } from '../lib/audioPlayer'
import { useActiveGame } from '../store/activeGameStore'

const TIMER_OPTIONS = [3, 5, 10]
const ALL_NUMS      = Array.from({ length: 90 }, (_, i) => i + 1)

export default function FullGame() {
  const navigate = useNavigate()
  const game     = useActiveGame()
  const lang     = LANGUAGES.find(l => l.code === game.langCode) ?? LANGUAGES[0]

  const [running,        setRunning]        = useState(false)
  const [activeTab,      setActiveTab]      = useState<'numbers' | 'winners'>('numbers')
  const [pickingClaim,   setPickingClaim]   = useState<string | null>(null)
  const [showEndConfirm, setShowEndConfirm] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (lang.hasAudio) preloadAudio(lang.code)
  }, [lang])

  const callNext = useCallback(() => {
    const n = game.popNext()
    if (n === null) return
    if (lang.hasAudio) playAudio(n)
    else speakNumber(n, lang)
  }, [lang, game])

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (game.isAuto && running) {
      intervalRef.current = setInterval(callNext, game.timerSecs * 1000)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [game.isAuto, running, game.timerSecs, callNext])

  const called         = new Set(game.calledArray)
  const unmarkedClaims = game.claimsConfig.filter(c => !game.markedClaims.find(m => m.claimType === c.type))
  const allClaimsDone  = unmarkedClaims.length === 0
  const done           = game.remaining.length === 0

  function handleEndGame() {
    cancelSpeech()
    if (intervalRef.current) clearInterval(intervalRef.current)
    navigate('/game-summary')
  }

  return (
    <div className="h-[100dvh] flex flex-col landscape:flex-row overflow-hidden bg-primary-50">

      {/* ── Controls panel ── */}
      <div className="flex-shrink-0 flex flex-col landscape:w-[260px] landscape:h-full landscape:border-r landscape:border-gray-200">

        {/* Header */}
        <div className="flex items-center gap-2 px-3 pt-2 pb-1">
          <button onClick={() => { cancelSpeech(); navigate('/') }} className="text-gray-500 text-xl p-1">←</button>
          <h2 className="flex-1 text-sm font-bold text-gray-800">Full Game</h2>
          <button onClick={() => setShowEndConfirm(true)}
            className="text-xs font-semibold px-2 py-1 rounded-lg bg-emerald-500 text-white"
          >End Game</button>
        </div>

        {/* Language selector */}
        <div className="px-2 pb-1">
          <div className="flex gap-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {LANGUAGES.map(l => (
              <button key={l.code} onClick={() => game.setLangCode(l.code)}
                className={`flex-shrink-0 px-2 py-1 rounded-lg text-[11px] font-semibold
                  ${lang.code === l.code ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
              >{l.short}</button>
            ))}
          </div>
        </div>

        {/* Current number */}
        <div
          className={`flex-1 flex gap-3 px-3 py-2
            portrait:flex-row portrait:items-center
            landscape:flex-col landscape:items-center landscape:justify-center
            ${!game.isAuto && !done ? 'cursor-pointer active:opacity-80' : ''}`}
          onClick={!game.isAuto && !done ? callNext : undefined}
        >
          <div
            className={`flex-shrink-0 flex items-center justify-center rounded-full shadow-lg text-white font-black select-none
              landscape:w-36 landscape:h-36 landscape:text-6xl
              ${done ? 'bg-gray-300' : 'bg-primary-600'}`}
            style={{ width: 'clamp(90px, 22dvh, 180px)', height: 'clamp(90px, 22dvh, 180px)', fontSize: 'clamp(2rem, 9dvh, 4.5rem)' }}
          >{game.current ?? '?'}</div>

          <div className="portrait:flex-1 landscape:text-center">
            <div className="flex items-baseline gap-1.5 landscape:justify-center">
              <span className="text-lg font-black text-gray-800">{game.calledArray.length}</span>
              <span className="text-xs text-gray-500">called</span>
              <span className="text-gray-300">·</span>
              <span className="text-lg font-black text-gray-400">{game.remaining.length}</span>
              <span className="text-xs text-gray-400">left</span>
            </div>
            {!game.isAuto && !done && <p className="text-[10px] text-primary-400 mt-0.5">Tap to call</p>}
            {allClaimsDone && <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">All claims won!</p>}
          </div>
        </div>

        {/* Mode toggle + timer */}
        <div className="px-2 pb-2">
          <div className="bg-white rounded-2xl p-2 shadow-sm space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium w-10">Mode</span>
              <div className="flex flex-1 rounded-xl overflow-hidden border border-gray-200">
                <button onClick={() => { game.setIsAuto(false); setRunning(false) }}
                  className={`flex-1 py-1.5 text-xs font-semibold ${!game.isAuto ? 'bg-primary-600 text-white' : 'bg-white text-gray-500'}`}
                >Manual</button>
                <button onClick={() => game.setIsAuto(true)}
                  className={`flex-1 py-1.5 text-xs font-semibold ${game.isAuto ? 'bg-primary-600 text-white' : 'bg-white text-gray-500'}`}
                >Auto</button>
              </div>
            </div>
            {game.isAuto && (
              <div className="space-y-1.5">
                <div className="flex gap-1.5">
                  {TIMER_OPTIONS.map(s => (
                    <button key={s} onClick={() => { game.setTimerSecs(s); setRunning(false) }}
                      className={`flex-1 py-1 rounded-lg text-xs font-semibold
                        ${game.timerSecs === s ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-400' : 'bg-gray-100 text-gray-600'}`}
                    >{s}s</button>
                  ))}
                </div>
                <button onClick={() => setRunning(r => !r)} disabled={done}
                  className={`w-full py-1.5 rounded-xl text-xs font-bold disabled:opacity-40
                    ${running ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'}`}
                >{running ? '⏸ Pause' : '▶ Start Auto-call'}</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Right panel: Numbers / Winners tabs ── */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex border-b border-gray-200 bg-white flex-shrink-0">
          {(['numbers', 'winners'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-sm font-semibold capitalize transition-colors
                ${activeTab === tab ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500'}`}
            >
              {tab === 'winners' ? `Winners (${game.markedClaims.length}/${game.claimsConfig.length})` : 'Numbers'}
            </button>
          ))}
        </div>

        {/* Numbers tab */}
        {activeTab === 'numbers' && (
          <div className="flex-1 min-h-0 bg-gray-900" style={{ containerType: 'size' }}>
            <div className="h-full w-full grid grid-cols-10"
              style={{ gridTemplateRows: 'repeat(9, minmax(0, 1fr))' }}
            >
              {ALL_NUMS.map(n => (
                <div key={n} className="flex items-center justify-center">
                  <div className={`rounded-full flex items-center justify-center font-bold transition-all select-none
                    ${n === game.current ? 'bg-rose-400 text-white ring-2 ring-white shadow-[0_0_10px_rgba(251,113,133,0.8)]'
                      : called.has(n) ? 'bg-rose-600 text-white' : 'bg-emerald-500 text-white'}`}
                    style={{ width: 'min(9cqw, 10cqh)', height: 'min(9cqw, 10cqh)', fontSize: 'min(3.5cqw, 4cqh)' }}
                  >{n}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Winners tab */}
        {activeTab === 'winners' && (
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {game.claimsConfig.map(cl => {
              const marked = game.markedClaims.find(m => m.claimType === cl.type)
              return (
                <div key={cl.type}
                  className={`rounded-2xl p-4 flex items-center gap-3 shadow-sm
                    ${marked ? 'bg-emerald-50 border border-emerald-200' : 'bg-white border border-gray-100'}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold ${marked ? 'text-emerald-700' : 'text-gray-800'}`}>{cl.label}</p>
                    {marked
                      ? <p className="text-xs text-emerald-600 mt-0.5">🏆 {marked.winnerNickname} · ₹{cl.prize}</p>
                      : <p className="text-xs text-gray-400 mt-0.5">₹{cl.prize}</p>
                    }
                  </div>
                  {!marked && (
                    <button onClick={() => setPickingClaim(cl.type)}
                      className="flex-shrink-0 px-3 py-1.5 bg-primary-600 text-white text-xs font-semibold rounded-xl"
                    >Mark Winner</button>
                  )}
                  {marked && <span className="text-emerald-500 text-lg">✓</span>}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Player picker bottom sheet */}
      {pickingClaim && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50"
          onClick={() => setPickingClaim(null)}
        >
          <div className="bg-white rounded-t-3xl w-full max-w-sm p-5" onClick={e => e.stopPropagation()}>
            <p className="text-sm font-bold text-gray-700 mb-3">
              Who won {game.claimsConfig.find(c => c.type === pickingClaim)?.label}?
            </p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {game.players.map(p => (
                <button key={p.localId}
                  onClick={() => { game.addMark(pickingClaim, p.localId, p.nickname); setPickingClaim(null) }}
                  className="w-full py-3 px-4 rounded-xl bg-gray-50 text-left text-sm font-semibold text-gray-800 active:bg-primary-50"
                >{p.nickname}</button>
              ))}
            </div>
            <button onClick={() => setPickingClaim(null)} className="mt-3 w-full py-2 text-sm text-gray-400">Cancel</button>
          </div>
        </div>
      )}

      {/* End game confirm */}
      {showEndConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-3xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold mb-2">End game?</h3>
            <p className="text-sm text-gray-500 mb-5">
              {unmarkedClaims.length > 0
                ? `${unmarkedClaims.length} claim(s) still unawarded.`
                : 'All claims awarded — ready to see results?'}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowEndConfirm(false)} className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold">Continue</button>
              <button onClick={handleEndGame} className="flex-1 py-3 rounded-xl bg-emerald-500 text-white font-semibold">See Results</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
