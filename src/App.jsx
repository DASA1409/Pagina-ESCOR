import { useEffect, useState } from 'react'
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
import PremiumBookingModal from './components/PremiumBookingModal.jsx'
import Footer from './components/Footer.jsx'
import PageBackground from './components/effects/PageBackground.jsx'
import './App.css'
import LoginModal from './components/LoginModal.jsx'
import AdminVehiclePanel from './components/AdminVehiclePanel.jsx'
import { getCurrentUser, logout } from './services/authService.js'

function App() {
  const [path, setPath] = useState(window.location.pathname)
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [chatOpen, setChatOpen] = useState(false)
  const [advisorMode, setAdvisorMode] = useState(null)
  const [bookingOpen, setBookingOpen] = useState(false)
  const [user, setUser] = useState(null)
  const [adminOpen, setAdminOpen] = useState(false)

  useEffect(() => {
    getCurrentUser().then((data) => setUser(data.user)).catch(() => setUser(null))
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

  if (path === '/login') {
    return <LoginModal onClose={() => navigate('/')} onLogin={(nextUser) => { setUser(nextUser); navigate('/') }} />
  }

  return (
    <VehicleCatalogProvider>
      <PageBackground />
      <Navbar
        user={user}
        onLogin={() => navigate('/login')}
        onLogout={async () => { await logout(); setUser(null) }}
        onOpenAdmin={() => setAdminOpen(true)}
      />
      <main>
        <Hero />
        <SmartSearchPanel />
        <CollectorShowcase onOpenVehicle={setSelectedVehicle} />
        <FeaturedVehicles onOpenVehicle={setSelectedVehicle} />
        <VehicleGrid onOpenVehicle={setSelectedVehicle} />
        <Comparator />
        <Services />
        <CtaBanner onOpenChat={() => setChatOpen(true)} onOpenBooking={() => setBookingOpen(true)} />
      </main>
      <Footer />

      <VehicleDetailPage
        vehicle={selectedVehicle}
        onClose={() => setSelectedVehicle(null)}
        advisorMode={advisorMode}
        onActivateAdvisor={() => setAdvisorMode(true)}
        onOpenChat={() => setChatOpen(true)}
        onOpenBooking={() => setBookingOpen(true)}
      />
      <PremiumBookingModal
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        prefillVehicle={selectedVehicle}
      />
      <ChatDrawer
        currentVehicle={selectedVehicle}
        open={chatOpen}
        onOpenChange={setChatOpen}
        advisorMode={advisorMode}
        onAdvisorChange={setAdvisorMode}
      />
      <AdminVehiclePanel
        open={adminOpen}
        onClose={() => setAdminOpen(false)}
      />
    </VehicleCatalogProvider>
  )
}

export default App
