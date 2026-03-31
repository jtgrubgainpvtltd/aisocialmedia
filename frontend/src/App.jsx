import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './context/AuthContext'
import Landing from './pages/Landing'
import LoginChoice from './pages/LoginChoice'
import RestaurantLogin from './pages/RestaurantLogin'
import PartnerRegister from './pages/PartnerRegister'
import DashboardShell from './pages/DashboardShell'
import OverviewDashboard from './pages/dashboard/OverviewDashboard'
import RestaurantProfile from './pages/dashboard/RestaurantProfile'
import ContentStudio from './pages/dashboard/ContentStudio'
import CityFeed from './pages/dashboard/CityFeed'
import SchedulerPage from './pages/dashboard/SchedulerPage'
import AnalyticsPage from './pages/dashboard/AnalyticsPage'
import HistoryPage from './pages/dashboard/HistoryPage'
import IntegrationsPage from './pages/dashboard/IntegrationsPage'
import ReplyQueuePage from './pages/dashboard/ReplyQueuePage'

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#F7F3EC' }}>
        <div style={{ textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>
          <div className="spinner" style={{ border: '4px solid #E2E8F0', borderTop: '4px solid #FF503C', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <p style={{ color: '#475569', fontWeight: 500 }}>Loading...</p>
        </div>
      </div>
    )
  }
  
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

// Configure a global QueryClient:
// - staleTime: 30s (data considered fresh for 30s, no refetch on tab focus)
// - retry: 2 automatic retries on failed queries
// - refetchOnWindowFocus: false (prevents noisy background refetches)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/"          element={<Landing />} />
          <Route path="/login"     element={<LoginChoice />} />
          <Route path="/login/restaurant" element={<RestaurantLogin />} />
          <Route path="/register"  element={<PartnerRegister />} />

          {/* Protected dashboard routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardShell />
              </ProtectedRoute>
            }
          >
            <Route index element={<OverviewDashboard />} />
            <Route path="profile"      element={<RestaurantProfile />} />
            <Route path="studio"       element={<ContentStudio />} />
            <Route path="city-feed"    element={<CityFeed />} />
            <Route path="scheduler"    element={<SchedulerPage />} />
            <Route path="analytics"    element={<AnalyticsPage />} />
            <Route path="history"      element={<HistoryPage />} />
            <Route path="replies"      element={<ReplyQueuePage />} />
            <Route path="integrations" element={<IntegrationsPage />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
