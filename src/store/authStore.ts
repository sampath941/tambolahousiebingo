import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  token:    string | null
  playerId: string | null
  nickname: string | null
  phone:    string | null
  signIn:  (token: string, playerId: string, nickname: string, phone: string) => void
  signOut: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token:    null,
      playerId: null,
      nickname: null,
      phone:    null,
      signIn:  (token, playerId, nickname, phone) => set({ token, playerId, nickname, phone }),
      signOut: () => set({ token: null, playerId: null, nickname: null, phone: null }),
    }),
    { name: 'thambola-auth' },
  ),
)
