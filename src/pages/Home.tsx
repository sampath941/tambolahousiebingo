import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useOnline } from '../hooks/useOnline'
import { useActiveGame } from '../store/activeGameStore'
import { useDigitalTickets } from '../store/digitalTicketStore'

interface ActionCardProps {
  icon:       string
  title:      string
  subtitle:   string
  onClick:    () => void
  disabled?:  boolean
  gradient?:  string
  border?:    string
  arrowColor?: string
}

function ActionCard({ icon, title, subtitle, onClick, disabled, gradient, border, arrowColor }: ActionCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-4 p-5 rounded-3xl shadow-sm active:scale-95 transition-transform disabled:opacity-50
        ${gradient ?? `bg-white ${border ?? 'border-2 border-gray-100'}`}`}
    >
      <span className="text-3xl flex-shrink-0">{icon}</span>
      <div className="flex-1 text-left">
        <p className={`font-bold text-lg leading-tight ${gradient ? 'text-white' : 'text-gray-800'}`}>{title}</p>
        <p className={`text-sm mt-0.5 ${gradient ? 'text-white/70' : 'text-gray-400'}`}>{subtitle}</p>
      </div>
      <span className={`text-xl flex-shrink-0 ${arrowColor ?? 'text-gray-300'}`}>›</span>
    </button>
  )
}

export default function Home() {
  const navigate   = useNavigate()
  const online     = useOnline()
  const { token, nickname, signOut } = useAuthStore()
  const signedIn   = !!token
  const activeGame    = useActiveGame()
  const hasGame       = activeGame.type !== null && activeGame.calledArray.length >= 1 && activeGame.calledArray.length < 90
  const ticketCount   = useDigitalTickets(s => s.tickets.length)

  function handleResume() {
    if (activeGame.type === 'quick') navigate('/quick-game')
    else if (activeGame.type === 'full') signedIn ? navigate('/full-game') : navigate('/sign-in')
  }

  return (
    <div className="min-h-full flex flex-col bg-gradient-to-b from-rose-50 via-fuchsia-50 to-violet-100">

      {/* Hero */}
      <div className="px-6 pt-6 pb-4 text-center">
        {/* Tambola ticket icon — 3×9 grid dots */}
        <div className="inline-block mb-2">
          <div className="bg-white border-2 border-violet-300 rounded-xl p-2 shadow-md inline-grid grid-cols-9 gap-[3px]">
            {[...Array(27)].map((_, i) => (
              <div key={i} className={`w-2.5 h-2.5 rounded-full ${
                [0,2,4,6,8,10,14,16,20,22,24,26].includes(i)
                  ? 'bg-violet-600' : 'bg-violet-100'
              }`} />
            ))}
          </div>
        </div>
        <h1 className="text-4xl font-black tracking-tight text-violet-800 leading-tight">Tambola Caller</h1>
        <p className="text-fuchsia-400 mt-1 text-sm font-medium tracking-wide">HOUSIE · BINGO ✨</p>

        {signedIn ? (
          <div className="mt-5 inline-flex items-center gap-2 bg-white/70 backdrop-blur-sm rounded-full px-5 py-2 border border-rose-100 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
            <span className="text-sm text-gray-700 font-semibold">Welcome back, {nickname}!</span>
            <button onClick={signOut} className="text-xs text-gray-400 hover:text-red-400 ml-1 transition-colors">
              Sign out
            </button>
          </div>
        ) : (
          <div className="mt-5 inline-flex items-center gap-1.5 bg-white/50 rounded-full px-4 py-1.5 border border-gray-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span className="text-xs text-gray-500">Sign in to unlock all features</span>
          </div>
        )}
      </div>

      {/* Action cards */}
      <div className="flex-1 px-4 pb-10 space-y-3">

        {/* Resume card — shown when a game is in progress */}
        {hasGame && (
          <div className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-4 flex items-center gap-3 shadow-sm">
            <span className="text-2xl flex-shrink-0">📍</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-amber-800">Game in progress</p>
              {activeGame.type === 'quick'
                ? <p className="text-xs text-amber-600">{activeGame.calledArray.length} of 90 numbers called</p>
                : <p className="text-xs text-amber-600">
                    {activeGame.players.length} players · {activeGame.markedClaims.length}/{activeGame.claimsConfig.length} claims
                    {!signedIn && ' · Sign in to resume'}
                  </p>
              }
            </div>
            <button onClick={handleResume}
              className="flex-shrink-0 px-4 py-2 bg-amber-500 text-white text-sm font-bold rounded-xl active:scale-95 transition-transform"
            >Resume →</button>
          </div>
        )}

        <ActionCard
          icon="🎯"
          title="Quick Game"
          subtitle="Call numbers · No sign-in needed"
          onClick={() => navigate('/quick-game')}
          gradient="bg-gradient-to-r from-violet-600 to-purple-700 shadow-lg shadow-violet-200"
          arrowColor="text-violet-300"
        />

        {signedIn && (
          <ActionCard
            icon="👑"
            title="Start Game with Players"
            subtitle="Saved Players · Winners"
            onClick={() => navigate('/game-setup')}
            gradient="bg-gradient-to-r from-rose-500 to-pink-600 shadow-lg shadow-rose-200"
            arrowColor="text-rose-300"
          />
        )}

        <ActionCard
          icon="🎫"
          title={ticketCount > 0 ? `Digital Ticket  ·  ${ticketCount} active` : 'Digital Ticket'}
          subtitle={'No pen, no problem. Just like a real ticket — strike off numbers.'}
          onClick={() => navigate('/my-tickets')}
          border="border-2 border-violet-100"
          arrowColor="text-violet-300"
        />

        <ActionCard
          icon="🖨️"
          title="Print Ticket Sheets"
          subtitle={'No tickets, no problem. Print ticket sheets to your printer.'}
          onClick={() => navigate('/print')}
          border="border-2 border-violet-100"
          arrowColor="text-violet-300"
        />

        {signedIn && (
          <ActionCard
            icon="🏆"
            title="Past Games"
            subtitle="View results · See who won"
            onClick={() => navigate('/history')}
            border="border-2 border-amber-100"
            arrowColor="text-amber-400"
          />
        )}

        {!signedIn && (
          <ActionCard
            icon="✨"
            title="Sign In"
            subtitle={online ? 'Save games · Track players · See history' : 'Requires internet connection'}
            onClick={() => navigate('/sign-in')}
            disabled={!online}
            border="border-2 border-fuchsia-100"
            arrowColor="text-fuchsia-300"
          />
        )}
      </div>

      {/* Footer */}
      <p className="text-center text-[10px] text-gray-300 pb-6">Thambola · Made with ♥</p>
    </div>
  )
}
