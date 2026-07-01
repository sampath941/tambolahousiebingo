const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8000'

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  token?: string,
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }))
    throw new ApiError(res.status, err.detail ?? String(res.status))
  }

  return res.json() as Promise<T>
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface AuthResponse {
  token:     string
  player_id: string
  nickname:  string
}

export interface PlayerOut {
  id:         string
  phone:      string
  nickname:   string
  created_at: string
}

export interface GameSyncPayload {
  id:             string
  mode:           string
  claims_config:  unknown[] | null
  started_at:     string | null
  ended_at:       string | null
  players:        { player_id: string | null; nickname: string }[]
  called_numbers: { number: number; sequence_order: number; called_at: string | null }[]
  claims:         { claim_type: string; winner_player_id: string | null; won_at: string | null }[]
}

export interface GameOut {
  id:            string
  mode:          string
  claims_config: unknown[] | null
  started_at:    string | null
  ended_at:      string | null
  synced_at:     string | null
  players:       { player_id: string | null; nickname: string }[]
  claims:        { claim_type: string; winner_player_id: string | null; won_at: string | null }[]
}

// ── Endpoints ─────────────────────────────────────────────────────────────────

export const api = {
  register: (phone: string, pin: string, nickname: string) =>
    request<AuthResponse>('POST', '/auth/register', { phone, pin, nickname }),

  login: (phone: string, pin: string) =>
    request<AuthResponse>('POST', '/auth/login', { phone, pin }),

  getPlayers: (token: string) =>
    request<PlayerOut[]>('GET', '/players', undefined, token),

  syncGame: (token: string, game: GameSyncPayload) =>
    request<{ status: string }>('POST', '/games/sync', game, token),

  getGames: (token: string) =>
    request<GameOut[]>('GET', '/games', undefined, token),
}
