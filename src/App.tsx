import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { DataProvider, useData } from './lib/DataContext'
import { Sidebar } from './components/Sidebar'
import { LoadingScreen } from './components/LoadingScreen'
import { Home } from './pages/Home'
import { SalesOverview } from './pages/SalesOverview'
import { ChannelBrand } from './pages/ChannelBrand'
import { ProductAnalysis } from './pages/ProductAnalysis'

function AppShell() {
  const { loading } = useData()

  if (loading) return <LoadingScreen />

  return (
    <div className="flex min-h-screen bg-[var(--color-cream)]">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-x-hidden">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/overview" element={<SalesOverview />} />
          <Route path="/channel-brand" element={<ChannelBrand />} />
          <Route path="/products" element={<ProductAnalysis />} />
        </Routes>
      </main>
    </div>
  )
}

function App() {
  return (
    <DataProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </DataProvider>
  )
}

export default App