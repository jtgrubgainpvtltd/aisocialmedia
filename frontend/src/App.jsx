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
import NotFoundPage from './pages/NotFoundPage'
import AppLoader from './components/ui/AppLoader'

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  
  if (loading) {
    return <AppLoader title="Preparing your dashboard" subtitle="Syncing your restaurant workspace…" />
  }
  
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

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
          <Route path="/"          element={<Landing />} />
          <Route path="/login"     element={<LoginChoice />} />
          <Route path="/login/restaurant" element={<RestaurantLogin />} />
          <Route path="/register"  element={<PartnerRegister />} />

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
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
