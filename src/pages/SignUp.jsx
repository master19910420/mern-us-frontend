import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './SignUp.module.css'

const WORK_EXPERIENCE_OPTIONS = [
  { value: '', label: 'Select' },
  { value: '3+', label: '3+' },
  { value: '5+', label: '5+' },
  { value: '7+', label: '7+' },
  { value: '10+', label: '10+' },
  { value: '15+', label: '15+' },
  { value: '20+', label: '20+' },
]

export default function SignUp({ canContinue = true, inviteLink, positionTitle }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    email: '',
    fullName: '',
    experienceYears: '',
  })
  const [touched, setTouched] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleBlur = (e) => {
    setTouched((prev) => ({ ...prev, [e.target.name]: true }))
  }

  const validate = () => {
    const err = {}
    if (!form.email.trim()) err.email = 'Email address is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) err.email = 'Please enter a valid email address.'
    if (!form.fullName.trim()) err.fullName = 'Full name is required.'
    if (!form.experienceYears) err.experienceYears = 'Work experience is required.'
    return err
  }

  const [errors, setErrors] = useState({})

  const handleSubmit = (e) => {
    e.preventDefault()
    const err = validate()
    setErrors(err)
    setTouched({ email: true, fullName: true, experienceYears: true })
    if (Object.keys(err).length > 0) return

    const candidate = { ...form, agreed: false, registeredAt: new Date().toISOString() }
    try {
      localStorage.setItem('assessment_candidate', JSON.stringify(candidate))
    } catch (_) {}

    navigate(inviteLink ? `/invite/${inviteLink}/instructions` : '/')
  }

  const getError = (name) => touched[name] && errors[name]

  return (
    <div className={styles.page}>
      <div className={styles.wrapper}>
        {/* Left: Welcome and pre-assessment instructions (like first image) */}
        <section className={styles.intro}>
          <p className={styles.introBody}>
            You have been invited to complete a hiring evaluation. The assessment is delivered through our
            secure platform and is designed to help us understand your skills and fit for the role.
          </p>
          <p className={styles.introBody}>
            We recommend setting aside approximately <strong>20 minutes</strong> to complete all steps at your own pace.
          </p>
          <div className={styles.metaBox}>
            <div className={styles.metaRow}>
              <span className={styles.infoLabel}>Date</span>
              <span className={styles.infoValue}>
                {new Date().toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
            </div>
            <div className={styles.metaRow}>
              <span className={styles.infoLabel}>Position</span>
              <span className={styles.infoValue}>{positionTitle || '—'}</span>
            </div>
          </div>

          <div className={styles.noteBox}>
            <p className={styles.noteLabel}>Note</p>
            <p className={styles.noteText}>
              For the best experience, please take the assessment in a private or incognito window to avoid
              interference from browser extensions and ensure a smooth session.
            </p>
          </div>

          <p className={styles.welcomeText}>
            We encourage you to answer each question to the best of your ability. Your responses help us
            get a clear picture of your experience and approach.
          </p>

          <h2 className={styles.beforeStartHeading}>
            Before you begin, please:
          </h2>
          <ul className={styles.beforeStartList}>
            <li>Use a laptop or desktop rather than a mobile device.</li>
            <li>Close other applications and browser tabs to minimize distractions.</li>
            <li>Set aside enough time to complete the assessment in one sitting without interruption.</li>
          </ul>
        </section>

        {/* Right: Form */}
        <section className={styles.formSection}>
          <p className={styles.formIntro}>
            Please provide the following details so we can personalize your assessment experience.
          </p>

          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            <div className={styles.field}>
              <label htmlFor="email">
                Email address <span className={styles.required}>*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email address"
                value={form.email}
                onChange={handleChange}
                onBlur={handleBlur}
                className={getError('email') ? styles.inputError : ''}
                autoComplete="email"
              />
              {getError('email') && <span className={styles.error}>{errors.email}</span>}
            </div>

            <div className={styles.field}>
              <label htmlFor="fullName">
                Full Name <span className={styles.required}>*</span>
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="Enter your full name"
                value={form.fullName}
                onChange={handleChange}
                onBlur={handleBlur}
                className={getError('fullName') ? styles.inputError : ''}
                autoComplete="name"
              />
              {getError('fullName') && <span className={styles.error}>{errors.fullName}</span>}
            </div>

            <div className={styles.field}>
              <label htmlFor="experienceYears">
                Work Experience (in years) <span className={styles.required}>*</span>
              </label>
              <select
                id="experienceYears"
                name="experienceYears"
                value={form.experienceYears}
                onChange={handleChange}
                onBlur={handleBlur}
                className={getError('experienceYears') ? styles.inputError : ''}
              >
                {WORK_EXPERIENCE_OPTIONS.map((opt) => (
                  <option key={opt.value || 'empty'} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {getError('experienceYears') && (
                <span className={styles.error}>{errors.experienceYears}</span>
              )}
            </div>

            <button
              type="submit"
              className={styles.submit}
              disabled={!canContinue}
              title={!canContinue ? 'This invite link is no longer available for new connections.' : undefined}
            >
              Continue
            </button>
            {!canContinue && (
              <p className={styles.continueDisabled}>
                This invite link is not available for new connections. (Connection limit reached.)
              </p>
            )}
          </form>
        </section>
      </div>
    </div>
  )
}
