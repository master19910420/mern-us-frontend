/**
 * Clear browser storage tied to an invite when the server marks it as not started (0),
 * so the link behaves like a fresh invite (no redirect loops, no stale progress).
 */
export function clearClientStateForInviteReset(inviteLink) {
  if (!inviteLink || typeof window === 'undefined') return
  try {
    if (localStorage.getItem('assessment_started_invite') === inviteLink) {
      localStorage.removeItem('assessment_started_invite')
    }
    if (localStorage.getItem('assessment_completed_invite') === inviteLink) {
      localStorage.removeItem('assessment_completed_invite')
      localStorage.removeItem('assessment_completed')
    }
    sessionStorage.removeItem('assessment_started')
    sessionStorage.removeItem(`assessment_selections_${inviteLink}`)
    sessionStorage.removeItem(`assessment_elapsed_${inviteLink}`)
    sessionStorage.removeItem(`assessment_leave_count_${inviteLink}`)
  } catch (_) {
    /* ignore */
  }
}
