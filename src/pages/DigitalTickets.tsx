import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDigitalTickets, MAX_TICKETS, type DigitalTicketEntry } from '../store/digitalTicketStore'

function TicketCard({ ticket, index, onDelete }: {
  ticket:   DigitalTicketEntry
  index:    number
  onDelete: () => void
}) {
  const toggleStrike = useDigitalTickets(s => s.toggleStrike)

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-violet-100">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-violet-600">
        <div className="flex items-center gap-2">
          <span className="text-white text-sm font-bold tracking-wide">Ticket #{index + 1}</span>
          <span className="text-white text-sm font-semibold bg-violet-500 px-2 py-0.5 rounded-md">
            {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-violet-200 text-xs">{ticket.struck.length} / 15</span>
          <button
            onClick={onDelete}
            className="text-violet-300 hover:text-white text-base leading-none transition-colors"
            aria-label="Delete ticket"
          >✕</button>
        </div>
      </div>

      {/* Grid */}
      <div className="p-2">
        <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
          <tbody>
            {ticket.rows.map((row, r) => (
              <tr key={r}>
                {row.map((cell, c) => {
                  const isStruck = cell !== null && ticket.struck.includes(cell)
                  return (
                    <td
                      key={c}
                      onClick={() => cell !== null && toggleStrike(ticket.id, cell)}
                      style={{ width: '11.11%', height: '44px' }}
                      className={`border border-violet-200 text-center select-none transition-colors
                        ${cell !== null
                          ? 'cursor-pointer active:scale-90'
                          : 'bg-white'
                        }
                        ${isStruck
                          ? 'bg-violet-700'
                          : cell !== null
                            ? 'bg-violet-50'
                            : ''
                        }`}
                    >
                      {cell !== null && (
                        <span className={`text-sm font-black leading-none
                          ${isStruck ? 'text-white/70 line-through' : 'text-violet-900'}`}
                        >
                          {cell}
                        </span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Progress bar */}
      <div className="px-3 pb-3">
        <div className="bg-violet-100 rounded-full h-1">
          <div
            className="bg-violet-500 h-1 rounded-full transition-all duration-300"
            style={{ width: `${(ticket.struck.length / 15) * 100}%` }}
          />
        </div>
      </div>

    </div>
  )
}

export default function DigitalTickets() {
  const navigate = useNavigate()
  const { tickets, addTicket, removeTicket } = useDigitalTickets()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const canAdd = tickets.length < MAX_TICKETS

  return (
    <div className="min-h-full flex flex-col bg-primary-50">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <button onClick={() => navigate('/')} className="text-gray-500 text-2xl leading-none">←</button>
        <h2 className="flex-1 text-lg font-bold text-gray-800">My Tickets</h2>
        {tickets.length > 0 && (
          <button
            onClick={addTicket}
            disabled={!canAdd}
            className="px-4 py-2 bg-violet-600 text-white text-sm font-bold rounded-xl disabled:opacity-40 active:scale-95 transition-transform"
          >
            + Add
          </button>
        )}
      </div>

      {tickets.length > 0 && (
        <p className="px-4 pb-2 text-xs text-gray-400">
          Tap a number to strike it off · tap again to undo
        </p>
      )}

      <div className="flex-1 px-4 pb-8 space-y-4">

        {tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-6xl mb-4">🎫</div>
            <p className="text-gray-700 font-bold text-lg">No active tickets</p>
            <p className="text-gray-400 text-sm mt-1 mb-8 max-w-xs">
              Generate a ticket and strike off numbers as they are called
            </p>
            <button
              onClick={addTicket}
              className="px-10 py-4 bg-violet-600 text-white text-base font-bold rounded-2xl shadow-md active:scale-95 transition-transform"
            >
              Generate Ticket
            </button>
          </div>
        ) : (
          <>
            {tickets.map((ticket, i) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                index={i}
                onDelete={() => setDeletingId(ticket.id)}
              />
            ))}

            {canAdd ? (
              <button
                onClick={addTicket}
                className="w-full py-3.5 text-sm text-violet-600 font-semibold border-2 border-dashed border-violet-200 rounded-2xl active:scale-95 transition-transform"
              >
                + Add Another Ticket
              </button>
            ) : (
              <p className="text-center text-xs text-gray-300 py-2">
                Maximum {MAX_TICKETS} tickets reached
              </p>
            )}
          </>
        )}
      </div>

      {/* Delete confirmation */}
      {deletingId && (
        <div
          className="fixed inset-0 bg-black/50 flex items-end justify-center z-50"
          onClick={() => setDeletingId(null)}
        >
          <div
            className="bg-white rounded-t-3xl w-full max-w-sm p-6"
            onClick={e => e.stopPropagation()}
          >
            <p className="text-base font-bold text-gray-800 mb-1">Delete this ticket?</p>
            <p className="text-sm text-gray-500 mb-5">All your struck numbers will be lost.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold"
              >Keep</button>
              <button
                onClick={() => { removeTicket(deletingId); setDeletingId(null) }}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-semibold"
              >Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
