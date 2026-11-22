import { Outlet } from 'react-router'
import styles from './FocusLayout.module.css'

/** For pages that are a single window, such as sign-in: no header, no footer. */
export function FocusLayout() {
  return (
    <main id="main" className={styles.page}>
      <Outlet />
    </main>
  )
}
