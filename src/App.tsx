import { useState, type ReactNode } from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Home from './pages/Home'
import BookingChoice from './pages/BookingChoice'
import BookingMeeting from './pages/BookingMeeting'
import MyBookings from './pages/MyBookings'
import Layout from './components/Layout'
import AdminLayout from './components/AdminLayout'
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminSlots from './pages/admin/AdminSlots'
import AdminBookings from './pages/admin/AdminBookings'
import AdminBookingDetail from './pages/admin/AdminBookingDetail'
import AdminClients from './pages/admin/AdminClients'
import AdminClientDetail from './pages/admin/AdminClientDetail'
import AdminWhatsApp from './pages/admin/AdminWhatsApp'
import AdminSettings from './pages/admin/AdminSettings'
import IntroAnimation from './components/IntroAnimation'
import { useAuthContext } from './contexts'

// Componente de rota protegida
function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthContext()
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="text-gold animate-pulse">Carregando...</div>
      </div>
    )
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/admin" replace />
  }
  
  return <>{children}</>
}

// Componente de rotas unificado
function AppRoutes() {
  return (
    <AnimatePresence mode="wait">
      <Routes>
        {/* Rotas públicas */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="agendar" element={<BookingChoice />} />
          <Route path="agendar/reuniao" element={<BookingMeeting />} />
          <Route path="consultar-historico" element={<Navigate to="/meus-agendamentos" replace />} />
          <Route path="meus-agendamentos" element={<MyBookings />} />
        </Route>
        
        {/* Rotas administrativas */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminLogin />} />
          <Route path="dashboard" element={
            <ProtectedRoute><AdminDashboard /></ProtectedRoute>
          } />
          <Route path="vagas" element={
            <ProtectedRoute><AdminSlots /></ProtectedRoute>
          } />
          <Route path="agendamentos" element={
            <ProtectedRoute><AdminBookings /></ProtectedRoute>
          } />
          <Route path="agendamentos/:id" element={
            <ProtectedRoute><AdminBookingDetail /></ProtectedRoute>
          } />
          <Route path="clientes" element={
            <ProtectedRoute><AdminClients /></ProtectedRoute>
          } />
          <Route path="clientes/:id" element={
            <ProtectedRoute><AdminClientDetail /></ProtectedRoute>
          } />
          <Route path="whatsapp" element={
            <ProtectedRoute><AdminWhatsApp /></ProtectedRoute>
          } />
          <Route path="configuracoes" element={
            <ProtectedRoute><AdminSettings /></ProtectedRoute>
          } />
        </Route>
      </Routes>
    </AnimatePresence>
  )
}

function App() {
  const [introComplete, setIntroComplete] = useState(false)
  const location = useLocation()
  
  // Intro apenas na home
  const showIntro = location.pathname === '/' && !introComplete

  if (showIntro) {
    return (
      <IntroAnimation onComplete={() => setIntroComplete(true)}>
        <AppRoutes />
      </IntroAnimation>
    )
  }

  return <AppRoutes />
}

export default App
