import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import StatusBadge from '../components/StatusBadge'
import { getAllSwaps } from '../dataService'
import { formatDate, formatWeekType } from '../utils/helpers'
import { AP_RED } from '../theme'

const FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Awaiting Driver B', value: "Awaiting Driver B's Signature" },
  { label: 'Awaiting Supervisor', value: "Awaiting Supervisor's Signature" },
  { label: 'Completed', value: 'Completed' },
]

const TH = {
  padding: '10px 12px',
  textAlign: 'left',
  fontSize: 12,
  fontWeight: 700,
  color: 'var(--label-color)',
  whiteSpace: 'nowrap',
  borderBottom: '2px solid var(--divider-color)',
  background: 'var(--card-bg)',
  position: 'sticky',
  top: 0,
}

const TD = {
  padding: '10px 12px',
  fontSize: 13,
  color: 'var(--text-color)',
  whiteSpace: 'nowrap',
  borderBottom: '1px solid var(--divider-color)',
  verticalAlign: 'middle',
}

export default function Admin() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [swaps, setSwaps] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAllSwaps().then(data => {
      setSwaps(data)
      setLoading(false)
    })
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
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100svh' }}>
      <Header showAdmin />

      <div style={{ flex: 1, padding: '1rem', paddingBottom: '2rem' }}>
        <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-color)', marginBottom: '0.75rem' }}>
          Swap Requests
        </p>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: 'var(--subtext-color)' }}>🔍</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name..."
            style={{
              width: '100%',
              padding: '10px 12px 10px 36px',
              border: '1.5px solid var(--card-border)',
              borderRadius: 8,
              background: 'var(--card-bg)',
              color: 'var(--text-color)',
              fontSize: 14,
              outline: 'none',
              boxSizing: 'border-box',
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
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                style={{
                  flex: '1 1 auto',
                  padding: '7px 10px',
                  border: `1.5px solid ${isActive ? AP_RED : 'var(--tab-border)'}`,
                  borderRadius: 8,
                  background: isActive ? AP_RED : 'var(--tab-bg)',
                  color: isActive ? 'white' : 'var(--tab-color)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {f.label}
              </button>
            )
          })}
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--subtext-color)', fontSize: 14 }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--subtext-color)', fontSize: 14 }}>No swap requests found</div>
        ) : (
          <div style={{ overflowX: 'auto', border: '0.5px solid var(--card-border)', borderRadius: 10, background: 'var(--card-bg)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
              <thead>
                <tr>
                  <th style={TH}>Reference</th>
                  <th style={TH}>Driver A</th>
                  <th style={TH}>Duty A</th>
                  <th style={TH}>Driver B</th>
                  <th style={TH}>Duty B</th>
                  <th style={TH}>Week</th>
                  <th style={TH}>Week Type</th>
                  <th style={TH}>Status</th>
                  <th style={TH}>Supervisor</th>
                  <th style={TH}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((swap, i) => (
                  <tr
                    key={swap.id}
                    style={{ background: i % 2 === 0 ? 'var(--card-bg)' : 'var(--input-bg)' }}
                  >
                    <td style={{ ...TD, fontWeight: 700, fontSize: 12, color: AP_RED }}>{swap.title}</td>
                    <td style={TD}>{swap.driverAName}</td>
                    <td style={{ ...TD, color: 'var(--subtext-color)' }}>{swap.driverADuty}</td>
                    <td style={TD}>{swap.driverBName}</td>
                    <td style={{ ...TD, color: 'var(--subtext-color)' }}>{swap.driverBDuty}</td>
                    <td style={TD}>{formatDate(swap.weekCommencing)}</td>
                    <td style={{ ...TD, color: 'var(--subtext-color)' }}>{formatWeekType(swap)}</td>
                    <td style={TD}><StatusBadge status={swap.status} /></td>
                    <td style={{ ...TD, color: 'var(--subtext-color)' }}>{swap.supervisorName || '—'}</td>
                    <td style={TD}>
                      <button
                        onClick={() => navigate(`/screen4?swapId=${swap.id}`)}
                        style={{
                          padding: '4px 10px',
                          fontSize: 12,
                          fontWeight: 600,
                          border: `1px solid ${AP_RED}`,
                          borderRadius: 6,
                          background: 'transparent',
                          color: AP_RED,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
