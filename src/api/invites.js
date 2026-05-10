// Backend API base. Set VITE_API_URL in .env to override. Use http for local dev (backend has no SSL).
const rawApiBase = import.meta.env.VITE_API_URL || 'https://api.wecreateproblems.net'
const runningOnHttps = typeof window !== 'undefined' && window.location.protocol === 'https:'
const httpsSafeBase = runningOnHttps && rawApiBase.startsWith('http://')
  ? rawApiBase.replace(/^http:\/\//, 'https://')
  : rawApiBase
const API_BASE = httpsSafeBase.replace(/\/+$/, '')
const DEFAULT_PROD_API_BASE = 'https://api.wecreateproblems.net'
// const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

async function request(path, options = {}) {
  const primaryBase = API_BASE
  const fallbackBase = primaryBase === DEFAULT_PROD_API_BASE ? null : DEFAULT_PROD_API_BASE
  return requestWithBase(path, options, primaryBase, fallbackBase)
}

async function requestWithBase(path, options, base, fallbackBase) {
  const url = `${base}${path}`
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  const contentType = (res.headers.get('content-type') || '').toLowerCase()
  const isJson = contentType.includes('application/json')
  const isHtml = contentType.includes('text/html')

  if (isHtml && fallbackBase) {
    return requestWithBase(path, options, fallbackBase, null)
  }

  if (!res.ok) {
    const err = isJson ? await res.json().catch(() => ({ error: res.statusText })) : null
    const msg = err?.error || (!isJson && isHtml ? 'Backend returned HTML instead of JSON' : res.statusText)
    if (res.status === 404) {
      throw new Error(`${msg}. Is the backend running? Start it: cd backend && npm run dev`)
    }
    throw new Error(msg)
  }
  if (res.status === 204) return null
  if (!isJson) {
    if (fallbackBase) {
      return requestWithBase(path, options, fallbackBase, null)
    }
    throw new Error('Backend returned a non-JSON response')
  }
  return res.json()
}

export async function getInvites() {
  const data = await request('/api/invites')
  return data.invites
}

/** Get a single invite by link. Returns { invite_link, connections_status, email } or throws. */
export async function getInviteByLink(inviteLink) {
  const data = await request(`/api/invites/${encodeURIComponent(inviteLink)}`)
  return data.invite
}

/** Get real-time assessment timer from backend (seconds_remaining, server_time). */
export async function getAssessmentTimer(inviteLink) {
  const data = await request(`/api/invites/${encodeURIComponent(inviteLink)}/timer`)
  return { seconds_remaining: data.seconds_remaining, server_time: data.server_time }
}

const INVITE_CODE_LENGTH = 22
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'

/** Generate a random invite link (same format as backend). */
function randomInviteLink() {
  let s = ''
  for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
    s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  }
  return s
}

/** Generate a unique invite link that is not in the given list (e.g. not in DB). */
export function generateInviteLinkNotInList(existingLinks) {
  const set = new Set(existingLinks || [])
  let link
  do {
    link = randomInviteLink()
  } while (set.has(link))
  return link
}

/**
 * Turn pasted URL or slug into the invite path segment (e.g. full URL → slug after /invite/).
 */
export function normalizeInviteLinkInput(raw) {
  let t = String(raw ?? '').trim()
  if (!t) return ''
  if (!/\s/.test(t) && !t.includes('://') && /^[\w.-]+\/.+/.test(t)) {
    t = `https://${t}`
  }
  if (t.includes('://') || t.startsWith('//')) {
    try {
      const url = new URL(t.startsWith('//') ? `https:${t}` : t)
      const parts = url.pathname.split('/').filter(Boolean)
      const i = parts.findIndex((p) => p.toLowerCase() === 'invite')
      if (i >= 0 && parts[i + 1]) {
        try {
          return decodeURIComponent(parts[i + 1])
        } catch {
          return parts[i + 1]
        }
      }
    } catch {
      /* use trimmed string */
    }
  }
  return t.replace(/^\/+|\/+$/g, '')
}

/** Add an invite. Backend generates invite_link if omitted. Optional customInviteLink: slug or full /invite/… URL. invite_type only affects auto-generated length. */
export async function createInvite(name, positionTitle, note, inviteType = 'partner', customInviteLink) {
  const body = { invite_type: inviteType === 'investor' ? 'investor' : 'partner' }
  if (name != null && String(name).trim() !== '') body.name = String(name).trim()
  if (positionTitle != null && String(positionTitle).trim() !== '') body.position_title = String(positionTitle).trim()
  if (note != null && String(note).trim() !== '') body.note = String(note).trim()
  const slug = normalizeInviteLinkInput(customInviteLink)
  if (slug) body.invite_link = slug
  const opts = { method: 'POST', body: JSON.stringify(body) }
  const data = await request('/api/invites', opts)
  return data.invite
}

/** Update an invite. Pass { connections_status, email, position_title } (one or more). */
export async function updateInvite(inviteLink, updates) {
  const data = await request(`/api/invites/${encodeURIComponent(inviteLink)}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  })
  return data.invite
}

export async function deleteInvite(inviteLink) {
  await request(`/api/invites/${encodeURIComponent(inviteLink)}`, {
    method: 'DELETE',
  })
}
