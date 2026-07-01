import { Fragment, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { generateTickets, type TambolaTicket } from '../lib/tambola'
import type { jsPDF as JsPDFType } from 'jspdf'

// ── Config ────────────────────────────────────────────────────────────────────

type TicketSize = 'small' | 'medium' | 'big'

interface SizeConfig {
  label:      string
  perPage:    number
  cols:       1 | 2
  rows:       number
  desc:       string
  printNumMm: number   // used for both CSS var and PDF font size
  landscape:  boolean
}

const SIZES: Record<TicketSize, SizeConfig> = {
  small:  { label: 'Small',  perPage: 10, cols: 2, rows: 5, desc: '10 / page · 2 cols', printNumMm: 6,  landscape: false },
  medium: { label: 'Medium', perPage: 5,  cols: 1, rows: 5, desc: '5 / page · 1 col',   printNumMm: 9,  landscape: false },
  big:    { label: 'Big',    perPage: 3,  cols: 1, rows: 3, desc: '3 / page · 1 col',   printNumMm: 13, landscape: false },
}

const SCREEN_FONT: Record<1 | 2, string> = {
  2: 'clamp(6px, 1.4vw, 9px)',
  1: 'clamp(9px, 2.4vw, 13px)',
}

const MM_TO_PT = 2.835

// ── PDF drawing helpers ───────────────────────────────────────────────────────

function drawTicketOnDoc(
  doc: JsPDFType,
  ticket: TambolaTicket,
  index: number,
  x: number, y: number, w: number, h: number,
  numMm: number,
) {
  const LABEL_H  = Math.max(h * 0.08, 4)   // min 4mm for legibility
  const GRID_H   = h - LABEL_H
  const CELL_W   = w / 9
  const ROW_H    = GRID_H / 3
  const numPt    = numMm * MM_TO_PT
  const labelPt  = LABEL_H * 0.65 * MM_TO_PT

  // Label strip
  doc.setFillColor(124, 58, 237)
  doc.rect(x, y, w, LABEL_H, 'F')

  // Ticket number
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(labelPt)
  doc.text(`#${index + 1}`, x + w / 2, y + LABEL_H / 2, { align: 'center', baseline: 'middle' })

  // Outer border
  doc.setDrawColor(76, 29, 149)
  doc.setLineWidth(0.3)
  doc.setLineDashPattern([], 0)
  doc.rect(x, y, w, h, 'S')

  // Grid
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 9; col++) {
      const cx  = x + col * CELL_W
      const cy  = y + LABEL_H + row * ROW_H
      const val = ticket.rows[row][col]

      if (val !== null) {
        doc.setFillColor(245, 243, 255)
        doc.rect(cx, cy, CELL_W, ROW_H, 'F')
      }

      doc.setDrawColor(196, 181, 253)
      doc.setLineWidth(0.1)
      doc.rect(cx, cy, CELL_W, ROW_H, 'S')

      if (val !== null) {
        doc.setTextColor(59, 7, 100)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(numPt)
        doc.text(String(val), cx + CELL_W / 2, cy + ROW_H / 2, { align: 'center', baseline: 'middle' })
      }
    }
  }
}

async function downloadAsPDF(tickets: TambolaTicket[], size: TicketSize, pages: number) {
  const { jsPDF } = await import('jspdf')
  const cfg = SIZES[size]

  // A4 dimensions (mm)
  const PAGE_W = 210
  const PAGE_H = 297
  const MARGIN  = 5
  const CUT_GAP = 5   // mm gap between tickets where cut line lives

  const ticketW = (PAGE_W - MARGIN * 2 - CUT_GAP * (cfg.cols - 1)) / cfg.cols
  const ticketH = (PAGE_H - MARGIN * 2 - CUT_GAP * (cfg.rows - 1)) / cfg.rows

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  for (let p = 0; p < pages; p++) {
    if (p > 0) doc.addPage()

    const pageTickets = tickets.slice(p * cfg.perPage, (p + 1) * cfg.perPage)

    // Dashed cut lines
    doc.setDrawColor(160, 160, 160)
    doc.setLineWidth(0.25)
    doc.setLineDashPattern([2, 2], 0)

    for (let r = 1; r < cfg.rows; r++) {
      const lineY = MARGIN + r * ticketH + (r - 1) * CUT_GAP + CUT_GAP / 2
      doc.line(0, lineY, PAGE_W, lineY)
    }
    for (let c = 1; c < cfg.cols; c++) {
      const lineX = MARGIN + c * ticketW + (c - 1) * CUT_GAP + CUT_GAP / 2
      doc.line(lineX, 0, lineX, PAGE_H)
    }

    doc.setLineDashPattern([], 0)

    // Tickets
    pageTickets.forEach((ticket, i) => {
      const col = i % cfg.cols
      const row = Math.floor(i / cfg.cols)
      const tx  = MARGIN + col * (ticketW + CUT_GAP)
      const ty  = MARGIN + row * (ticketH + CUT_GAP)
      drawTicketOnDoc(doc, ticket, p * cfg.perPage + i, tx, ty, ticketW, ticketH, cfg.printNumMm)
    })
  }

  doc.save(`tambola-${pages}p-${size}.pdf`)
}

// ── Ticket card (screen preview + print) ─────────────────────────────────────

function TicketCard({ ticket, index, screenFont }: {
  ticket: TambolaTicket
  index: number
  screenFont: string
}) {
  return (
    <div className="ticket-wrap border border-violet-700 rounded-sm overflow-hidden flex flex-col h-full">
      <div className="bg-violet-600 text-white text-center flex-shrink-0" style={{ padding: '1px 0' }}>
        <span className="font-bold" style={{ fontSize: 'clamp(6px, 1vw, 9px)' }}>#{index + 1}</span>
      </div>
      <table className="w-full border-collapse flex-1" style={{ tableLayout: 'fixed' }}>
        <tbody>
          {ticket.rows.map((row, r) => (
            <tr key={r}>
              {row.map((cell, c) => (
                <td
                  key={c}
                  className={`border border-violet-200 text-center font-black leading-none select-none
                    ${cell !== null ? 'bg-violet-50 text-violet-900' : 'bg-white'}`}
                  style={{ width: '11.11%', padding: '1px 0', fontSize: screenFont }}
                >
                  {cell ?? ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Page content: rows + cut lines ───────────────────────────────────────────

function TicketPageContent({ group, cfg, startIdx }: {
  group:    TambolaTicket[]
  cfg:      SizeConfig
  startIdx: number
}) {
  const screenFont = SCREEN_FONT[cfg.cols]
  const ticketRows = Array.from({ length: cfg.rows }, (_, r) =>
    group.slice(r * cfg.cols, (r + 1) * cfg.cols)
  )

  return (
    <div className="ticket-page-inner flex flex-col">
      {ticketRows.map((rowTickets, r) => (
        <Fragment key={r}>
          {r > 0 && <div className="print-cut-h" />}
          <div className="ticket-row flex flex-1 min-h-0">
            {rowTickets.map((ticket, c) => (
              <Fragment key={c}>
                {c > 0 && <div className="print-cut-v" />}
                <div className="ticket-col-cell flex-1 min-w-0 flex flex-col">
                  <TicketCard
                    ticket={ticket}
                    index={startIdx + r * cfg.cols + c}
                    screenFont={screenFont}
                  />
                </div>
              </Fragment>
            ))}
          </div>
        </Fragment>
      ))}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PrintTickets() {
  const navigate = useNavigate()

  const [size,        setSize]        = useState<TicketSize>('medium')
  const [pages,       setPages]       = useState(1)
  const [tickets,     setTickets]     = useState<TambolaTicket[]>([])
  const [generated,   setGenerated]   = useState(false)
  const [downloading, setDownloading] = useState(false)

  const cfg          = SIZES[size]
  const totalTickets = pages * cfg.perPage

  function handleGenerate() {
    setTickets(generateTickets(totalTickets))
    setGenerated(true)
  }

  async function handleDownload() {
    setDownloading(true)
    try { await downloadAsPDF(tickets, size, pages) }
    finally { setDownloading(false) }
  }

  const pageGroups: TambolaTicket[][] = Array.from({ length: pages }, (_, p) =>
    tickets.slice(p * cfg.perPage, (p + 1) * cfg.perPage)
  )

  return (
    <div className="min-h-full flex flex-col bg-primary-50">

      {/* Header */}
      <div className="flex items-center px-4 pt-4 pb-2 gap-3 print:hidden">
        <button onClick={() => navigate('/')} className="text-gray-500 text-2xl leading-none">←</button>
        <h2 className="text-lg font-bold text-gray-800 flex-1">Print Tickets</h2>
      </div>

      {/* Config */}
      <div className="px-4 pb-4 print:hidden space-y-3">

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Ticket Size</p>
          <div className="flex gap-2">
            {(Object.keys(SIZES) as TicketSize[]).map(key => (
              <button key={key}
                onClick={() => { setSize(key); setGenerated(false) }}
                className={`flex-1 py-3 rounded-xl flex flex-col items-center gap-0.5 transition-colors
                  ${size === key ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                <span className="text-sm font-bold">{SIZES[key].label}</span>
                <span className={`text-[10px] ${size === key ? 'text-violet-200' : 'text-gray-400'}`}>
                  {SIZES[key].desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Pages
            <span className="ml-2 normal-case font-normal text-primary-600">→ {totalTickets} tickets</span>
          </p>
          <div className="flex items-center gap-4 my-3">
            <button
              onClick={() => { setPages(p => Math.max(1, p - 1)); setGenerated(false) }}
              className="w-11 h-11 rounded-full bg-gray-100 text-gray-700 text-2xl font-bold flex items-center justify-center active:scale-90 transition-transform"
            >−</button>
            <span className="flex-1 text-center text-4xl font-black text-gray-800">{pages}</span>
            <button
              onClick={() => { setPages(p => Math.min(10, p + 1)); setGenerated(false) }}
              className="w-11 h-11 rounded-full bg-gray-100 text-gray-700 text-2xl font-bold flex items-center justify-center active:scale-90 transition-transform"
            >+</button>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 5, 10].map(n => (
              <button key={n} onClick={() => { setPages(n); setGenerated(false) }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors
                  ${pages === n ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-400' : 'bg-gray-100 text-gray-500'}`}
              >{n}p</button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={handleGenerate}
            className="flex-1 py-3 rounded-xl bg-primary-600 text-white font-semibold shadow-sm active:scale-95 transition-transform"
          >{generated ? 'Regenerate' : 'Generate'}</button>
          {generated && (
            <>
              <button onClick={() => window.print()}
                className="flex-1 py-3 rounded-xl bg-emerald-500 text-white font-semibold shadow-sm active:scale-95 transition-transform"
              >Print</button>
              <button onClick={handleDownload} disabled={downloading}
                className="flex-1 py-3 rounded-xl bg-amber-500 text-white font-semibold shadow-sm active:scale-95 transition-transform disabled:opacity-60"
              >{downloading ? 'Generating…' : 'Download PDF'}</button>
            </>
          )}
        </div>
      </div>

      {/* Ticket preview + print target */}
      {generated && (
        <div
          id="print-area"
          className="px-2 pb-8 space-y-4"
          style={{ '--print-num-size': `${cfg.printNumMm}mm` } as React.CSSProperties}
        >
          {pageGroups.map((group, pageIdx) => (
            <div key={pageIdx} className="print-page">
              <p className="text-[11px] font-semibold text-gray-400 mb-1 px-2 print:hidden">
                Page {pageIdx + 1} of {pages}
              </p>
              <TicketPageContent
                group={group}
                cfg={cfg}
                startIdx={pageIdx * cfg.perPage}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
