import { describe, it, expect } from 'vitest'
import { generateTicket, generateTickets, validateTicket } from './tambola'

describe('generateTicket', () => {
  it('produces exactly 15 numbers per ticket', () => {
    const ticket = generateTicket()
    const nums = ticket.rows.flat().filter(n => n !== null)
    expect(nums.length).toBe(15)
  })

  it('has exactly 5 filled cells in each row', () => {
    const ticket = generateTicket()
    for (const row of ticket.rows) {
      expect(row.filter(n => n !== null).length).toBe(5)
    }
  })

  it('has at least 1 and at most 3 filled cells in each column', () => {
    const ticket = generateTicket()
    for (let col = 0; col < 9; col++) {
      const filled = ticket.rows.filter(row => row[col] !== null).length
      expect(filled).toBeGreaterThanOrEqual(1)
      expect(filled).toBeLessThanOrEqual(3)
    }
  })

  it('places numbers in the correct column range', () => {
    const ticket = generateTicket()
    for (let col = 0; col < 9; col++) {
      const start = col * 10 + 1
      const end = col === 8 ? 90 : (col + 1) * 10
      for (const row of ticket.rows) {
        const cell = row[col]
        if (cell !== null) {
          expect(cell).toBeGreaterThanOrEqual(start)
          expect(cell).toBeLessThanOrEqual(end)
        }
      }
    }
  })

  it('has no duplicate numbers', () => {
    const ticket = generateTicket()
    const nums = ticket.rows.flat().filter(n => n !== null) as number[]
    expect(new Set(nums).size).toBe(nums.length)
  })

  it('only uses numbers 1-90', () => {
    const ticket = generateTicket()
    const nums = ticket.rows.flat().filter(n => n !== null) as number[]
    nums.forEach(n => {
      expect(n).toBeGreaterThanOrEqual(1)
      expect(n).toBeLessThanOrEqual(90)
    })
  })

  it('passes validateTicket', () => {
    for (let i = 0; i < 20; i++) {
      expect(validateTicket(generateTicket())).toBe(true)
    }
  })
})

describe('generateTickets', () => {
  it('returns the correct number of tickets', () => {
    expect(generateTickets(6).length).toBe(6)
    expect(generateTickets(1).length).toBe(1)
  })

  it('each ticket is valid', () => {
    generateTickets(12).forEach(t => {
      expect(validateTicket(t)).toBe(true)
    })
  })
})

describe('validateTicket', () => {
  it('rejects a ticket with wrong row count', () => {
    const t = generateTicket()
    // corrupt row 0: add an extra number
    const col = t.rows[0].findIndex(c => c === null)
    if (col >= 0) {
      t.rows[0][col] = 50
      expect(validateTicket(t)).toBe(false)
    }
  })
})
