import { FORTUNES } from './fortunes'

export interface TambolaTicket {
  rows:    (number | null)[][]  // 3 rows × 9 cols; null = empty cell
  fortune: string
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Column n (0-indexed) covers numbers: n*10+1 to (n+1)*10, except col 8 covers 80-90
function colRange(col: number): number[] {
  const start = col * 10 + 1
  const end = col === 8 ? 90 : (col + 1) * 10
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

// Generate a valid 3×9 boolean mask:
// - each row has exactly 5 true values
// - each column has 1–3 true values (guaranteed since max is 3 rows)
function generateMask(): boolean[][] {
  while (true) {
    const rowSets = Array.from({ length: 3 }, () =>
      new Set(shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8]).slice(0, 5))
    )
    // Only violation possible: a column appears 0 times (appearing >3 is impossible with 3 rows)
    const allColsCovered = Array.from({ length: 9 }, (_, c) =>
      rowSets.some(row => row.has(c))
    ).every(Boolean)

    if (allColsCovered) {
      return rowSets.map(rowSet => Array.from({ length: 9 }, (_, c) => rowSet.has(c)))
    }
  }
}

export function generateTicket(): TambolaTicket {
  const mask = generateMask()
  const grid: (number | null)[][] = Array.from({ length: 3 }, () => Array(9).fill(null))

  for (let col = 0; col < 9; col++) {
    const maskedRows = [0, 1, 2].filter(r => mask[r][col])
    // Pick random numbers from this column's range, sort ascending (top row = smaller number)
    const nums = shuffle(colRange(col)).slice(0, maskedRows.length).sort((a, b) => a - b)
    maskedRows.forEach((row, i) => {
      grid[row][col] = nums[i]
    })
  }

  return { rows: grid, fortune: FORTUNES[Math.floor(Math.random() * FORTUNES.length)] }
}

export function generateTickets(n: number): TambolaTicket[] {
  return Array.from({ length: n }, () => generateTicket())
}

export function validateTicket(ticket: TambolaTicket): boolean {
  // Each row must have exactly 5 filled cells
  if (!ticket.rows.every(row => row.filter(c => c !== null).length === 5)) return false

  // Each column must have 1–3 filled cells
  for (let col = 0; col < 9; col++) {
    const filled = ticket.rows.filter(row => row[col] !== null).length
    if (filled < 1 || filled > 3) return false
  }

  // Numbers must be in correct column range, unique, and within 1-90
  for (let col = 0; col < 9; col++) {
    const range = colRange(col)
    for (const row of ticket.rows) {
      const cell = row[col]
      if (cell !== null && !range.includes(cell)) return false
    }
  }

  const allNums = ticket.rows.flat().filter(n => n !== null) as number[]
  if (new Set(allNums).size !== allNums.length) return false
  if (allNums.some(n => n < 1 || n > 90)) return false

  return true
}
