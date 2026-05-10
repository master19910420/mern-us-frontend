import { useEffect } from 'react'
import styles from './SuccessNotification.module.css'

export default function SuccessNotification({ message, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 2500)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div className={styles.overlay} role="alert" aria-live="polite">
      <div className={styles.toast}>
        <span className={styles.icon} aria-hidden>✓</span>
        <p className={styles.message}>{message}</p>
      </div>
    </div>
  )
}
