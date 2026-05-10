import { useState, useEffect } from 'react'
import AdminMaster from './AdminMaster'
import { masterLogin, setStoredMasterToken, clearStoredMasterToken, getStoredMasterToken } from '../api/invites'
import styles from './AdminMaster.module.css'

export default function MasterAdminRoute() {
  const [token, setToken] = useState(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState(null)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    setToken(getStoredMasterToken())
    setChecking(false)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErr(null)
    setLoading(true)
    try {
      const t = await masterLogin(username, password)
      setStoredMasterToken(t)
      setToken(t)
    } catch (e) {
      setErr(e.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    clearStoredMasterToken()
    setToken(null)
    setPassword('')
  }

  if (checking) {
    return (
      <div className={styles.page}>
        <div className={styles.wrapper}>
          <p className={styles.muted}>Loading…</p>
        </div>
      </div>
    )
  }

  if (!token) {
    return (
      <div className={styles.page}>
        <div className={styles.wrapper} style={{ maxWidth: 420 }}>
          <header className={styles.header}>
            <h1 className={styles.title}>Admin sign-in</h1>
            <p className={styles.subtitle}>Enter master credentials to manage invite links.</p>
          </header>
          <form
            onSubmit={handleSubmit}
            className={styles.addBlock}
            style={{ flexDirection: 'column', alignItems: 'stretch' }}
          >
            {err ? (
              <div className={styles.error} role="alert">
                {err}
              </div>
            ) : null}
            <label className={styles.addTypeLabel} style={{ width: '100%' }}>
              Username
              <input
                type="text"
                className={styles.input}
                style={{ width: '100%', marginTop: 6 }}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </label>
            <label className={styles.addTypeLabel} style={{ width: '100%' }}>
              Password
              <input
                type="password"
                className={styles.input}
                style={{ width: '100%', marginTop: 6 }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </label>
            <button type="submit" className={styles.btnPrimary} disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return <AdminMaster onLogout={handleLogout} />
}
