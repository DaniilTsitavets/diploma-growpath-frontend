import { Link, Navigate, Outlet, useLocation } from 'react-router'
import { Skeleton } from '@/shared/ui/Skeleton'
import { useRole } from '../api/use-role'
import { homePath, type Role } from '../model/role'
import { useSession } from '../model/session-store'

export function RequireAuth() {
  const session = useSession((state) => state.session)
  const location = useLocation()
  if (!session)
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  return <Outlet />
}

function RoleLoading() {
  return (
    <div aria-busy="true">
      <p className="visually-hidden" role="status">
        Loading your account
      </p>
      <Skeleton height="title" width={40} />
    </div>
  )
}

function NoAccess({ children }: { children: React.ReactNode }) {
  return (
    <>
      <h1>No access</h1>
      <p>{children}</p>
    </>
  )
}

/** Shown only to the given role. The backend answers 403 to everyone else as well. */
function RequireRole({ role, who }: { role: Role; who: string }) {
  const state = useRole()
  if (state.pending) return <RoleLoading />
  if (state.role !== role) return <NoAccess>This area is only for {who}.</NoAccess>
  return <Outlet />
}

export const RequireExpert = () => <RequireRole role="expert" who="experts" />
export const RequireAdmin = () => <RequireRole role="admin" who="administrators" />

/** Experts and administrators have no shop, chat or journals. A visitor passes: the shop is open to read. */
export function RequireCustomer() {
  const { role, pending } = useRole()
  const location = useLocation()
  if (pending) return <RoleLoading />
  if (role === 'expert' || role === 'admin') {
    if (location.pathname === '/') return <Navigate to={homePath(role)} replace />
    return (
      <NoAccess>
        {role === 'expert'
          ? 'Experts work from the ticket queue. '
          : 'Administrators manage users. '}
        <Link to={homePath(role)}>{role === 'expert' ? 'Open the tickets' : 'Open the users'}</Link>
      </NoAccess>
    )
  }
  return <Outlet />
}
