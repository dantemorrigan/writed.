import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { getUser } from './db'
import { Onboarding } from './routes/Onboarding'
import { Dashboard } from './routes/Dashboard'
import { ProjectView } from './routes/ProjectView'
import { Editor } from './routes/Editor'
import { Profile } from './routes/Profile'

function RequireUser({ children }) {
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    getUser().then((u) => setStatus(u ? 'ok' : 'none'))
  }, [])

  if (status === 'loading') return null
  if (status === 'none') return <Navigate to="/onboarding" replace />
  return children
}

export default function App() {
  // Apply stored theme on mount
  useEffect(() => {
    getUser().then((u) => {
      if (u?.theme) document.body.setAttribute('data-theme', u.theme)
    })
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/" element={<RequireUser><Dashboard /></RequireUser>} />
        <Route path="/project/:id" element={<RequireUser><ProjectView /></RequireUser>} />
        <Route path="/editor/:id" element={<RequireUser><Editor /></RequireUser>} />
        <Route path="/profile" element={<RequireUser><Profile /></RequireUser>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
