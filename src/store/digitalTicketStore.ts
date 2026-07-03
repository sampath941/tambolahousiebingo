import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { generateTickets } from '../lib/tambola'

export interface DigitalTicketEntry {
  id:        string
  rows:      (number | null)[][]
  struck:    number[]
  createdAt: string  // ISO — displayed as HH:MM
}

interface DigitalTicketStore {
  tickets:      DigitalTicketEntry[]
  addTicket:    () => void
  toggleStrike: (ticketId: string, num: number) => void
  removeTicket: (ticketId: string) => void
}

export const MAX_TICKETS = 6

export const useDigitalTickets = create<DigitalTicketStore>()(
  persist(
    (set) => ({
      tickets: [],

      addTicket: () => {
        const [ticket] = generateTickets(1)
        set(s => ({
          tickets: [...s.tickets, {
            id:        crypto.randomUUID(),
            rows:      ticket.rows,
            struck:    [],
            createdAt: new Date().toISOString(),
          }]
        }))
      },

      toggleStrike: (ticketId, num) => set(s => ({
        tickets: s.tickets.map(t =>
          t.id !== ticketId ? t : {
            ...t,
            struck: t.struck.includes(num)
              ? t.struck.filter(n => n !== num)
              : [...t.struck, num],
          }
        )
      })),

      removeTicket: (ticketId) => set(s => ({
        tickets: s.tickets.filter(t => t.id !== ticketId)
      })),
    }),
    { name: 'tambola-digital-tickets' }
  )
)
