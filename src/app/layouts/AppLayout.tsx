import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { isExpert, useSession } from '@/features/auth/model/session-store'
import { ThemeToggle } from '@/shared/ui/ThemeToggle'
import styles from './AppLayout.module.css'
import { HeaderSearch } from './HeaderSearch'
import { SiteFooter } from './SiteFooter'

export function AppLayout() {
  const session = useSession((state) => state.session)
  const clear = useSession((state) => state.clear)
  const navigate = useNavigate()
  const location = useLocation()
  const onLoginPage = location.pathname === '/login'

  return (
    <>
      <header className={styles.header}>
        <div className={styles.bar}>
          <Link to="/" className={styles.brand}>
            GrowPath
          </Link>
          <nav aria-label="Main" className={styles.tabs}>
            <NavLink to="/shop" className={styles.tab}>
              Shop
            </NavLink>
            <NavLink to="/chat" className={styles.tab}>
              AI chat
            </NavLink>
            <NavLink to="/journals" className={styles.tab}>
              Journals
            </NavLink>
            {isExpert(session) && (
              <NavLink to="/expert/tickets" className={styles.tab}>
                Expert tickets
              </NavLink>
            )}
          </nav>
          <HeaderSearch />
          <div className={styles.actions}>
            <ThemeToggle />
            {session ? (
              <button
                type="button"
                className={styles.signOut}
                onClick={() => {
                  clear()
                  void navigate('/')
                }}
              >
                Sign out
              </button>
            ) : (
              !onLoginPage && (
                <Link
                  to="/login"
                  state={{ from: location.pathname + location.search }}
                  className={styles.signIn}
                >
                  Sign in
                </Link>
              )
            )}
          </div>
        </div>
      </header>
      <main id="main" className={styles.main}>
        <Outlet />
      </main>
      <SiteFooter />
    </>
  )
}
