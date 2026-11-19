import { NavLink, Outlet } from 'react-router'
import styles from './AppLayout.module.css'

export function AppLayout() {
  return (
    <>
      <header className={styles.header}>
        <NavLink to="/" className={styles.brand}>
          GrowPath
        </NavLink>
        <nav aria-label="Main" className={styles.nav}>
          <NavLink to="/catalog" className={styles.link}>
            Catalog
          </NavLink>
          <NavLink to="/journals" className={styles.link}>
            Journals
          </NavLink>
        </nav>
      </header>
      <main id="main" className={styles.main}>
        <Outlet />
      </main>
    </>
  )
}
