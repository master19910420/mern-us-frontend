import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { getInviteByLink, updateInvite } from '../api/invites'
import { getQuestionnairesForInviteLink } from '../data/questions'
import styles from './Assessment.module.css'

function formatTimeElapsed(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}m : ${String(s).padStart(2, '0')}s`
}

function StopwatchIcon({ className }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function PaginationFirstIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 17V7l-6 5 6 5z" />
      <path d="M6 17V7" />
    </svg>
  )
}
function PaginationPrevIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  )
}
function PaginationNextIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 18l6-6-6-6" />
    </svg>
  )
}
function PaginationLastIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 17V7l6 5-6 5z" />
      <path d="M18 17V7" />
    </svg>
  )
}

function getSelectionKey(qIndex, questionId) {
  return `${qIndex}-${questionId}`
}

export default function Assessment() {
  const navigate = useNavigate()
  const location = useLocation()
  const { inviteLink } = useParams()
  const questionnaires = getQuestionnairesForInviteLink(inviteLink)
  const totalQuestions = questionnaires.reduce((sum, q) => sum + q.questions.length, 0)
  const selectionsKey = inviteLink ? `assessment_selections_${inviteLink}` : 'assessment_selections'
  const elapsedKey = inviteLink ? `assessment_elapsed_${inviteLink}` : 'assessment_elapsed'

  const [currentQIndex, setCurrentQIndex] = useState(0)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selections, setSelections] = useState(() => {
    try {
      const key = inviteLink ? `assessment_selections_${inviteLink}` : 'assessment_selections'
      const s = sessionStorage.getItem(key)
      return s ? JSON.parse(s) : {}
    } catch (_) {
      return {}
    }
  })
  const [registered, setRegistered] = useState(false)
  const [secondsElapsed, setSecondsElapsed] = useState(() => {
    try {
      const key = inviteLink ? `assessment_elapsed_${inviteLink}` : 'assessment_elapsed'
      const s = sessionStorage.getItem(key)
      const n = parseInt(s, 10)
      return Number.isNaN(n) ? 0 : Math.max(0, n)
    } catch (_) {
      return 0
    }
  })
  const timerRef = useRef(null)
  const hasAppliedGoToLastRef = useRef(false)
  const leaveCountKey = inviteLink ? `assessment_leave_count_${inviteLink}` : 'assessment_leave_count'
  const [leaveCount, setLeaveCount] = useState(() => {
    try {
      const s = sessionStorage.getItem(leaveCountKey)
      const n = parseInt(s, 10)
      return Number.isNaN(n) ? 0 : n
    } catch (_) {
      return 0
    }
  })
  const [showLeaveAlert, setShowLeaveAlert] = useState(false)
  const [showFinishConfirm, setShowFinishConfirm] = useState(false)

  useEffect(() => {
    if (inviteLink) {
      try {
        sessionStorage.setItem('invite_link', inviteLink)
      } catch (_) {}
    }
  }, [inviteLink])

  // Persist selections so they (and timer) survive navigating to summary and back.
  useEffect(() => {
    try {
      sessionStorage.setItem(selectionsKey, JSON.stringify(selections))
    } catch (_) {}
  }, [selections, selectionsKey])

  // Restore leave count from sessionStorage after mount (inviteLink may be set after first render).
  useEffect(() => {
    try {
      const s = sessionStorage.getItem(leaveCountKey)
      const n = parseInt(s, 10)
      if (!Number.isNaN(n)) setLeaveCount(n)
    } catch (_) {}
  }, [leaveCountKey])

  // When returning from summary interview, go to last question (before paint to avoid flash).
  useLayoutEffect(() => {
    if (!location.state?.goToLastQuestion || hasAppliedGoToLastRef.current || !questionnaires.length) return
    hasAppliedGoToLastRef.current = true
    const lastQi = questionnaires.length - 1
    const lastQii = questionnaires[lastQi].questions.length - 1
    setCurrentQIndex(lastQi)
    setCurrentQuestionIndex(lastQii)
    navigate(location.pathname, { replace: true, state: {} })
  }, [location.state?.goToLastQuestion, location.pathname, questionnaires, navigate])

  // If user already finished questionnaire for this invite, send them to summary interview
  useEffect(() => {
    if (!inviteLink) return
    try {
      if (localStorage.getItem('assessment_completed_invite') === inviteLink) {
        navigate(`/invite/${inviteLink}/summary-interview`, { replace: true })
      }
    } catch (_) {}
  }, [inviteLink, navigate])

  useEffect(() => {
    if (!inviteLink) return
    let cancelled = false
    getInviteByLink(inviteLink)
      .then((inv) => {
        if (cancelled) return
        const status = Number(inv.connections_status)
        // Redirect to first page if not started (0) or terminal (3=user, 4=rejected, 5=timeout)
        if (status === 0 || [3, 4, 5].includes(status)) {
          navigate(`/invite/${inviteLink}`, { replace: true })
          return
        }
        // Questionnaire done — summary interview
        if (status === 6) {
          navigate(`/invite/${inviteLink}/summary-interview`, { replace: true })
        }
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [inviteLink, navigate])

  useEffect(() => {
    try {
      const stored = localStorage.getItem('assessment_candidate')
      setRegistered(!!stored)
      if (!stored) navigate(inviteLink ? `/invite/${inviteLink}` : '/', { replace: true })
    } catch (_) {
      navigate(inviteLink ? `/invite/${inviteLink}` : '/', { replace: true })
    }
  }, [navigate, inviteLink])

  // Local elapsed timer (display only); persist to sessionStorage so it survives navigating away and back.
  useEffect(() => {
    if (!registered) return
    timerRef.current = setInterval(() => {
      setSecondsElapsed((prev) => {
        const next = prev + 1
        try {
          sessionStorage.setItem(elapsedKey, String(next))
        } catch (_) {}
        return next
      })
    }, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [registered, elapsedKey])

  // Leave-page warning: on window blur we increment leave count (persisted) and show modal only.
  useEffect(() => {
    if (!registered) return
    const onBlur = () => {
      setLeaveCount((c) => {
        const next = c + 1
        try {
          sessionStorage.setItem(leaveCountKey, String(next))
        } catch (_) {}
        return next
      })
      setShowLeaveAlert(true)
    }
    window.addEventListener('blur', onBlur)
    return () => window.removeEventListener('blur', onBlur)
  }, [registered, leaveCountKey])

  const handleLeaveAlertAgree = () => {
    setShowLeaveAlert(false)
  }

  const questionnaire = questionnaires[currentQIndex]
  const questions = questionnaire?.questions ?? []
  const question = questions[currentQuestionIndex]
  const questionNumber =
    questionnaires.slice(0, currentQIndex).reduce((sum, q) => sum + q.questions.length, 0) +
    currentQuestionIndex +
    1
  const selectedAnswerId = question ? selections[getSelectionKey(currentQIndex, question.id)] : null
  const isFirstQuestion = currentQIndex === 0 && currentQuestionIndex === 0
  const isLastQuestion =
    currentQIndex === questionnaires.length - 1 &&
    currentQuestionIndex === questions.length - 1

  const handleSelect = (answerId) => {
    if (!question) return
    setSelections((prev) => ({
      ...prev,
      [getSelectionKey(currentQIndex, question.id)]: answerId,
    }))
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((i) => i - 1)
    } else if (currentQIndex > 0) {
      setCurrentQIndex((i) => i - 1)
      setCurrentQuestionIndex(questionnaires[currentQIndex - 1].questions.length - 1)
    }
  }

  const handleFinishConfirmContinue = () => {
    setShowFinishConfirm(false)
    try {
      localStorage.setItem('assessment_completed', 'true')
      if (inviteLink) {
        localStorage.setItem('assessment_completed_invite', inviteLink)
      }
      const storedInviteLink = sessionStorage.getItem('invite_link')
      const linkForStatus = inviteLink || storedInviteLink
      if (linkForStatus) {
        updateInvite(linkForStatus, { connections_status: 6 }).catch(() => {})
      }
      if (storedInviteLink) {
        navigate(`/invite/${storedInviteLink}/summary-interview`, { replace: true })
        return
      }
    } catch (_) {}
    navigate('/summary-interview', { replace: true })
  }

  const handleNext = () => {
    if (isLastQuestion) {
      setShowFinishConfirm(true)
      return
    }
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((i) => i + 1)
    } else if (currentQIndex < questionnaires.length - 1) {
      setCurrentQIndex((i) => i + 1)
      setCurrentQuestionIndex(0)
    }
  }

  const goToQuestion = (oneBasedNumber) => {
    if (oneBasedNumber < 1 || oneBasedNumber > totalQuestions) return
    let remaining = oneBasedNumber - 1
    for (let qi = 0; qi < questionnaires.length; qi++) {
      const len = questionnaires[qi].questions.length
      if (remaining < len) {
        setCurrentQIndex(qi)
        setCurrentQuestionIndex(remaining)
        return
      }
      remaining -= len
    }
  }

  if (!registered || !question) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Loading…</div>
      </div>
    )
  }

  const progressPercent = (questionNumber / totalQuestions) * 100
  const answeredCount = Object.keys(selections).length

  const isQuestionAnswered = (oneBasedNum) => {
    let remaining = oneBasedNum - 1
    for (let qi = 0; qi < questionnaires.length; qi++) {
      const qs = questionnaires[qi].questions
      if (remaining < qs.length) {
        const questionId = qs[remaining].id
        return !!selections[getSelectionKey(qi, questionId)]
      }
      remaining -= qs.length
    }
    return false
  }

  return (
    <div className={styles.page}>
      {showLeaveAlert && (
        <div className={styles.leaveAlertOverlay} role="alertdialog" aria-modal="true" aria-labelledby="leave-alert-title">
          <div className={styles.leaveAlertCard}>
            <h2 id="leave-alert-title" className={styles.leaveAlertTitle}>WARNING: DO NOT NAVIGATE AWAY</h2>
            <p className={styles.leaveAlertLine}>AFTER {leaveCount} Time(s) OF LEAVING THE PAGE</p>
            <p className={styles.leaveAlertLine}>
              YOU WILL BE <span className={styles.leaveAlertHighlight}>DISQUALIFIED</span>
            </p>
            <button
              type="button"
              className={styles.leaveAlertBtn}
              onClick={handleLeaveAlertAgree}
            >
              I AGREE
            </button>
          </div>
        </div>
      )}
      {showFinishConfirm && (
        <div className={styles.finishConfirmOverlay} role="dialog" aria-modal="true" aria-labelledby="finish-confirm-title">
          <div className={styles.finishConfirmCard}>
            <h2 id="finish-confirm-title" className={styles.finishConfirmTitle}>Finish Questions</h2>
            <p className={styles.finishConfirmMessage}>
              You are about to finish the questions and go to the video summary. Please make sure you have answered all questions. Do you want to continue?
            </p>
            <div className={styles.finishConfirmActions}>
              <button
                type="button"
                className={styles.finishConfirmCancel}
                onClick={() => setShowFinishConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.finishConfirmContinue}
                onClick={handleFinishConfirmContinue}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
      <div className={styles.card}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionHeaderLeft}>
            <span className={styles.headerEyebrow}>Assessment</span>
            <h2 className={styles.questionnaireTitle}>Questions</h2>
            <p className={styles.headerSubtitle}>Answer each question carefully before moving forward.</p>
          </div>
          <div className={styles.timerWrap} role="timer" aria-live="polite" aria-label={`Time elapsed: ${formatTimeElapsed(secondsElapsed)}`}>
            <StopwatchIcon className={styles.timerIcon} />
            <span className={styles.timerValue}>{formatTimeElapsed(secondsElapsed)}</span>
            <span className={styles.timerLabel}> elapsed</span>
          </div>
        </div>

        <div className={styles.progress}>
          <div className={styles.progressHead}>
            <span className={styles.progressText}>
              Question {currentQuestionIndex + 1} of {questions.length}
              <span className={styles.progressTotal}>
                {' '}
                · {questionNumber} of {totalQuestions} total
              </span>
            </span>
            <span className={styles.progressMeta}>
              Answered {Math.min(answeredCount, totalQuestions)} / {totalQuestions}
            </span>
          </div>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${progressPercent}%` }}
              role="progressbar"
              aria-valuenow={questionNumber}
              aria-valuemin={1}
              aria-valuemax={totalQuestions}
            />
          </div>
        </div>

        <nav className={styles.pagination} aria-label="Question navigation">
          <div className={styles.paginationNavGroup}>
            <button
              type="button"
              className={styles.paginationBtn}
              onClick={() => goToQuestion(1)}
              disabled={isFirstQuestion}
              aria-label="First question"
            >
              <PaginationFirstIcon />
            </button>
            <button
              type="button"
              className={styles.paginationBtn}
              onClick={handlePrevious}
              disabled={isFirstQuestion}
              aria-label="Previous question"
            >
              <PaginationPrevIcon />
            </button>
          </div>
          <div className={styles.paginationNumbersWrap}>
            <div className={styles.paginationNumbers}>
              {Array.from({ length: totalQuestions }, (_, i) => i + 1).map((num) => {
                const isActive = questionNumber === num
                const isAnswered = isQuestionAnswered(num)
                const className = [
                  isActive ? styles.paginationNumActive : styles.paginationNum,
                  isAnswered ? styles.paginationNumAnswered : null,
                ].filter(Boolean).join(' ')
                return (
                  <button
                    key={num}
                    type="button"
                    className={className}
                    onClick={() => goToQuestion(num)}
                    aria-label={`Question ${num}${isAnswered ? ' (answered)' : ''}`}
                    aria-current={isActive ? 'true' : undefined}
                  >
                    {num}
                  </button>
                )
              })}
            </div>
          </div>
          <div className={styles.paginationNavGroup}>
            {isLastQuestion ? (
              <button
                type="button"
                className={`${styles.paginationBtn} ${styles.paginationFinishBtn}`}
                onClick={handleNext}
                aria-label="Finish questions"
              >
                Finish
              </button>
            ) : (
              <button
                type="button"
                className={styles.paginationBtn}
                onClick={handleNext}
                aria-label="Next question"
              >
                <PaginationNextIcon />
              </button>
            )}
            <button
              type="button"
              className={styles.paginationBtn}
              onClick={() => goToQuestion(totalQuestions)}
              aria-label="Last question"
            >
              <PaginationLastIcon />
            </button>
          </div>
        </nav>

        <h3 className={styles.questionText}>{question.text}</h3>

        <fieldset className={styles.answers} aria-label="Choose one answer">
          {question.answers.map((answer) => (
            <label
              key={answer.id}
              className={
                selectedAnswerId === answer.id
                  ? `${styles.option} ${styles.optionSelected}`
                  : styles.option
              }
            >
              <input
                type="radio"
                name={`q-${currentQIndex}-${question.id}`}
                value={answer.id}
                checked={selectedAnswerId === answer.id}
                onChange={() => handleSelect(answer.id)}
                className={styles.radio}
              />
              <span className={styles.optionText}>{answer.text}</span>
            </label>
          ))}
        </fieldset>

        <div className={styles.nav}>
          <button
            type="button"
            onClick={handlePrevious}
            disabled={isFirstQuestion}
            className={styles.btnPrev}
            aria-label="Previous question"
          >
            Previous
          </button>
          {isLastQuestion ? (
            <button
              type="button"
              onClick={handleNext}
              className={styles.btnNext}
              aria-label="Finish questions"
            >
              Finish
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              className={styles.btnNext}
              aria-label="Next question"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
