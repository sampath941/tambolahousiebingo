import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { type GamePlayer, type ClaimConfig, type MarkedClaim, DEFAULT_CLAIMS } from './gameStore'

function shuffled(): number[] {
  const a = Array.from({ length: 90 }, (_, i) => i + 1)
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

interface ActiveGameStore {
  type:         'quick' | 'full' | null
  // caller state
  remaining:    number[]
  calledArray:  number[]
  current:      number | null
  history:      number[]
  langCode:     string
  isAuto:       boolean
  timerSecs:    number
  // full-game state
  gameId:       string
  players:      GamePlayer[]
  claimsConfig: ClaimConfig[]
  markedClaims: MarkedClaim[]
  startedAt:    string | null

  startQuick:   () => void
  startFull:    (gameId: string, players: GamePlayer[], config: ClaimConfig[]) => void
  popNext:      () => number | null
  setLangCode:  (code: string) => void
  setIsAuto:    (v: boolean) => void
  setTimerSecs: (s: number) => void
  addMark:      (claimType: string, winnerLocalId: string, winnerNickname: string) => void
  clearGame:    () => void
}

const BLANK = {
  remaining: [] as number[], calledArray: [] as number[], current: null, history: [] as number[],
  langCode: 'en', isAuto: false, timerSecs: 3,
  gameId: '', players: [] as GamePlayer[], claimsConfig: DEFAULT_CLAIMS,
  markedClaims: [] as MarkedClaim[], startedAt: null,
}

export const useActiveGame = create<ActiveGameStore>()(
  persist(
    (set, get) => ({
      type: null,
      ...BLANK,

      startQuick: () => set({
        type: 'quick',
        remaining: shuffled(), calledArray: [], current: null, history: [],
        isAuto: false,
        gameId: '', players: [], claimsConfig: DEFAULT_CLAIMS, markedClaims: [], startedAt: null,
      }),

      startFull: (gameId, players, config) => set({
        type: 'full',
        remaining: shuffled(), calledArray: [], current: null, history: [],
        isAuto: false,
        gameId, players, claimsConfig: config, markedClaims: [],
        startedAt: new Date().toISOString(),
      }),

      // Pop next number from remaining — uses get() so always reads latest state
      popNext: () => {
        const { remaining, calledArray, history } = get()
        if (remaining.length === 0) return null
        const [next, ...rest] = remaining
        set({
          remaining: rest,
          current: next,
          calledArray: [...calledArray, next],
          // dedup guard (StrictMode safety)
          history: history[history.length - 1] === next ? history : [...history, next],
        })
        return next
      },

      setLangCode:  (langCode)  => set({ langCode }),
      setIsAuto:    (isAuto)    => set({ isAuto }),
      setTimerSecs: (timerSecs) => set({ timerSecs }),

      addMark: (claimType, winnerLocalId, winnerNickname) =>
        set(s => ({
          markedClaims: [...s.markedClaims, {
            claimType, winnerLocalId, winnerNickname, wonAt: new Date().toISOString(),
          }],
        })),

      clearGame: () => set({ type: null, ...BLANK }),
    }),
    { name: 'thambola-active-game' },
  ),
)
