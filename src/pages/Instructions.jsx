import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getInviteByLink, updateInvite } from '../api/invites'
import { detectClientOs } from '../utils/clientOs'
import { getQuestionnairesForInviteLink, ASSESSMENT_DURATION_MINUTES } from '../data/questions'
import styles from './Instructions.module.css'

const LOADING_DURATION_MS = 2500

const AGREEMENT_TEXT =
  'I agree not to copy code from any source, including colleagues, and will refrain from accessing websites or AI tools for assistance. Additionally, I commit to maintaining the confidentiality of this platform by not copying, sharing, or disclosing any content or questions through any medium or platform.'

export default function Instructions() {
  const navigate = useNavigate()
  const { inviteLink } = useParams()
  const questionnaires = getQuestionnairesForInviteLink(inviteLink)
  const questionCount = questionnaires.reduce((sum, q) => sum + q.questions.length, 0)
  const [status, setStatus] = useState('instructions') // 'instructions' | 'loading'
  const [inviteValid, setInviteValid] = useState(true)
  const [agreed, setAgreed] = useState(false)

  const assessmentStarted =
    typeof sessionStorage !== 'undefined' && sessionStorage.getItem('assessment_started') === 'true'

  useEffect(() => {
    try {
      if (assessmentStarted) {
        navigate(inviteLink ? `/invite/${inviteLink}/assessment` : '/assessment', { replace: true })
        return
      }
    } catch (_) {}
  }, [inviteLink, navigate])

  useEffect(() => {
    if (!inviteLink) return
    getInviteByLink(inviteLink)
      .then((inv) => {
        const st = Number(inv.connections_status)
        if ([3, 4, 5].includes(st)) {
          setInviteValid(false)
          navigate(`/invite/${inviteLink}`, { replace: true })
          return
        }
        if (st === 6) {
          navigate(`/invite/${inviteLink}/summary-interview`, { replace: true })
        }
      })
      .catch(() => setInviteValid(false))
  }, [inviteLink, navigate])

  useEffect(() => {
    try {
      if (!localStorage.getItem('assessment_candidate')) {
        navigate(inviteLink ? `/invite/${inviteLink}` : '/', { replace: true })
      }
    } catch (_) {
      navigate(inviteLink ? `/invite/${inviteLink}` : '/', { replace: true })
    }
  }, [inviteLink, navigate])

  const handleStart = () => {
    try {
      sessionStorage.setItem('assessment_started', 'true')
      if (inviteLink) {
        localStorage.setItem('assessment_started_invite', inviteLink)
      }
      const raw = localStorage.getItem('assessment_candidate')
      if (raw) {
        const candidate = JSON.parse(raw)
        localStorage.setItem('assessment_candidate', JSON.stringify({ ...candidate, agreed: true }))
      }
    } catch (_) {}
    setStatus('loading')
  }

  // When "Starting the assessment": persist connections_status=1 on the backend (with retry) so
  // another browser/device sees "Assessment already started". Then show loading and navigate.
  useEffect(() => {
    if (status !== 'loading') return
    let cancelled = false
    let navTimeoutId = null
    const doUpdate = () =>
      updateInvite(inviteLink, {
        connections_status: 1,
        assessment_started_at: new Date().toISOString(),
        client_os: detectClientOs(),
      })
    const withTimeout = (p, ms) =>
      Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))])
    const scheduleNav = () => {
      navTimeoutId = setTimeout(() => {
        if (!cancelled) navigate(inviteLink ? `/invite/${inviteLink}/assessment` : '/assessment', { replace: true })
      }, LOADING_DURATION_MS)
    }
    if (!inviteLink) {
      scheduleNav()
      return () => {
        cancelled = true
        if (navTimeoutId) clearTimeout(navTimeoutId)
      }
    }
    ;(async () => {
      try {
        await withTimeout(doUpdate(), 6000)
      } catch (_) {
        try {
          await withTimeout(doUpdate(), 4000)
        } catch (_) {}
      }
      if (cancelled) return
      scheduleNav()
    })()
    return () => {
      cancelled = true
      if (navTimeoutId) clearTimeout(navTimeoutId)
    }
  }, [status, inviteLink, navigate])

  if (status === 'loading') {
    return (
      <div className={styles.loadingPage}>
        <h1 className={styles.loadingTitle}>Starting the assessment</h1>
        <div className={styles.spinner} aria-hidden="true" />
        <p className={styles.loadingText}>Please wait</p>
      </div>
    )
  }

  if (assessmentStarted || !inviteValid) return null

  return (
    <div className={styles.page}>
      <div className={styles.wrapper}>
        <article className={styles.card}>
          <header className={styles.header}>
            <p className={styles.kicker}>Assessment</p>
            <h1 className={styles.instructionsTitle} id="instructions-heading">
              Instructions
            </h1>
            <p className={styles.subtitle}>
              Review the guidelines below before you begin. You must accept the declaration to continue.
            </p>
          </header>

          <section className={styles.listCard} aria-labelledby="guidelines-heading">
            <h2 className={styles.sectionTitle} id="guidelines-heading">
              What to expect
            </h2>
            <ol className={styles.instructionsList}>
              <li>
                <span className={styles.listItemBody}>
                  This assessment includes <strong>{questionCount} questions</strong>.
                </span>
              </li>
              <li>
                <span className={styles.listItemBody}>
                  Complete the assessment in <strong>one continuous browser session</strong>. Once started, it cannot be
                  paused, restarted, or retaken.
                </span>
              </li>
              <li>
                <span className={styles.listItemBody}>
                  Remain on the assessment tab; avoid opening other tabs or navigating away. Doing so may result in{' '}
                  <strong className={styles.warning}>disqualification</strong>.
                </span>
              </li>
              <li>
                <span className={styles.listItemBody}>
                  Unattempted questions are not penalized; there is no negative marking.
                </span>
              </li>
              <li>
                <span className={styles.listItemBody}>
                  Use the <strong>Next</strong> and <strong>Previous</strong> controls to move between questions.
                </span>
              </li>
              <li className={styles.cameraEmphasisItem}>
                <span className={styles.listItemBody}>
                  Please ensure your computer has a <strong>connected camera</strong> before starting the assessment, as
                  the <strong>video summary interview</strong> must be completed after the questions.
                </span>
              </li>
              <li>
                <span className={styles.listItemBody}>
                  As the final step, complete a <strong>video interview summary</strong> of at least one minute.
                </span>
              </li>
            </ol>
          </section>

          <section className={styles.agreement} aria-labelledby="declaration-heading">
            <h2 className={styles.agreementHeading} id="declaration-heading">
              Declaration <span className={styles.requiredBadge}>Required</span>
            </h2>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className={styles.checkbox}
                aria-describedby="declaration-heading"
              />
              <span className={styles.checkboxText}>
                {AGREEMENT_TEXT}{' '}
                <span className={styles.requiredAsterisk} aria-hidden="true">
                  *
                </span>
              </span>
            </label>
          </section>

          <div className={styles.startWrap}>
            <button
              type="button"
              className={styles.startBtn}
              onClick={handleStart}
              disabled={!agreed}
            >
              Start assessment
            </button>
          </div>
        </article>
      </div>
    </div>
  )
}
