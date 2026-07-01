import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home         from './pages/Home'
import QuickGame   from './pages/QuickGame'
import PrintTickets from './pages/PrintTickets'
import SignIn       from './pages/SignIn'
import GameSetup    from './pages/GameSetup'
import FullGame     from './pages/FullGame'
import GameSummary  from './pages/GameSummary'
import History      from './pages/History'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"             element={<Home />} />
        <Route path="/quick-game"   element={<QuickGame />} />
        <Route path="/print"        element={<PrintTickets />} />
        <Route path="/sign-in"      element={<SignIn />} />
        <Route path="/game-setup"   element={<GameSetup />} />
        <Route path="/full-game"    element={<FullGame />} />
        <Route path="/game-summary" element={<GameSummary />} />
        <Route path="/history"      element={<History />} />
      </Routes>
    </BrowserRouter>
  )
}
