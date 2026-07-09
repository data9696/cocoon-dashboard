import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { DataProvider, useData } from './lib/DataContext'
import { AuthProvider, useAuth } from './lib/AuthContext'
import { Sidebar } from './components/Sidebar'
import { LoadingScreen } from './components/LoadingScreen'
import { Login } from './pages/Login'
import { Signup } from './pages/Signup'
import { PendingApproval } from './pages/PendingApproval'
import { AdminPage } from './pages/AdminPage'
import { Home } from './pages/Home'
import { SalesOverview } from './pages/SalesOverview'
import { ChannelBrand } from './pages/ChannelBrand'
import { ProductAnalysis } from './pages/ProductAnalysis'
import { Inventory } from './pages/Inventory'
import { InsightsPage } from './pages/InsightsPage'

function AppShell() {
  const { loading } = useData()

  if (loading) return <LoadingScreen />

  return (
    <div className="flex min-h-screen bg-[var(--color-cream)]">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-x-hidden">
        <Routes>
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/" element={<Home />} />
          <Route path="/overview" element={<SalesOverview />} />
          <Route path="/channel-brand" element={<ChannelBrand />} />
          <Route path="/products" element={<ProductAnalysis />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/insights" element={<InsightsPage />} />
        </Routes>
      </main>
    </div>
  )
}

function AuthGate() {
  const { session, profile, loading } = useAuth()
  const [authView, setAuthView] = useState<'login' | 'signup'>('login')

  if (loading) return <LoadingScreen />

  if (!session) {
    return authView === 'login' ? (
      <Login onSwitchToSignup={() => setAuthView('signup')} />
    ) : (
      <Signup onSwitchToLogin={() => setAuthView('login')} />
    )
  }

  if (!profile || profile.status !== 'approved') {
    return <PendingApproval />
  }

  return (
    <DataProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </DataProvider>
  )
}

function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  )
}

export default App