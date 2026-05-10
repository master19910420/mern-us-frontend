import styles from './Completed.module.css'

export default function Completed() {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.iconWrap} aria-hidden>
          <span className={styles.icon}>✓</span>
        </div>
        <h1 className={styles.title}>Thank you</h1>
        <p className={styles.message}>
          Thanks for your time and for taking this assessment. We appreciate you completing the process.
        </p>
      </div>
    </div>
  )
}
