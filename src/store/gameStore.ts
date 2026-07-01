import { create } from 'zustand'

export interface GamePlayer {
  localId:  string        // UUID used within this session
  playerId: string | null // backend player ID if registered
  nickname: string
}

export interface ClaimConfig {
  type:  string
  label: string
  prize: number
}

export interface MarkedClaim {
  claimType:      string
  winnerLocalId:  string
  winnerNickname: string
  wonAt:          string
}

export const DEFAULT_CLAIMS: ClaimConfig[] = [
  { type: 'early_five',  label: 'Early Five',  prize: 20 },
  { type: 'top_line',    label: 'Top Line',    prize: 20 },
  { type: 'middle_line', label: 'Middle Line', prize: 20 },
  { type: 'bottom_line', label: 'Bottom Line', prize: 20 },
  { type: 'full_house',  label: 'Full House',  prize: 50 },
]

interface GameStore {
  gameId:       string
  players:      GamePlayer[]
  claimsConfig: ClaimConfig[]
  calledNums:   number[]
  markedClaims: MarkedClaim[]
  startedAt:    string | null

  initGame:       () => void
  setPlayers:     (p: GamePlayer[]) => void
  setClaimsConfig:(c: ClaimConfig[]) => void
  addCalledNum:   (n: number) => void
  markClaim:      (claimType: string, winnerLocalId: string, winnerNickname: string) => void
  resetGame:      () => void
}

export const useGameStore = create<GameStore>((set) => ({
  gameId:       '',
  players:      [],
  claimsConfig: DEFAULT_CLAIMS,
  calledNums:   [],
  markedClaims: [],
  startedAt:    null,

  initGame: () => set({
    gameId:      crypto.randomUUID(),
    calledNums:  [],
    markedClaims:[],
    startedAt:   new Date().toISOString(),
  }),

  setPlayers:     (players)      => set({ players }),
  setClaimsConfig:(claimsConfig) => set({ claimsConfig }),

  addCalledNum: (n) => set(s => ({ calledNums: [...s.calledNums, n] })),

  markClaim: (claimType, winnerLocalId, winnerNickname) =>
    set(s => ({
      markedClaims: [...s.markedClaims, {
        claimType, winnerLocalId, winnerNickname, wonAt: new Date().toISOString(),
      }],
    })),

  resetGame: () => set({
    gameId: '', players: [], claimsConfig: DEFAULT_CLAIMS,
    calledNums: [], markedClaims: [], startedAt: null,
  }),
}))
