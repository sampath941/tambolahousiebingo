import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { LANGUAGES } from '../lib/languages'
import { speakNumber, cancelSpeech } from '../lib/tts'
import { preloadAudio, playAudio } from '../lib/audioPlayer'
import { useActiveGame } from '../store/activeGameStore'

const TIMER_OPTIONS = [3, 5, 10]
const GRID_NUMBERS  = Array.from({ length: 90 }, (_, i) => i + 1)

export default function QuickGame() {
  const navigate = useNavigate()
  const game     = useActiveGame()
  const lang     = LANGUAGES.find(l => l.code === game.langCode) ?? LANGUAGES[0]

  // Only local state: UI flags that don't need persistence
  const [running,    setRunning]    = useState(false)
  const [showReset,  setShowReset]  = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // On mount: if no quick game exists, start one fresh
  useEffect(() => {
    if (game.type !== 'quick') game.startQuick()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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

  function resetGame() {
    cancelSpeech()
    if (intervalRef.current) clearInterval(intervalRef.current)
    setRunning(false)
    setShowReset(false)
    game.startQuick()
  }

  const called  = new Set(game.calledArray)
  const recent  = game.history.slice(-4, -1).reverse()
  const done    = game.remaining.length === 0

  return (
    <div className="h-[100dvh] flex flex-col landscape:flex-row overflow-hidden bg-primary-50">

      {/* ── Controls panel ── */}
      <div className="flex-shrink-0 flex flex-col landscape:w-[260px] landscape:h-full landscape:border-r landscape:border-gray-700">

        {/* Header */}
        <div className="flex items-center gap-2 px-3 pt-2 pb-1">
          <button onClick={() => { cancelSpeech(); navigate('/') }} className="text-gray-500 text-xl p-1 leading-none">←</button>
          <h2 className="flex-1 text-sm font-bold text-gray-800">Quick Game</h2>
          <button onClick={() => setShowReset(true)} className="text-xs text-red-500 font-semibold px-2 py-1">Reset</button>
        </div>

        {/* Language selector */}
        <div className="px-2 pb-1">
          <div className="flex gap-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {LANGUAGES.map(l => (
              <button key={l.code} onClick={() => game.setLangCode(l.code)}
                className={`flex-shrink-0 px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors
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
            className={`flex-shrink-0 flex items-center justify-center rounded-full shadow-xl text-white font-black select-none transition-transform active:scale-95
              landscape:w-36 landscape:h-36 landscape:text-6xl
              ${done ? 'bg-gray-300' : 'bg-primary-600'}`}
            style={{ width: 'clamp(110px, 26dvh, 224px)', height: 'clamp(110px, 26dvh, 224px)', fontSize: 'clamp(2.5rem, 10dvh, 5rem)' }}
          >
            {game.current ?? '?'}
          </div>

          <div className="portrait:flex-1 portrait:min-w-0 landscape:text-center">
            {done ? (
              <p className="text-sm font-bold text-primary-600">All 90 called!</p>
            ) : (
              <>
                <div className="flex items-baseline gap-1.5 landscape:justify-center">
                  <span className="text-xl font-black text-gray-800">{game.calledArray.length}</span>
                  <span className="text-xs text-gray-500">called</span>
                  <span className="text-gray-300">·</span>
                  <span className="text-xl font-black text-gray-400">{game.remaining.length}</span>
                  <span className="text-xs text-gray-400">left</span>
                </div>
                {recent.length > 0 && (
                  <p className="text-[11px] mt-0.5 truncate landscape:text-center">
                    <span className="text-gray-400">Prev: </span>
                    <span className="text-gray-700 font-bold">{recent.join(' · ')}</span>
                  </p>
                )}
                {!game.isAuto && <p className="text-[10px] text-primary-400 mt-0.5">Tap to call</p>}
              </>
            )}
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
                  className={`w-full py-2 rounded-xl text-xs font-bold disabled:opacity-40
                    ${running ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'}`}
                >{running ? '⏸ Pause' : '▶ Start Auto-call'}</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 90-number grid ── */}
      <div className="flex-1 min-h-0 min-w-0 bg-gray-900" style={{ containerType: 'size' }}>
        <div className="h-full w-full grid grid-cols-10"
          style={{ gridTemplateRows: 'repeat(9, minmax(0, 1fr))' }}
        >
          {GRID_NUMBERS.map(n => (
            <div key={n} className="flex items-center justify-center">
              <div
                className={`rounded-full flex items-center justify-center font-bold transition-all select-none
                  ${n === game.current
                    ? 'bg-rose-400 text-white ring-2 ring-white shadow-[0_0_10px_rgba(251,113,133,0.8)]'
                    : called.has(n) ? 'bg-rose-600 text-white'
                    : 'bg-emerald-500 text-white'}`}
                style={{ width: 'min(9cqw, 10cqh)', height: 'min(9cqw, 10cqh)', fontSize: 'min(3.5cqw, 4cqh)' }}
              >{n}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Reset confirm */}
      {showReset && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-3xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Reset game?</h3>
            <p className="text-sm text-gray-500 mb-5">All called numbers will be cleared.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowReset(false)} className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold">Cancel</button>
              <button onClick={resetGame} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-semibold">Reset</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
