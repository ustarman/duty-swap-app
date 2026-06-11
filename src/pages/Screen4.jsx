import { useRef, useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import SwapTable from '../components/SwapTable'
import SignaturePad from '../components/SignaturePad'
import { getSwap, updateSwap, getSupervisors, getAllActiveRecipients, sendCompletionEmail } from '../dataService'
import { formatDate, formatDateTime, formatWeekType } from '../utils/helpers'
import { AP_RED, CARD, INPUT_BOX, INPUT_LABEL, INPUT_STYLE, FIELD_LABEL, BTN_PRIMARY } from '../theme'

function SigThumb({ label, src, signedAt }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--label-color)', marginBottom: 4 }}>{label}</p>
      {src ? (
        <img
          src={src}
          alt={label}
          style={{ border: '1px solid var(--card-border)', background: 'white', width: '100%', height: 52, objectFit: 'contain', borderRadius: 6 }}
        />
      ) : (
        <div
          style={{ border: '1px solid var(--card-border)', background: 'var(--input-bg)', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6 }}
        >
          <span style={{ color: 'var(--subtext-color)', fontSize: 12 }}>—</span>
        </div>
      )}
      {signedAt && (
        <p style={{ fontSize: 10, color: 'var(--subtext-color)', marginTop: 3 }}>{formatDateTime(signedAt)}</p>
      )}
    </div>
  )
}

export default function Screen4() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const swapId = searchParams.get('swapId')

  const [swap, setSwap] = useState(null)
  const [supervisors, setSupervisors] = useState([])
  const [loading, setLoading] = useState(true)
  const sigRef = useRef(null)
  const [supervisorName, setSupervisorName] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [approved, setApproved] = useState(false)

  useEffect(() => {
    const load = async () => {
      const [swapData, supervisorData] = await Promise.all([
        swapId ? getSwap(swapId) : null,
        getSupervisors(),
      ])
      setSwap(swapData)
      setSupervisors(supervisorData)
      setLoading(false)
    }
    load()
  }, [swapId])

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100svh' }}>
        <Header />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: 'var(--subtext-color)', fontSize: 14 }}>Loading...</p>
        </div>
      </div>
    )
  }

  if (!swap) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100svh' }}>
        <Header />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--subtext-color)', fontSize: 14 }}>Swap not found.</p>
        </div>
      </div>
    )
  }

  const handleSubmit = async () => {
    setError('')
    if (!supervisorName) { setError('Please select a supervisor'); return }
    if (sigRef.current?.isEmpty()) { setError('Signature is required'); return }

    setSubmitting(true)
    try {
      const updated = await updateSwap(swapId, {
        supervisorName,
        supervisorSignature: sigRef.current.toDataURL(),
        supervisorSignedDate: new Date().toISOString(),
        status: 'Completed',
      })
      setApproved(true)
      setSwap(updated)

      // Send completion email to all active recipients
      const recipients = await getAllActiveRecipients()
      await sendCompletionEmail(updated, recipients)
    } catch {
      setError('Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100svh' }}>
      <Header />

      <div style={{ flex: 1, padding: '1rem', paddingBottom: '2rem' }}>

        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
          {window.history.length > 1 ? (
            <button
              onClick={() => navigate(-1)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: AP_RED, fontSize: 14, fontWeight: 600, padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}
            >
              ‹ Back
            </button>
          ) : (
            <div style={{ width: 48 }} />
          )}
          <p style={{ flex: 1, fontWeight: 700, fontSize: 15, color: 'var(--text-color)', textAlign: 'center', margin: 0 }}>
            Supervisor Approval
          </p>
          <div style={{ width: 48 }} />
        </div>

        {/* Details card */}
        <div style={CARD}>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--label-color)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Swap Details
          </p>

          <SwapTable swap={swap} />

          {/* Sig thumbnails */}
          <div style={{ display: 'flex', gap: 10, marginTop: '0.75rem' }}>
            <SigThumb label="Driver A Signature" src={swap.driverASignature} signedAt={swap.driverASignedDate} />
            <SigThumb label="Driver B Signature" src={swap.driverBSignature} signedAt={swap.driverBSignedDate} />
          </div>

          <div style={{ marginTop: '0.75rem', borderTop: '0.5px solid var(--divider-color)', paddingTop: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 6 }}>
              <span style={{ fontSize: 13, color: 'var(--label-color)' }}>Week Commencing</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-color)' }}>{formatDate(swap.weekCommencing)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: 'var(--label-color)' }}>Week Type</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-color)' }}>{formatWeekType(swap)}</span>
            </div>
          </div>
        </div>

        {/* Action card */}
        <div style={CARD}>

          {/* Awaiting Driver B */}
          {!approved && swap.status === "Awaiting Driver B's Signature" && (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <p style={{ fontSize: 13, color: 'var(--label-color)', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                Waiting for Driver B's signature before supervisor approval can proceed.
              </p>
              <button
                onClick={() => navigate(`/screen2?swapId=${swapId}`)}
                style={{ fontSize: 13, fontWeight: 700, color: AP_RED, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                View Share Page
              </button>
            </div>
          )}

          {/* Awaiting Supervisor */}
          {!approved && swap.status === "Awaiting Supervisor's Signature" && (
            <>
              <div style={{ marginBottom: '0.75rem' }}>
                <span style={FIELD_LABEL}>Select PTC3</span>
                <div style={INPUT_BOX}>
                  <span style={INPUT_LABEL}>SUPERVISOR</span>
                  <select
                    value={supervisorName}
                    onChange={e => setSupervisorName(e.target.value)}
                    style={{ ...INPUT_STYLE, cursor: 'pointer' }}
                  >
                    <option value="">— Select Supervisor —</option>
                    {supervisors.map(s => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '0.75rem' }}>
                <span style={FIELD_LABEL}>Signature</span>
                <SignaturePad ref={sigRef} />
              </div>

              {error && (
                <p style={{ color: AP_RED, fontSize: 13, fontWeight: 700, textAlign: 'center', marginBottom: '0.75rem' }}>
                  {error}
                </p>
              )}

              <button onClick={handleSubmit} disabled={submitting} style={{ ...BTN_PRIMARY, opacity: submitting ? 0.6 : 1 }}>
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </>
          )}

          {/* Just approved this session */}
          {approved && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem 0', gap: '1rem' }}>
              <p style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-color)', textAlign: 'center' }}>
                ✅ Swap Request Approved!
              </p>
              <p style={{ fontSize: 14, color: 'var(--subtext-color)', textAlign: 'center', lineHeight: 1.6 }}>
                The approval has been completed.{'\n'}You may now close this app.
              </p>
            </div>
          )}

          {/* Already completed read-only */}
          {!approved && swap.status === 'Completed' && (
            <>
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '0.5px solid var(--divider-color)' }}>
                  <span style={{ fontSize: 13, color: 'var(--label-color)' }}>Approved by</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-color)' }}>{swap.supervisorName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8 }}>
                  <span style={{ fontSize: 13, color: 'var(--label-color)' }}>Approval Date</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-color)' }}>{formatDateTime(swap.supervisorSignedDate)}</span>
                </div>
              </div>

              {swap.supervisorSignature && (
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                  <img
                    src={swap.supervisorSignature}
                    alt="Supervisor signature"
                    style={{ border: '1px solid var(--card-border)', background: 'white', maxWidth: 220, height: 80, objectFit: 'contain', borderRadius: 6 }}
                  />
                </div>
              )}

              <button onClick={() => navigate('/admin')} style={BTN_PRIMARY}>
                View Status
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
