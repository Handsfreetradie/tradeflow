import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth, type Role } from '@/lib/auth/AuthProvider'
import { useActiveBusiness } from '@/lib/auth/ActiveBusinessProvider'
import ChooseBusiness from '@/pages/auth/ChooseBusiness'

// The role comes from the person's membership in the business they're currently working in,
// not from their login — one login can be an owner in one business and an employee in another.
export function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const { session, loading: authLoading } = useAuth()
  const { activeRole, memberships, needsChoice, loading } = useActiveBusiness()
  const location = useLocation()

  if (authLoading || loading) return null
  if (!session) return <Navigate to="/auth/login" state={{ from: location.pathname }} replace />
  if (memberships.length === 0) return <ChooseBusiness />
  if (needsChoice) return <ChooseBusiness />
  if (activeRole !== role) return <Navigate to={activeRole === 'employee' ? '/field' : '/'} replace />
  return <>{children}</>
}
