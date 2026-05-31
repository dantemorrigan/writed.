import { Link } from 'react-router-dom'
import styles from './Logo.module.css'

export function Logo({ size = 'md' }) {
  return (
    <Link to="/" className={`${styles.logo} ${styles[size]}`}>
      Writed<span className={styles.dot}>.</span>
    </Link>
  )
}
