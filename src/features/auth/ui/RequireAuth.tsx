import { Navigate, Outlet, useLocation } from 'react-router'
import { isExpert, useSession } from '../model/session-store'

export function RequireAuth() {
  const session = useSession((state) => state.session)
  const location = useLocation()
  if (!session)
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  return <Outlet />
}

export function RequireExpert() {
  const session = useSession((state) => state.session)
  if (!isExpert(session)) {
    return (
      <>
        <h1>No access</h1>
        <p>This area is only for experts.</p>
      </>
    )
  }
  return <Outlet />
}
