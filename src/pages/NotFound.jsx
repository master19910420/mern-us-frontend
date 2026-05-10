import styles from './NotFound.module.css'

export default function NotFound() {
  return (
    <div className={styles.page}>
      <span className={styles.code} aria-hidden>404</span>
      <h1 className={styles.title}>Page not found</h1>
      <p className={styles.message}>
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
    </div>
  )
}
