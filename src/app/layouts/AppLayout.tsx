import { NavLink, Outlet, useNavigate } from 'react-router'
import { isExpert, useSession } from '@/features/auth/model/session-store'
import { ThemeToggle } from '@/shared/ui/ThemeToggle'
import styles from './AppLayout.module.css'

export function AppLayout() {
  const session = useSession((state) => state.session)
  const clear = useSession((state) => state.clear)
  const navigate = useNavigate()

  return (
    <>
      <header className={styles.header}>
        <div className={styles.bar}>
          <NavLink to="/" className={styles.brand}>
            GrowPath
          </NavLink>
          {session && (
            <nav aria-label="Main" className={styles.nav}>
              <NavLink to="/catalog" className={styles.link}>
                Catalog
              </NavLink>
              <NavLink to="/journals" className={styles.link}>
                Journals
              </NavLink>
              {isExpert(session) && (
                <NavLink to="/expert/tickets" className={styles.link}>
                  Expert tickets
                </NavLink>
              )}
            </nav>
          )}
          <div className={styles.user}>
            {session?.email && <span className={styles.email}>{session.email}</span>}
            <ThemeToggle />
            {session && (
              <button
                type="button"
                className={styles.signOut}
                onClick={() => {
                  clear()
                  void navigate('/login')
                }}
              >
                Sign out
              </button>
            )}
          </div>
        </div>
      </header>
      <main id="main" className={styles.main}>
        <Outlet />
      </main>
    </>
  )
}
