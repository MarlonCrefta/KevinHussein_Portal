import { useState, lazy, Suspense, type ReactNode } from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Layout from './components/Layout'
import AdminLayout from './components/AdminLayout'
import IntroAnimation from './components/IntroAnimation'
import ErrorBoundary from './components/ErrorBoundary'
import { useAuthContext } from './contexts'

// Lazy loading — cada página é carregada sob demanda (code splitting)
const Home = lazy(() => import('./pages/Home'))
const BookingChoice = lazy(() => import('./pages/BookingChoice'))
const BookingMeeting = lazy(() => import('./pages/BookingMeeting'))
const MyBookings = lazy(() => import('./pages/MyBookings'))
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminSlots = lazy(() => import('./pages/admin/AdminSlots'))
const AdminBookings = lazy(() => import('./pages/admin/AdminBookings'))
const AdminBookingDetail = lazy(() => import('./pages/admin/AdminBookingDetail'))
const AdminClients = lazy(() => import('./pages/admin/AdminClients'))
const AdminClientDetail = lazy(() => import('./pages/admin/AdminClientDetail'))
const AdminWhatsApp = lazy(() => import('./pages/admin/AdminWhatsApp'))
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'))

// Loading fallback mínimo (exibido enquanto chunk carrega)
function PageLoader() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
    </div>
  )
}

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
    <Suspense fallback={<PageLoader />}>
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
    </Suspense>
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

  return (
    <ErrorBoundary>
      <AppRoutes />
    </ErrorBoundary>
  )
}

export default App
