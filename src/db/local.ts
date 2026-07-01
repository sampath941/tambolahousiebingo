import Dexie, { type Table } from 'dexie'

// ── Shapes stored locally ─────────────────────────────────────────────────────

export interface LocalClaimsPreset {
  hostId:  string          // primary key — one preset per signed-in user
  claims:  ClaimConfig[]
  savedAt: string
}

export interface LocalPlayer {
  id:        string
  phone:     string
  nickname:  string
  createdAt: string
}

export interface LocalContact {
  id:        string   // random UUID
  hostId:    string   // auth.playerId of the user who owns this contact
  nickname:  string
  createdAt: string
}

export interface LocalCalledNumber {
  number:        number
  sequenceOrder: number
  calledAt:      string | null
}

export interface LocalClaim {
  claimType:      string
  winnerPlayerId: string | null
  wonAt:          string | null
  winnerNickname: string | null  // denormalised for display without a join
}

export interface LocalGamePlayer {
  playerId: string | null
  nickname: string
}

export interface ClaimConfig {
  type:   string
  label:  string
  prize:  number
}

export interface LocalGame {
  id:            string
  hostId:        string
  mode:          'quick' | 'full'
  claimsConfig:  ClaimConfig[] | null
  startedAt:     string | null
  endedAt:       string | null
  savedAt:       string          // ISO timestamp when saved locally
  syncedAt:      string | null   // null = not yet synced to server
  players:       LocalGamePlayer[]
  calledNumbers: LocalCalledNumber[]
  claims:        LocalClaim[]
}

// ── Database ──────────────────────────────────────────────────────────────────

class ThambolaDB extends Dexie {
  players!:       Table<LocalPlayer>
  games!:         Table<LocalGame>
  contacts!:      Table<LocalContact>
  claimsPresets!: Table<LocalClaimsPreset>

  constructor() {
    super('thambolahousie')
    this.version(1).stores({
      players: 'id, phone',
      games:   'id, hostId, savedAt, syncedAt',
    })
    this.version(2).stores({
      players:  'id, phone',
      games:    'id, hostId, savedAt, syncedAt',
      contacts: 'id, hostId',
    })
    this.version(3).stores({
      players:       'id, phone',
      games:         'id, hostId, savedAt, syncedAt',
      contacts:      'id, hostId',
      claimsPresets: 'hostId',
    })
  }
}

export const db = new ThambolaDB()
