import { Link } from 'react-router'
import { Icon, type IconName } from '@/shared/ui/Icon'
import styles from './ActionLink.module.css'

interface ActionLinkProps {
  to: string
  icon: IconName
  title: string
  description: string
}

/** A large, obvious next step: a link that reads as a button with a reason. */
export function ActionLink({ to, icon, title, description }: ActionLinkProps) {
  return (
    <Link to={to} className={styles.action}>
      <span className={styles.icon}>
        <Icon name={icon} size={24} />
      </span>
      <span className={styles.text}>
        <strong>{title}</strong>
        <span>{description}</span>
      </span>
      <Icon name="arrow" className={styles.arrow} />
    </Link>
  )
}
