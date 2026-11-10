import { lazy, Suspense, useEffect, useState } from 'react'
import { VehicleCatalogProvider } from './context/VehicleCatalogContext.jsx'
import Navbar from './components/Navbar.jsx'
import Hero from './components/Hero.jsx'
import SmartSearchPanel from './components/SmartSearchPanel.jsx'
import CollectorShowcase from './components/CollectorShowcase.jsx'
import FeaturedVehicles from './components/FeaturedVehicles.jsx'
import VehicleGrid from './components/VehicleGrid.jsx'
import VehicleDetailPage from './components/VehicleDetailPage.jsx'
import Comparator from './components/Comparator.jsx'
import Services from './components/Services.jsx'
import CtaBanner from './components/CtaBanner.jsx'
import ChatDrawer from './components/ChatDrawer.jsx'
import UsabilitySurveyModal from './components/UsabilitySurveyModal.jsx'
import Footer from './components/Footer.jsx'
import PageBackground from './components/effects/PageBackground.jsx'
import './App.css'
import LoginModal from './components/LoginModal.jsx'
import AdminVehiclePanel from './components/AdminVehiclePanel.jsx'
import { getCurrentUser, logout } from './services/authService.js'
import { recordUsabilityEvent } from './services/usabilityService.js'

const AdminUsabilityDashboard = lazy(() => import('./components/AdminUsabilityDashboard.jsx'))

function App() {
  const [path, setPath] = useState(window.location.pathname)
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [chatOpen, setChatOpen] = useState(false)
  const [advisorMode, setAdvisorMode] = useState(null)
  const [surveyOpen, setSurveyOpen] = useState(false)
  const [user, setUser] = useState(null)
  const [adminOpen, setAdminOpen] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    getCurrentUser()
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setAuthChecked(true))
  }, [])

  useEffect(() => {
    if (window.location.pathname === '/admin/usability') return
    recordUsabilityEvent('session_started')
  }, [])

  useEffect(() => {
    const handlePopState = () => setPath(window.location.pathname)
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  function navigate(nextPath) {
    window.history.pushState({}, '', nextPath)
    setPath(nextPath)
  }

  function openVehicle(vehicle) {
    recordUsabilityEvent('vehicle_selected')
    setSelectedVehicle(vehicle)
  }

  function openUsabilitySurvey() {
    recordUsabilityEvent('usability_survey_opened')
    setSurveyOpen(true)
  }

  if (path === '/admin/usability') {
    if (!authChecked) {
      return <main className="usability-dashboard__notice">Verificando acceso administrativo…</main>
    }

    if (user?.role !== 'admin') {
      return (
        <main className="admin-access">
          <span className="label label--gold">ESCOR · Administración</span>
          <h1>Acceso restringido</h1>
          <p>Inicia sesión con una cuenta administradora para consultar los resultados de usabilidad.</p>
          <div>
            <button type="button" className="btn btn-primary" onClick={() => navigate('/login')}>Iniciar sesión</button>
            <button type="button" className="btn btn-outline" onClick={() => navigate('/')}>Volver al catálogo</button>
          </div>
        </main>
      )
    }

    return (
      <Suspense fallback={<main className="usability-dashboard__notice">Cargando dashboard…</main>}>
        <AdminUsabilityDashboard
          user={user}
          onBack={() => navigate('/')}
          onLogin={() => navigate('/login')}
          onLogout={async () => {
            await logout()
            setUser(null)
            navigate('/')
          }}
        />
      </Suspense>
    )
  }

  if (path === '/login' || path === '/register') {
    return (
      <LoginModal
        mode={path === '/register' ? 'register' : 'login'}
        onModeChange={(mode) => navigate(mode === 'register' ? '/register' : '/login')}
        onClose={() => navigate('/')}
        onLogin={setUser}
      />
    )
  }

  return (
    <VehicleCatalogProvider>
      <PageBackground />
      <Navbar
        user={user}
        onLogin={() => navigate('/login')}
        onRegister={() => navigate('/register')}
        onLogout={async () => { await logout(); setUser(null) }}
        onOpenAdmin={() => setAdminOpen(true)}
        onOpenUsabilityDashboard={() => navigate('/admin/usability')}
      />
      <main>
        <Hero />
        <SmartSearchPanel />
        <CollectorShowcase onOpenVehicle={openVehicle} />
        <FeaturedVehicles onOpenVehicle={openVehicle} />
        <VehicleGrid onOpenVehicle={openVehicle} />
        <Comparator />
        <Services />
        <CtaBanner onOpenChat={() => setChatOpen(true)} onOpenUsabilitySurvey={openUsabilitySurvey} />
      </main>
      <Footer />

      <VehicleDetailPage
        vehicle={selectedVehicle}
        onClose={() => setSelectedVehicle(null)}
        advisorMode={advisorMode}
        onActivateAdvisor={() => setAdvisorMode(true)}
        onOpenChat={() => setChatOpen(true)}
        onOpenUsabilitySurvey={openUsabilitySurvey}
      />
      <UsabilitySurveyModal
        open={surveyOpen}
        onClose={() => setSurveyOpen(false)}
      />
      <ChatDrawer
        currentVehicle={selectedVehicle}
        open={chatOpen}
        onOpenChange={setChatOpen}
        advisorMode={advisorMode}
        onAdvisorChange={setAdvisorMode}
        onOpenVehicle={openVehicle}
      />
      <AdminVehiclePanel
        open={adminOpen}
        onClose={() => setAdminOpen(false)}
      />
    </VehicleCatalogProvider>
  )
}

export default App
