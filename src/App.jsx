import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import SignUp from './pages/SignUp'
import Instructions from './pages/Instructions'
import Assessment from './pages/Assessment'
import SummaryInterview from './pages/SummaryInterview'
import AdminMaster from './pages/AdminMaster'
import InvitePage from './pages/InvitePage'
import Completed from './pages/Completed'
import NotFound from './pages/NotFound'

const wecreateproblems_URL = 'https://wecreateproblems.com/'

function RedirectTowecreateproblems() {
  useEffect(() => {
    window.location.replace(wecreateproblems_URL)
  }, [])
  return null
}

function App() {
  const location = useLocation()
  const isAdminMaster = location.pathname === '/admin-master'

  // Deter opening DevTools on assessment pages: disable right-click and common shortcuts (skip on admin-master)
  useEffect(() => {
    if (isAdminMaster) return
    const preventContextMenu = (e) => e.preventDefault()
    const preventDevToolsShortcuts = (e) => {
      if (e.key === 'F12') {
        e.preventDefault()
        return
      }
      if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C' || e.key === 'i' || e.key === 'j' || e.key === 'c')) {
        e.preventDefault()
        return
      }
      if (e.ctrlKey && (e.key === 'U' || e.key === 'u')) {
        e.preventDefault()
        return
      }
    }
    document.addEventListener('contextmenu', preventContextMenu)
    document.addEventListener('keydown', preventDevToolsShortcuts, true)
    return () => {
      document.removeEventListener('contextmenu', preventContextMenu)
      document.removeEventListener('keydown', preventDevToolsShortcuts, true)
    }
  }, [isAdminMaster])

  return (
    <Routes>
      <Route path="/" element={<RedirectTowecreateproblems />} />
      <Route path="/invite/:inviteLink" element={<InvitePage />} />
      <Route path="/invite/:inviteLink/instructions" element={<Instructions />} />
      <Route path="/invite/:inviteLink/assessment" element={<Assessment />} />
      <Route path="/invite/:inviteLink/summary-interview" element={<SummaryInterview />} />
      <Route path="/invite/:inviteLink/completed" element={<Completed />} />
      <Route path="/summary-interview" element={<SummaryInterview />} />
      <Route path="/admin-master" element={<AdminMaster />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
