import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { PageLoading } from '../components/common/UI'

export default function AuthCallback() {
  const { loginWithToken } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')

    if (token) {
      loginWithToken(token)
        .then(() => navigate('/dashboard'))
        .catch(() => navigate('/login?error=google'))
    } else {
      navigate('/login?error=google')
    }
  }, [])

  return <PageLoading text="Signing you in..." />
}