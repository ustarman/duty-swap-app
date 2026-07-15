import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import StatusBadge from '../components/StatusBadge'
import { getAllSwaps, getAllSupervisors, addSupervisor, updateSupervisor, deleteSupervisor, verifyMailingPin } from '../dataService'
import { formatDate, formatWeekType } from '../utils/helpers'
import { AP_RED, CARD, INPUT_BOX, INPUT_LABEL, INPUT_STYLE, BTN_PRIMARY } from '../theme'

const CORRECT_PIN = import.meta.env.VITE_ADMIN_PIN ?? '1234'
// The mailing-list PIN is verified server-side (admin-supervisors function),
// so it is intentionally no longer read from the client bundle.

const FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Awaiting Driver B', value: "Awaiting Driver B's Signature" },
  { label: 'Awaiting Supervisor', value: "Awaiting Supervisor's Signature" },
  { label: 'Completed', value: 'Completed' },
]

// ── PIN Gate ──────────────────────────────────────────────────────────────────
function PinGate({ onUnlock, correctPin, verifyFn, pinLength = 4, sessionKey, title = 'Admin PIN' }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [checking, setChecking] = useState(false)
  const expectedLen = correctPin ? correctPin.length : pinLength

  const submit = async candidate => {
    if (verifyFn) {
      // Server-side verification (mailing-list PIN)
      setChecking(true)
      let ok = false
      try { ok = await verifyFn(candidate) } catch { ok = false }
      setChecking(false)
      if (ok) { sessionStorage.setItem(sessionKey, '1'); onUnlock(candidate) }
      else { setPin(''); setError(true) }
    } else {
      // Local comparison (outer Admin UI gate)
      if (candidate === correctPin) { sessionStorage.setItem(sessionKey, '1'); onUnlock(candidate) }
      else { setTimeout(() => { setPin(''); setError(true) }, 300) }
    }
  }

  const handleDigit = d => {
    if (pin.length >= 6 || checking) return
    const next = pin + d
    setPin(next)
    setError(false)
    if (next.length === expectedLen) submit(next)
  }

  const handleDelete = () => { if (!checking) { setPin(p => p.slice(0, -1)); setError(false) } }

  const digits = ['1','2','3','4','5','6','7','8','9','','0','⌫']

  const inner = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-color)', marginBottom: 8 }}>{title}</p>
        <p style={{ fontSize: 13, color: 'var(--subtext-color)', marginBottom: 28 }}>{checking ? 'Verifying…' : 'Enter your PIN to continue'}</p>

        {/* Dots */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 32 }}>
          {Array.from({ length: expectedLen }).map((_, i) => (
            <div key={i} style={{
              width: 14, height: 14, borderRadius: '50%',
              background: i < pin.length ? (error ? '#ef4444' : AP_RED) : 'var(--card-border)',
              transition: 'background 0.15s',
            }} />
          ))}
        </div>

        {error && (
          <p style={{ fontSize: 13, color: '#ef4444', fontWeight: 600, marginBottom: 20, marginTop: -16 }}>
            Incorrect PIN
          </p>
        )}

        {/* Keypad */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 72px)', gap: 12 }}>
          {digits.map((d, i) => (
            d === '' ? <div key={i} /> :
            d === '⌫' ? (
              <button key={i} onClick={handleDelete} style={{
                height: 72, borderRadius: 36, background: 'var(--input-bg)',
                border: '1px solid var(--card-border)', fontSize: 20,
                color: 'var(--text-color)', cursor: 'pointer', fontWeight: 500,
              }}>{d}</button>
            ) : (
              <button key={i} onClick={() => handleDigit(d)} style={{
                height: 72, borderRadius: 36, background: 'var(--card-bg)',
                border: '1px solid var(--card-border)', fontSize: 22,
                color: 'var(--text-color)', cursor: 'pointer', fontWeight: 500,
              }}>{d}</button>
            )
          ))}
        </div>
      </div>
  )

  if (correctPin === CORRECT_PIN) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100svh' }}>
        <Header showAdmin />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          {inner}
        </div>
      </div>
    )
  }

  return inner
}

// ── Swap Requests Tab ─────────────────────────────────────────────────────────
function SwapRequestsTab() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [swaps, setSwaps] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAllSwaps().then(data => { setSwaps(data); setLoading(false) })
  }, [])

  const filtered = swaps
    .filter(s => filter === 'all' || s.status === filter)
    .filter(s => {
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        s.driverAName?.toLowerCase().includes(q) ||
        s.driverBName?.toLowerCase().includes(q) ||
        s.title?.toLowerCase().includes(q)
      )
    })

  return (
    <>
      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: 'var(--subtext-color)' }}>🔍</span>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name..."
          style={{
            width: '100%', padding: '10px 12px 10px 36px',
            border: '1.5px solid var(--card-border)', borderRadius: 8,
            background: 'var(--card-bg)', color: 'var(--text-color)',
            fontSize: 14, outline: 'none', boxSizing: 'border-box',
          }}
        />
        {search && (
          <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--subtext-color)', fontSize: 16 }}>✕</button>
        )}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: '1rem', flexWrap: 'wrap' }}>
        {FILTERS.map(f => {
          const isActive = filter === f.value
          return (
            <button key={f.value} onClick={() => setFilter(f.value)} style={{
              flex: '1 1 auto', padding: '7px 10px',
              border: `1.5px solid ${isActive ? AP_RED : 'var(--tab-border)'}`,
              borderRadius: 8,
              background: isActive ? AP_RED : 'var(--tab-bg)',
              color: isActive ? 'white' : 'var(--tab-color)',
              fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
            }}>
              {f.label}
            </button>
          )
        })}
      </div>

      {/* Cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--subtext-color)', fontSize: 14 }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--subtext-color)', fontSize: 14 }}>No swap requests found</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(swap => (
            <button
              key={swap.id}
              onClick={() => navigate(`/screen4?swapId=${swap.id}`)}
              style={{
                width: '100%', textAlign: 'left',
                background: 'var(--card-bg)', border: '0.5px solid var(--card-border)',
                borderRadius: 12, padding: '1rem 1.25rem', cursor: 'pointer',
              }}
            >
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-color)', marginBottom: 4 }}>
                {swap.title}
              </p>
              <p style={{ fontSize: 14, color: 'var(--text-color)', marginBottom: 4 }}>
                <span style={{ fontWeight: 600 }}>{swap.driverAName}</span>
                <span style={{ color: 'var(--subtext-color)' }}> (Duty {swap.driverADuty})</span>
                {' ↔ '}
                <span style={{ fontWeight: 600 }}>{swap.driverBName}</span>
                <span style={{ color: 'var(--subtext-color)' }}> (Duty {swap.driverBDuty})</span>
              </p>
              <p style={{ fontSize: 13, color: 'var(--subtext-color)', marginBottom: 10 }}>
                Week of {formatDate(swap.weekCommencing)}
                {' • '}
                <span style={{ color: '#d97706', fontWeight: 600 }}>{formatWeekType(swap)}</span>
              </p>
              <StatusBadge status={swap.status} />
            </button>
          ))}
        </div>
      )}
    </>
  )
}

// ── Mailing List Tab ──────────────────────────────────────────────────────────
function MailingListTab() {
  // Unlocked only when we still hold the verified PIN needed for write calls.
  const [mailingUnlocked, setMailingUnlocked] = useState(
    sessionStorage.getItem('mailing_unlocked') === '1' && !!sessionStorage.getItem('mailing_pin')
  )

  if (!mailingUnlocked) {
    return (
      <PinGate
        title="Mailing List PIN"
        verifyFn={verifyMailingPin}
        sessionKey="mailing_unlocked"
        onUnlock={pin => { sessionStorage.setItem('mailing_pin', pin); setMailingUnlocked(true) }}
      />
    )
  }

  return <MailingListContent />
}

function MailingListContent() {
  const [supervisors, setSupervisors] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newForm, setNewForm] = useState({ name: '', email: '', role: '', authorityToSign: false })
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')

  useEffect(() => {
    getAllSupervisors().then(data => { setSupervisors(data); setLoading(false) })
  }, [])

  const mailingPin = () => sessionStorage.getItem('mailing_pin') || ''

  const toggle = async (id, field, current) => {
    setSaving(id + field)
    try {
      await updateSupervisor(id, { [field]: !current }, mailingPin())
      setSupervisors(prev => prev.map(s => s.id === id ? { ...s, [field]: !current } : s))
    } catch {
      // Write failed — reload from DB so the UI reflects the true state
      alert('Update failed. Please try again.')
      const fresh = await getAllSupervisors()
      setSupervisors(fresh)
    } finally {
      setSaving(null)
    }
  }

  const handleDelete = async id => {
    if (!confirm('Remove this person from the mailing list?')) return
    try {
      await deleteSupervisor(id, mailingPin())
      setSupervisors(prev => prev.filter(s => s.id !== id))
    } catch {
      alert('Delete failed. Please try again.')
      const fresh = await getAllSupervisors()
      setSupervisors(fresh)
    }
  }

  const handleAdd = async () => {
    setAddError('')
    if (!newForm.name.trim()) { setAddError('Name is required'); return }
    if (!newForm.email.trim()) { setAddError('Email is required'); return }
    setAdding(true)
    try {
      await addSupervisor(newForm, mailingPin())
      const updated = await getAllSupervisors()
      setSupervisors(updated)
      setNewForm({ name: '', email: '', role: '', authorityToSign: false })
      setShowAdd(false)
    } catch {
      setAddError('Failed to add. Please try again.')
    } finally {
      setAdding(false)
    }
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--subtext-color)', fontSize: 14 }}>Loading...</div>
  )

  return (
    <>
      <p style={{ fontSize: 12, color: 'var(--subtext-color)', marginBottom: '0.75rem', lineHeight: 1.5 }}>
        <strong>Active</strong> — receives all emails.{'  '}<strong>Authority to Sign</strong> — appears as selectable supervisor on approval screen.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: '1rem' }}>
        {supervisors.map(s => (
          <div key={s.id} style={{ ...CARD, marginBottom: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-color)' }}>{s.name}</p>
                <p style={{ fontSize: 12, color: 'var(--subtext-color)' }}>{s.email}</p>
                {s.role && <p style={{ fontSize: 11, color: 'var(--subtext-color)', marginTop: 2 }}>{s.role}</p>}
              </div>
              <button
                onClick={() => handleDelete(s.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--subtext-color)', fontSize: 18, padding: '0 0 0 8px', flexShrink: 0 }}
              >
                ✕
              </button>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <ToggleChip
                label="Active"
                active={s.active}
                disabled={saving === s.id + 'active'}
                onToggle={() => toggle(s.id, 'active', s.active)}
              />
              <ToggleChip
                label="Authority to Sign"
                active={s.authorityToSign}
                disabled={saving === s.id + 'authorityToSign'}
                onToggle={() => toggle(s.id, 'authorityToSign', s.authorityToSign)}
              />
            </div>
          </div>
        ))}
      </div>

      {showAdd ? (
        <div style={CARD}>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-color)', marginBottom: 12 }}>Add Person</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={INPUT_BOX}>
              <span style={INPUT_LABEL}>FULL NAME</span>
              <input
                type="text"
                value={newForm.name}
                onChange={e => setNewForm(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Jane Smith"
                style={INPUT_STYLE}
              />
            </div>
            <div style={INPUT_BOX}>
              <span style={INPUT_LABEL}>EMAIL</span>
              <input
                type="email"
                value={newForm.email}
                onChange={e => setNewForm(p => ({ ...p, email: e.target.value }))}
                placeholder="e.g. jane@example.com"
                style={INPUT_STYLE}
              />
            </div>
            <div style={INPUT_BOX}>
              <span style={INPUT_LABEL}>ROLE (optional)</span>
              <input
                type="text"
                value={newForm.role}
                onChange={e => setNewForm(p => ({ ...p, role: e.target.value }))}
                placeholder="e.g. PTC3"
                style={INPUT_STYLE}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ToggleChip
                label="Authority to Sign"
                active={newForm.authorityToSign}
                onToggle={() => setNewForm(p => ({ ...p, authorityToSign: !p.authorityToSign }))}
              />
              <span style={{ fontSize: 12, color: 'var(--subtext-color)' }}>Selectable as approving supervisor</span>
            </div>
          </div>
          {addError && <p style={{ color: AP_RED, fontSize: 13, fontWeight: 600, marginTop: 10 }}>{addError}</p>}
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button
              onClick={() => { setShowAdd(false); setAddError('') }}
              style={{ flex: 1, padding: '12px', background: 'var(--input-bg)', border: '1px solid var(--card-border)', borderRadius: 8, fontSize: 14, fontWeight: 600, color: 'var(--text-color)', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={adding}
              style={{ ...BTN_PRIMARY, flex: 2, padding: '12px', opacity: adding ? 0.6 : 1 }}
            >
              {adding ? 'Adding...' : 'Add'}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          style={{ ...BTN_PRIMARY, background: 'transparent', color: AP_RED, border: `1.5px solid ${AP_RED}` }}
        >
          + Add Person
        </button>
      )}
    </>
  )
}

function ToggleChip({ label, active, onToggle, disabled }) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      style={{
        padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
        border: `1.5px solid ${active ? AP_RED : 'var(--tab-border)'}`,
        background: active ? AP_RED : 'var(--tab-bg)',
        color: active ? 'white' : 'var(--tab-color)',
        cursor: 'pointer', opacity: disabled ? 0.5 : 1, transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  )
}

// ── Main Admin ────────────────────────────────────────────────────────────────
export default function Admin() {
  const [unlocked, setUnlocked] = useState(
    sessionStorage.getItem('admin_unlocked') === '1'
  )
  const [tab, setTab] = useState('swaps')

  const navigate = useNavigate()

  if (!unlocked) return <PinGate correctPin={CORRECT_PIN} sessionKey="admin_unlocked" onUnlock={() => setUnlocked(true)} />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100svh' }}>
      <Header showAdmin />

      <div style={{ flex: 1, padding: '1rem', paddingBottom: '2rem' }}>

        <button
          onClick={() => tab === 'mailing' ? setTab('swaps') : navigate(-1)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: AP_RED, fontSize: 14, fontWeight: 600, padding: 0, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}
        >
          ‹ Back
        </button>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: '1rem' }}>
          {[{ value: 'swaps', label: 'Swap Requests' }, { value: 'mailing', label: 'Mailing List' }].map(t => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              style={{
                flex: 1, padding: '9px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                border: `1.5px solid ${tab === t.value ? AP_RED : 'var(--tab-border)'}`,
                background: tab === t.value ? AP_RED : 'var(--tab-bg)',
                color: tab === t.value ? 'white' : 'var(--tab-color)',
                cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'swaps' ? <SwapRequestsTab /> : <MailingListTab />}
      </div>
    </div>
  )
}
