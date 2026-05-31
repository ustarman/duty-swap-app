import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Screen1 from './pages/Screen1'
import Screen2 from './pages/Screen2'
import Screen3 from './pages/Screen3'
import Screen4 from './pages/Screen4'
import Admin from './pages/Admin'

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <div style={{ minHeight: '100svh', background: 'var(--app-bg)', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 390, minHeight: '100svh', background: 'var(--app-bg)', display: 'flex', flexDirection: 'column' }}>
          <Routes>
            <Route path="/" element={<Navigate to="/screen1" replace />} />
            <Route path="/screen1" element={<Screen1 />} />
            <Route path="/screen2" element={<Screen2 />} />
            <Route path="/screen3" element={<Screen3 />} />
            <Route path="/screen4" element={<Screen4 />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  )
}
