import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { isExpert, useSession } from '@/features/auth/model/session-store'
import { ThemeToggle } from '@/shared/ui/ThemeToggle'
import styles from './AppLayout.module.css'
import { HeaderSearch } from './HeaderSearch'
import { SiteFooter } from './SiteFooter'

/** A journal's chat belongs to the AI chat tab, even though its address sits under /journals. */
const CHAT_PATH = /^\/(chat|journals\/[^/]+\/chat)(\/|$)/

export function AppLayout() {
  const session = useSession((state) => state.session)
  const clear = useSession((state) => state.clear)
  const navigate = useNavigate()
  const location = useLocation()
  const inChat = CHAT_PATH.test(location.pathname)
  const inJournals = location.pathname.startsWith('/journals')

  return (
    <>
      <header className={styles.header}>
        <div className={styles.bar}>
          <Link to="/" className={styles.brand}>
            GrowPath
          </Link>
          <nav aria-label="Main" className={styles.tabs}>
            <NavLink to="/" end className={styles.tab}>
              Home
            </NavLink>
            <NavLink to="/shop" className={styles.tab}>
              Shop
            </NavLink>
            <Link to="/chat" className={styles.tab} aria-current={inChat ? 'page' : undefined}>
              AI chat
            </Link>
            <Link
              to="/journals"
              className={styles.tab}
              aria-current={inJournals && !inChat ? 'page' : undefined}
            >
              Journals
            </Link>
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
              <Link
                to="/login"
                state={{ from: location.pathname + location.search }}
                className={styles.signIn}
              >
                Sign in
              </Link>
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
