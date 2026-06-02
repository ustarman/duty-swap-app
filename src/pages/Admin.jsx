import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import StatusBadge from '../components/StatusBadge'
import { getAllSwaps } from '../dataService'
import { formatDate, formatWeekType } from '../utils/helpers'
import { AP_RED, CARD, BTN_PRIMARY } from '../theme'

const FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Awaiting Driver B', value: "Awaiting Driver B's Signature" },
  { label: 'Awaiting Supervisor', value: "Awaiting Supervisor's Signature" },
  { label: 'Completed', value: 'Completed' },
]

export default function Admin() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')
  const [swaps, setSwaps] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAllSwaps().then(data => {
      setSwaps(data)
      setLoading(false)
    })
  }, [])

  const filtered = filter === 'all' ? swaps : swaps.filter(s => s.status === filter)

  const handleCardClick = swap => {
    if (swap.status === "Awaiting Driver B's Signature") {
      navigate(`/screen2?swapId=${swap.id}`)
    } else {
      navigate(`/screen4?swapId=${swap.id}`)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100svh' }}>
      <Header showAdmin />

      <div style={{ flex: 1, padding: '1rem', paddingBottom: '2rem' }}>
        <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-color)', marginBottom: '0.75rem' }}>
          Swap Requests
        </p>

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
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                }}
              >
                {f.label}
              </button>
            )
          })}
        </div>

        {/* List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--subtext-color)', fontSize: 14 }}>
            Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--subtext-color)', fontSize: 14 }}>
            No swap requests found
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(swap => (
              <button
                key={swap.id}
                onClick={() => handleCardClick(swap)}
                style={{
                  ...CARD,
                  marginBottom: 0,
                  textAlign: 'left',
                  border: `0.5px solid var(--card-border)`,
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-color)', marginBottom: 4 }}>
                  {swap.title}
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-color)', marginBottom: 2 }}>
                  {swap.driverAName}{' '}
                  <span style={{ color: 'var(--subtext-color)' }}>(Duty {swap.driverADuty})</span>
                  {' ↔ '}
                  {swap.driverBName}{' '}
                  <span style={{ color: 'var(--subtext-color)' }}>(Duty {swap.driverBDuty})</span>
                </p>
                <p style={{ fontSize: 12, color: 'var(--subtext-color)', marginBottom: 8 }}>
                  Week of {formatDate(swap.weekCommencing)}
                  {formatWeekType(swap) !== 'Full Week' && (
                    <span style={{ marginLeft: 6, color: '#d97706', fontWeight: 700 }}>• {formatWeekType(swap)}</span>
                  )}
                </p>
                <StatusBadge status={swap.status} />
              </button>
            ))}
          </div>
        )}

        <div style={{ marginTop: '1.5rem' }}>
          <button onClick={() => navigate('/screen1')} style={BTN_PRIMARY}>
            + New Swap Request
          </button>
        </div>
      </div>
    </div>
  )
}
