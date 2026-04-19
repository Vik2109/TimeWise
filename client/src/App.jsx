import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { Suspense, lazy } from 'react'
import { AuthProvider }  from './context/AuthContext'
import { NotifProvider } from './context/NotifContext'
import AppShell, { PrivateRoute, PublicRoute } from './components/layout/AppShell'
import { Spinner } from './components/common/UI'

const Login        = lazy(() => import('./pages/Login'))
const Register     = lazy(() => import('./pages/Register'))
const Dashboard    = lazy(() => import('./pages/Dashboard'))
const Tasks        = lazy(() => import('./pages/Tasks'))
const Calendar     = lazy(() => import('./pages/Calendar'))
const Pomodoro     = lazy(() => import('./pages/Pomodoro'))
const Habits       = lazy(() => import('./pages/Habits'))
const Analytics    = lazy(() => import('./pages/Analytics'))
const Notifications = lazy(() => import('./pages/Notifications'))
const Export       = lazy(() => import('./pages/Export'))
const Profile      = lazy(() => import('./pages/Profile'))
const ForgotPassword     = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword      = lazy(() => import('./pages/ResetPassword'))
const AuthCallback = lazy(() => import('./pages/AuthCallback'))

const Loader = () => (
  <div className="flex items-center justify-center h-[60vh]">
    <Spinner size={28} />
  </div>
)

export default function App() {
  return (
    <BrowserRouter
    future={{
    v7_startTransition: true,
    v7_relativeSplatPath: true,
  }}
    >
      <AuthProvider>
        <NotifProvider>
          <Suspense fallback={<Loader />}>
            <Routes>
              <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
              <Route path="/forgotPassword" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
              <Route path="/reset-password/:token" element={<PublicRoute><ResetPassword /></PublicRoute>} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/" element={<PrivateRoute><AppShell /></PrivateRoute>}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard"     element={<Dashboard />} />
                <Route path="tasks"         element={<Tasks />} />
                <Route path="calendar"      element={<Calendar />} />
                <Route path="pomodoro"      element={<Pomodoro />} />
                <Route path="habits"        element={<Habits />} />
                <Route path="analytics"     element={<Analytics />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="export"        element={<Export />} />
                <Route path="profile"       element={<Profile />} />
              </Route>
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>

          <Toaster
            position="top-right"
            toastOptions={{
              className: '',
              style: {
                background: '#1A1B22',
                color: '#F0F0F5',
                border: '1px solid rgba(255,255,255,0.12)',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '14px',
                borderRadius: '12px',
              },
              success: { iconTheme: { primary: '#2CC9A0', secondary: '#1A1B22' } },
              error:   { iconTheme: { primary: '#F06464', secondary: '#1A1B22' } },
            }}
          />
        </NotifProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
