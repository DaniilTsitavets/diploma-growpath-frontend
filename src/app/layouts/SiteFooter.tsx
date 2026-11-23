import { Link } from 'react-router'
import { useRole } from '@/features/auth/api/use-role'
import styles from './SiteFooter.module.css'

export function SiteFooter() {
  const { role, pending } = useRole()
  return (
    <footer className={styles.footer}>
      <div className={styles.grid}>
        <div>
          <Link to="/" className={styles.brand}>
            GrowPath
          </Link>
          <p className={styles.note}>
            A guided way to grow your first plants: starter packs, an AI assistant and a botanist.
          </p>
        </div>
        {!pending && role !== 'expert' && role !== 'admin' && (
          <nav aria-label="Explore">
            <p className="eyebrow">Explore</p>
            <ul className={styles.list}>
              <li>
                <Link to="/shop">Shop</Link>
              </li>
              <li>
                <Link to="/chat">AI chat</Link>
              </li>
              <li>
                <Link to="/journals">Journals</Link>
              </li>
            </ul>
          </nav>
        )}
        <div>
          <p className="eyebrow">Project</p>
          <ul className={styles.list}>
            <li>Diploma project</li>
            <li>European Humanities University</li>
            <li>
              <Link to="/credits">Credits</Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="eyebrow">Accessibility</p>
          <ul className={styles.list}>
            <li>Built to WCAG 2.1 AA</li>
            <li>Light and dark themes</li>
          </ul>
        </div>
      </div>
      <p className={styles.copy}>© 2026 GrowPath. Payments are simulated.</p>
    </footer>
  )
}
