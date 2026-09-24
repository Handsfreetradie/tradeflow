import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth, type Role } from '@/lib/auth/AuthProvider'

export function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const { session, role: currentRole, loading } = useAuth()
  const location = useLocation()

  if (loading) return null
  if (!session) return <Navigate to="/auth/login" state={{ from: location.pathname }} replace />
  if (currentRole !== role) return <Navigate to={currentRole === 'employee' ? '/field' : '/'} replace />
  return <>{children}</>
}
