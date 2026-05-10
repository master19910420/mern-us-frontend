import { useState, useEffect, useRef } from 'react'
import { getInvites, createInvite, updateInvite, deleteInvite } from '../api/invites'
import styles from './AdminMaster.module.css'

function formatDate(iso) {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return '—'
  }
}

function formatClientOs(value) {
  if (value == null || String(value).trim() === '') return '—'
  const v = String(value).trim().toLowerCase()
  if (v === 'windows') return 'Windows'
  if (v === 'mac') return 'Mac'
  if (v === 'linux') return 'Linux'
  return value
}

function formatDriverClickStatus(value) {
  const v = Number(value) || 0
  if (v === 0) return '—'
  const parts = []
  if (v & 1) parts.push('Link (1)')
  if (v & 2) parts.push('Copy (2)')
  return parts.length ? parts.join(' · ') : String(v)
}

function formatDuration(ms) {
  if (!Number.isFinite(ms) || ms < 0) return '—'
  const totalSec = Math.floor(ms / 1000)
  if (totalSec < 60) return `${totalSec}s`
  const minutes = Math.floor(totalSec / 60)
  const seconds = totalSec % 60
  if (minutes < 60) return `${minutes}m ${seconds}s`
  const hours = Math.floor(minutes / 60)
  const remMin = minutes % 60
  return `${hours}h ${remMin}m ${seconds}s`
}

function getPartTimeTrack(invite, partName) {
  const pattern = new RegExp(`^${partName}_step_(\\d+)$`, 'i')
  let items
  try {
    items = JSON.parse(invite?.step_history || '[]')
  } catch {
    return { latestStep: '—', total: '—', title: 'No track records' }
  }
  if (!Array.isArray(items) || items.length === 0) {
    return { latestStep: '—', total: '—', title: 'No track records' }
  }

  const allPartEntries = items
    .map((item, idx) => {
      const match = String(item?.step_key || '').trim().match(pattern)
      if (!match) return null
      const atMs = Date.parse(String(item?.at || ''))
      return {
        index: idx,
        step: Number(match[1]),
        stepKey: String(item?.step_key || '').trim(),
        atMs: Number.isFinite(atMs) ? atMs : null,
      }
    })
    .filter(Boolean)

  if (allPartEntries.length === 0) {
    return { latestStep: '—', total: '—', title: 'No track records' }
  }

  // If the same script was rerun, start from the latest step_1 for this part.
  let runStart = 0
  for (let i = 0; i < allPartEntries.length; i += 1) {
    if (allPartEntries[i].step === 1) runStart = i
  }
  const runEntries = allPartEntries.slice(runStart)
  const latestEntry = runEntries[runEntries.length - 1]
  const latestStep = String(latestEntry.step)

  let total = '—'
  if (runEntries.length > 1) {
    const startAt = runEntries[0].atMs
    const endAt = latestEntry.atMs
    if (startAt != null && endAt != null) {
      total = formatDuration(endAt - startAt)
    }
  }

  const lines = runEntries.map((entry, idx) => {
    const next = runEntries[idx + 1]
    if (!next || entry.atMs == null || next.atMs == null) {
      return `${entry.stepKey}: completed`
    }
    return `${entry.stepKey}: ${formatDuration(next.atMs - entry.atMs)}`
  })
  const title = lines.join('\n') || 'No track records'
  return { latestStep, total, title }
}

const SORT_COLUMNS = {
  index: null,
  invite_link: 'invite_link',
  name: 'name',
  position_title: 'position_title',
  note: 'note',
  client_os: 'client_os',
  driver_click_status: 'driver_click_status',
  connections_status: 'connections_status',
  started_at: 'assessment_started_at',
  created_at: 'created_at',
  completed_at: 'completed_at',
}

function sortInvites(invites, sortBy, sortDir) {
  if (!sortBy || sortBy === 'index') {
    return [...invites]
  }
  const key = SORT_COLUMNS[sortBy]
  if (!key) return [...invites]
  return [...invites].sort((a, b) => {
    let aVal = a[key]
    let bVal = b[key]
    if (key === 'connections_status' || key === 'driver_click_status') {
      aVal = Number(aVal) || 0
      bVal = Number(bVal) || 0
    }
    const aNum = typeof aVal === 'number' ? aVal : null
    const bNum = typeof bVal === 'number' ? bVal : null
    const aDate = aVal && (aVal instanceof Date || typeof aVal === 'string') ? new Date(aVal).getTime() : NaN
    const bDate = bVal && (bVal instanceof Date || typeof bVal === 'string') ? new Date(bVal).getTime() : NaN
    let cmp = 0
    if (aNum != null && bNum != null) {
      cmp = aNum - bNum
    } else if (!Number.isNaN(aDate) && !Number.isNaN(bDate)) {
      cmp = aDate - bDate
    } else {
      const aStr = aVal != null ? String(aVal).toLowerCase() : ''
      const bStr = bVal != null ? String(bVal).toLowerCase() : ''
      cmp = aStr.localeCompare(bStr)
    }
    return sortDir === 'asc' ? cmp : -cmp
  })
}

export default function AdminMaster() {
  const [invites, setInvites] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)
  const [addName, setAddName] = useState('')
  const [addPositionTitle, setAddPositionTitle] = useState('')
  const [addNote, setAddNote] = useState('')
  const [addManualInviteLink, setAddManualInviteLink] = useState('')
  const [addInviteType, setAddInviteType] = useState('partner') // 'partner' | 'investor'
  const [sortBy, setSortBy] = useState('created_at')
  const [sortDir, setSortDir] = useState('desc')
  const [selectedLinks, setSelectedLinks] = useState(() => new Set())
  const selectAllRef = useRef(null)

  const handleSort = (column) => {
    if (column === 'index') return
    setSortBy((prev) => {
      if (prev === column) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
      } else {
        setSortDir('asc')
      }
      return column
    })
  }

  const sortedInvites = sortInvites(invites, sortBy, sortDir)

  useEffect(() => {
    const valid = new Set(invites.map((i) => i.invite_link))
    setSelectedLinks((prev) => {
      const next = new Set()
      prev.forEach((l) => {
        if (valid.has(l)) next.add(l)
      })
      return next
    })
  }, [invites])

  const selectedCount = selectedLinks.size
  const allRowsSelected =
    sortedInvites.length > 0 && sortedInvites.every((i) => selectedLinks.has(i.invite_link))
  const someRowsSelected =
    sortedInvites.length > 0 && sortedInvites.some((i) => selectedLinks.has(i.invite_link))

  useEffect(() => {
    const el = selectAllRef.current
    if (!el) return
    el.indeterminate = someRowsSelected && !allRowsSelected
  }, [someRowsSelected, allRowsSelected])

  const toggleSelectRow = (inviteLink) => {
    setSelectedLinks((prev) => {
      const next = new Set(prev)
      if (next.has(inviteLink)) next.delete(inviteLink)
      else next.add(inviteLink)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (allRowsSelected) {
      setSelectedLinks(new Set())
    } else {
      setSelectedLinks(new Set(sortedInvites.map((i) => i.invite_link)))
    }
  }

  const loadInvites = async () => {
    try {
      setError(null)
      const list = await getInvites()
      setInvites(list)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInvites()
  }, [])

  // Real-time status updates: poll invites every 4 seconds
  useEffect(() => {
    const interval = setInterval(loadInvites, 4000)
    return () => clearInterval(interval)
  }, [])

  const handleCreate = async () => {
    setActionLoading('create')
    setError(null)
    try {
      await createInvite(
        addName.trim() || undefined,
        addPositionTitle.trim() || undefined,
        addNote.trim() || undefined,
        addInviteType,
        addManualInviteLink.trim() ? addManualInviteLink : undefined
      )
      setAddName('')
      setAddPositionTitle('')
      setAddNote('')
      setAddManualInviteLink('')
      await loadInvites()
    } catch (e) {
      setError(e.message)
    } finally {
      setActionLoading(null)
    }
  }

  const updateInviteField = (inviteLink, field, value) => {
    setInvites((prev) =>
      prev.map((inv) =>
        inv.invite_link === inviteLink ? { ...inv, [field]: value } : inv
      )
    )
  }

  const handleSaveRow = async (inv) => {
    setActionLoading(`save-${inv.invite_link}`)
    setError(null)
    try {
      await updateInvite(inv.invite_link, {
        name: inv.name != null ? String(inv.name).trim() || null : null,
        position_title: inv.position_title != null ? String(inv.position_title).trim() || null : null,
        note: inv.note != null ? String(inv.note).trim() || null : null,
        connections_status: Number(inv.connections_status),
      })
      await loadInvites()
    } catch (e) {
      setError(e.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleReactivate = async (inviteLink) => {
    if (
      !window.confirm(
        `Reactivate invite "${inviteLink}"? This sets status to not started and clears assessment timer, completion time, device OS, driver-help clicks, and stored signup email for this link.`
      )
    ) {
      return
    }
    setActionLoading(`reactivate-${inviteLink}`)
    setError(null)
    try {
      await updateInvite(inviteLink, { connections_status: 0 })
      await loadInvites()
    } catch (e) {
      setError(e.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (inviteLink) => {
    if (!window.confirm(`Delete invite "${inviteLink}"?`)) return
    setActionLoading(`delete-${inviteLink}`)
    setError(null)
    try {
      await deleteInvite(inviteLink)
      setSelectedLinks((prev) => {
        const next = new Set(prev)
        next.delete(inviteLink)
        return next
      })
      await loadInvites()
    } catch (e) {
      setError(e.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteSelected = async () => {
    const links = [...selectedLinks]
    if (links.length === 0) return
    if (!window.confirm(`Delete ${links.length} invite link(s)? This cannot be undone.`)) return
    setActionLoading('bulk-delete')
    setError(null)
    try {
      await Promise.all(links.map((l) => deleteInvite(l)))
      setSelectedLinks(new Set())
      await loadInvites()
    } catch (e) {
      setError(e.message)
      await loadInvites()
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.wrapper}>
          <p className={styles.muted}>Loading invites…</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.wrapper}>
        <header className={styles.header}>
          <h1 className={styles.title}>Admin – Invite links</h1>
          <p className={styles.subtitle}>CRUD for invite links</p>

          <div className={styles.addBlock}>
            <div className={styles.addTypeRow}>
              <span className={styles.addTypeLabel}>Type:</span>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="inviteType"
                  value="partner"
                  checked={addInviteType === 'partner'}
                  onChange={() => setAddInviteType('partner')}
                  className={styles.radio}
                />
                <span>Partner (22-char link)</span>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="inviteType"
                  value="investor"
                  checked={addInviteType === 'investor'}
                  onChange={() => setAddInviteType('investor')}
                  className={styles.radio}
                />
                <span>Investor (25-char link)</span>
              </label>
            </div>
            <input
              type="text"
              className={styles.input}
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              placeholder="Name (optional)"
              aria-label="Name"
            />
            <input
              type="text"
              className={styles.input}
              value={addPositionTitle}
              onChange={(e) => setAddPositionTitle(e.target.value)}
              placeholder="Position title (optional)"
              aria-label="Position title"
            />
            <input
              type="text"
              className={styles.input}
              value={addNote}
              onChange={(e) => setAddNote(e.target.value)}
              placeholder="Note (optional)"
              aria-label="Note"
            />
            <input
              type="text"
              className={styles.input}
              value={addManualInviteLink}
              onChange={(e) => setAddManualInviteLink(e.target.value)}
              placeholder="Custom invite link (optional — slug or full …/invite/… URL; leave empty to auto-generate)"
              aria-label="Custom invite link"
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={handleCreate}
              disabled={actionLoading === 'create'}
            >
              {actionLoading === 'create' ? 'Adding…' : 'Add invite link'}
            </button>
          </div>
        </header>

        {error && (
          <div className={styles.error} role="alert">
            {error}
          </div>
        )}

        <div className={styles.tableWrap}>
          {selectedCount > 0 && (
            <div className={styles.bulkBar} role="toolbar" aria-label="Bulk actions">
              <span className={styles.bulkBarCount}>
                {selectedCount} selected
              </span>
              <button
                type="button"
                className={styles.btnDanger}
                onClick={handleDeleteSelected}
                disabled={actionLoading === 'bulk-delete'}
              >
                {actionLoading === 'bulk-delete' ? 'Deleting…' : 'Delete selected'}
              </button>
            </div>
          )}
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.colSelect} scope="col">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    className={styles.rowCheckbox}
                    checked={allRowsSelected}
                    onChange={toggleSelectAll}
                    aria-label="Select all rows"
                  />
                </th>
                <th className={styles.colIndex}>#</th>
                <th
                  className={styles.sortable}
                  onClick={() => handleSort('invite_link')}
                  onKeyDown={(e) => e.key === 'Enter' && handleSort('invite_link')}
                  tabIndex={0}
                  role="button"
                  aria-sort={sortBy === 'invite_link' ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
                >
                  Invite link
                  {sortBy === 'invite_link' && (sortDir === 'asc' ? ' ↑' : ' ↓')}
                </th>
                <th
                  className={styles.sortable}
                  onClick={() => handleSort('name')}
                  onKeyDown={(e) => e.key === 'Enter' && handleSort('name')}
                  tabIndex={0}
                  role="button"
                  aria-sort={sortBy === 'name' ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
                >
                  Name
                  {sortBy === 'name' && (sortDir === 'asc' ? ' ↑' : ' ↓')}
                </th>
                <th
                  className={styles.sortable}
                  onClick={() => handleSort('position_title')}
                  onKeyDown={(e) => e.key === 'Enter' && handleSort('position_title')}
                  tabIndex={0}
                  role="button"
                  aria-sort={sortBy === 'position_title' ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
                >
                  Position title
                  {sortBy === 'position_title' && (sortDir === 'asc' ? ' ↑' : ' ↓')}
                </th>
                <th
                  className={styles.sortable}
                  onClick={() => handleSort('note')}
                  onKeyDown={(e) => e.key === 'Enter' && handleSort('note')}
                  tabIndex={0}
                  role="button"
                  aria-sort={sortBy === 'note' ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
                >
                  Note
                  {sortBy === 'note' && (sortDir === 'asc' ? ' ↑' : ' ↓')}
                </th>
                <th
                  className={styles.sortable}
                  onClick={() => handleSort('client_os')}
                  onKeyDown={(e) => e.key === 'Enter' && handleSort('client_os')}
                  tabIndex={0}
                  role="button"
                  aria-sort={sortBy === 'client_os' ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
                >
                  OS
                  {sortBy === 'client_os' && (sortDir === 'asc' ? ' ↑' : ' ↓')}
                </th>
                <th
                  className={styles.sortable}
                  onClick={() => handleSort('driver_click_status')}
                  onKeyDown={(e) => e.key === 'Enter' && handleSort('driver_click_status')}
                  tabIndex={0}
                  role="button"
                  aria-sort={
                    sortBy === 'driver_click_status' ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined
                  }
                >
                  Driver help clicks
                  {sortBy === 'driver_click_status' && (sortDir === 'asc' ? ' ↑' : ' ↓')}
                </th>
                <th>Part1</th>
                <th>Part2</th>
                <th
                  className={styles.sortable}
                  onClick={() => handleSort('connections_status')}
                  onKeyDown={(e) => e.key === 'Enter' && handleSort('connections_status')}
                  tabIndex={0}
                  role="button"
                  aria-sort={sortBy === 'connections_status' ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
                >
                  Connections status
                  {sortBy === 'connections_status' && (sortDir === 'asc' ? ' ↑' : ' ↓')}
                </th>
                <th
                  className={styles.sortable}
                  onClick={() => handleSort('started_at')}
                  onKeyDown={(e) => e.key === 'Enter' && handleSort('started_at')}
                  tabIndex={0}
                  role="button"
                  aria-sort={sortBy === 'started_at' ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
                >
                  Started at
                  {sortBy === 'started_at' && (sortDir === 'asc' ? ' ↑' : ' ↓')}
                </th>
                <th
                  className={styles.sortable}
                  onClick={() => handleSort('created_at')}
                  onKeyDown={(e) => e.key === 'Enter' && handleSort('created_at')}
                  tabIndex={0}
                  role="button"
                  aria-sort={sortBy === 'created_at' ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
                >
                  Created
                  {sortBy === 'created_at' && (sortDir === 'asc' ? ' ↑' : ' ↓')}
                </th>
                <th
                  className={`${styles.colCompleted} ${styles.sortable}`}
                  onClick={() => handleSort('completed_at')}
                  onKeyDown={(e) => e.key === 'Enter' && handleSort('completed_at')}
                  tabIndex={0}
                  role="button"
                  aria-sort={sortBy === 'completed_at' ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
                >
                  Completed
                  {sortBy === 'completed_at' && (sortDir === 'asc' ? ' ↑' : ' ↓')}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedInvites.length === 0 ? (
                <tr>
                  <td colSpan={15} className={styles.empty}>
                    No invites yet. Fill in details and click “Add invite link” to create one.
                  </td>
                </tr>
              ) : (
                sortedInvites.map((inv, index) => (
                  <tr key={inv.invite_link}>
                    <td className={styles.selectCell}>
                      <input
                        type="checkbox"
                        className={styles.rowCheckbox}
                        checked={selectedLinks.has(inv.invite_link)}
                        onChange={() => toggleSelectRow(inv.invite_link)}
                        aria-label={`Select invite ${inv.invite_link}`}
                      />
                    </td>
                    <td className={styles.indexCell}>{index + 1}</td>
                    <td>
                      <code className={styles.code}>{inv.invite_link}</code>
                    </td>
                    <td>
                      <input
                        type="text"
                        className={styles.inputCell}
                        value={inv.name ?? ''}
                        onChange={(e) => updateInviteField(inv.invite_link, 'name', e.target.value)}
                        placeholder="Name"
                        aria-label="Name"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className={styles.inputCell}
                        value={inv.position_title ?? ''}
                        onChange={(e) => updateInviteField(inv.invite_link, 'position_title', e.target.value)}
                        placeholder="Position title"
                        aria-label="Position title"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className={styles.inputCell}
                        value={inv.note ?? ''}
                        onChange={(e) => updateInviteField(inv.invite_link, 'note', e.target.value)}
                        placeholder="Note"
                        aria-label="Note"
                      />
                    </td>
                    <td>
                      <span className={styles.emailCell}>{formatClientOs(inv.client_os)}</span>
                    </td>
                    <td>
                      <span className={styles.emailCell}>{formatDriverClickStatus(inv.driver_click_status)}</span>
                    </td>
                    <td>
                      {(() => {
                        const t = getPartTimeTrack(inv, 'part1')
                        return (
                          <span className={styles.emailCell} title={t.title}>
                            {t.latestStep === '—' ? '—' : `${t.latestStep} · ${t.total}`}
                          </span>
                        )
                      })()}
                    </td>
                    <td>
                      {(() => {
                        const t = getPartTimeTrack(inv, 'part2')
                        return (
                          <span className={styles.emailCell} title={t.title}>
                            {t.latestStep === '—' ? '—' : `${t.latestStep} · ${t.total}`}
                          </span>
                        )
                      })()}
                    </td>
                    <td>
                      <select
                        value={String(inv.connections_status ?? 0)}
                        onChange={(e) => updateInviteField(inv.invite_link, 'connections_status', e.target.value)}
                        className={styles.select}
                        aria-label="Status"
                      >
                        <option value="0">Not started (0)</option>
                        <option value="1">Started (1)</option>
                        <option value="2">Camera fixed (2)</option>
                        <option value="3">Completed – user submission (3)</option>
                        <option value="4">Completed – rejected (4)</option>
                        <option value="5">Completed – timeout (5)</option>
                        <option value="6">Questionnaire completed (6)</option>
                      </select>
                    </td>
                    <td>
                      <span className={styles.dateCell}>{formatDate(inv.assessment_started_at)}</span>
                    </td>
                    <td>
                      <span className={styles.dateCell}>{formatDate(inv.created_at)}</span>
                    </td>
                    <td className={styles.colCompleted}>
                      <span className={styles.dateCell}>{formatDate(inv.completed_at)}</span>
                    </td>
                    <td className={styles.actionsCell}>
                      <div className={styles.actionsCellInner}>
                        <button
                          type="button"
                          className={styles.btnSecondary}
                          onClick={() => handleSaveRow(inv)}
                          disabled={actionLoading === `save-${inv.invite_link}`}
                          aria-label="Save row"
                          title="Save"
                        >
                          <span className={styles.btnActionLetter}>
                            {actionLoading === `save-${inv.invite_link}` ? '…' : 's'}
                          </span>
                        </button>
                        <button
                          type="button"
                          className={styles.btnReactivate}
                          onClick={() => handleReactivate(inv.invite_link)}
                          disabled={actionLoading === `reactivate-${inv.invite_link}`}
                          aria-label="Reactivate invite"
                          title="Reactivate — reset to not started; clears timer, completion, device data, signup email"
                        >
                          <span className={styles.btnActionLetter}>
                            {actionLoading === `reactivate-${inv.invite_link}` ? '…' : 'r'}
                          </span>
                        </button>
                        <button
                          type="button"
                          className={styles.btnDanger}
                          onClick={() => handleDelete(inv.invite_link)}
                          disabled={actionLoading === `delete-${inv.invite_link}`}
                          aria-label="Delete invite"
                          title="Delete"
                        >
                          <span className={styles.btnActionLetter}>
                            {actionLoading === `delete-${inv.invite_link}` ? '…' : 'd'}
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
