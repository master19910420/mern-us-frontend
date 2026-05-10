import { useState, useEffect } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { getInviteByLink } from '../api/invites'
import { clearClientStateForInviteReset } from '../utils/inviteClientReset'
import SignUp from './SignUp'
import styles from './InvitePage.module.css'

export default function InvitePage() {
  const { inviteLink } = useParams()
  const [invite, setInvite] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!inviteLink) {
      setError('Invalid invite link')
      setLoading(false)
      return
    }
    let cancelled = false
    getInviteByLink(inviteLink)
      .then((data) => {
        if (!cancelled) {
          if ([3, 4, 5].includes(Number(data.connections_status))) {
            setError('This invite link has expired.')
            setInvite(null)
            try {
              if (localStorage.getItem('assessment_started_invite') === inviteLink) {
                localStorage.removeItem('assessment_started_invite')
              }
            } catch (_) {}
          } else {
            if (Number(data.connections_status) === 0) {
              clearClientStateForInviteReset(inviteLink)
            }
            setInvite(data)
            setError(null)
            try {
              sessionStorage.setItem('invite_link', inviteLink)
              sessionStorage.setItem('invite_connections_status', String(data.connections_status))
            } catch (_) {}
          }
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e.message?.includes('not found') ? 'Invalid or expired invite link' : e.message)
          setInvite(null)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [inviteLink])

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.center}>
          <p className={styles.muted}>Loading invite…</p>
        </div>
      </div>
    )
  }

  if (error || !invite) {
    const isExpired = error === 'This invite link has expired.'
    return (
      <div className={styles.page} data-expired={isExpired || undefined}>
        <div className={[styles.errorCard, isExpired && styles.errorCardExpired].filter(Boolean).join(' ')}>
          <div className={[styles.errorIconWrap, isExpired && styles.errorIconWrapExpired].filter(Boolean).join(' ')} aria-hidden>
            {isExpired ? (
              <svg className={styles.errorIconSvg} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <path d="M12 2L4 8v8l8 6 8-6V8L12 2z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" fill="none" />
              </svg>
            ) : (
              <span className={styles.errorIcon}>⚠</span>
            )}
          </div>
          <h1 className={styles.errorTitle}>
            {isExpired ? 'Link expired' : 'Invalid link'}
          </h1>
          <p className={[styles.errorMessage, isExpired && styles.errorMessageExpired].filter(Boolean).join(' ')}>
            {error || 'Invalid invite link'}
          </p>
          {isExpired ? (
            <div className={styles.errorHintBlock}>
              <p className={styles.errorHint}>This assessment has already been completed.</p>
              <p className={styles.errorHint}>If you believe this is an error, please contact the sender.</p>
            </div>
          ) : (
            <p className={styles.errorHint}>
              This link may be incorrect or no longer valid. Please check the URL or request a new invite.
            </p>
          )}
        </div>
      </div>
    )
  }

  // User already finished questionnaire for this invite: go to summary interview
  try {
    if (inviteLink && localStorage.getItem('assessment_completed_invite') === inviteLink) {
      return <Navigate to={`/invite/${inviteLink}/summary-interview`} replace />
    }
  } catch (_) {}

  const statusNum = Number(invite.connections_status)

  // Same browser that started the assessment: redirect to assessment only if invite is not completed.
  const sameBrowserStarted =
    inviteLink &&
    typeof window !== 'undefined' &&
    (sessionStorage.getItem('assessment_started') === 'true' || localStorage.getItem('assessment_started_invite') === inviteLink)
  if (sameBrowserStarted && ![3, 4, 5, 6].includes(statusNum)) {
    return <Navigate to={`/invite/${inviteLink}/assessment`} replace />
  }

  // Assessment was started in another browser/device — show message (same browser would have redirected above).
  // Use connections_status === 1 or assessment_started_at so we show the warning even if PATCH was slow (e.g. on Vercel).
  const statusStarted = Number(invite.connections_status) === 1
  const hasStartedAt = invite.assessment_started_at != null && String(invite.assessment_started_at).trim() !== ''
  const notCompleted = ![3, 4, 5].includes(statusNum)
  const startedElsewhere =
    notCompleted &&
    statusNum !== 6 &&
    (statusStarted || hasStartedAt) &&
    sessionStorage.getItem('assessment_started') !== 'true' &&
    localStorage.getItem('assessment_started_invite') !== inviteLink
  if (startedElsewhere) {
    return (
      <div className={styles.startedElsewherePage}>
        <div className={styles.startedElsewhereCard}>
          <div className={styles.startedElsewhereIconWrap} aria-hidden>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </div>
          <h1 className={styles.startedElsewhereTitle}>Assessment already started</h1>
          <p className={styles.startedElsewhereNotice}>
            This assessment was started in another browser or device.
          </p>
          <p className={styles.startedElsewhereHint}>
            Please continue on the browser where you started the assessment. Do not close that window.
          </p>
        </div>
      </div>
    )
  }

  const canContinue = invite.connections_status === 0
  return (
    <SignUp
      canContinue={canContinue}
      inviteLink={inviteLink}
      positionTitle={invite.position_title}
    />
  )
}
