import { useRef, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import SwapTable from '../components/SwapTable'
import SignaturePad from '../components/SignaturePad'
import { getSwap, updateSwap } from '../dataService'
import { formatDate, formatWeekType } from '../utils/helpers'
import { AP_RED, CARD, FIELD_LABEL, BTN_PRIMARY } from '../theme'

export default function Screen3() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const swapId = searchParams.get('swapId')

  const [swap, setSwap] = useState(() => (swapId ? getSwap(swapId) : null))
  const sigRef = useRef(null)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  if (!swap) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100svh' }}>
        <Header />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--subtext-color)', fontSize: 14 }}>
            Invalid or expired link.{' '}
            <button onClick={() => navigate('/screen1')} style={{ color: AP_RED, fontWeight: 700, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}>
              Go home
            </button>
          </p>
        </div>
      </div>
    )
  }

  const alreadySigned = swap.status !== "Awaiting Driver B's Signature"

  const handleSubmit = () => {
    if (sigRef.current?.isEmpty()) {
      setError('Signature is required')
      return
    }
    const updated = updateSwap(swapId, {
      driverBSignature: sigRef.current.toDataURL(),
      driverBSignedDate: new Date().toISOString(),
      status: "Awaiting Supervisor's Signature",
    })
    setSwap(updated)
    setDone(true)
  }

  const showDone = done || alreadySigned

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100svh' }}>
      <Header />

      <div style={{ flex: 1, padding: '1rem', paddingBottom: '2rem' }}>

        <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-color)', textAlign: 'center', marginBottom: '1rem' }}>
          Driver B — Signature Required
        </p>

        {/* Details card */}
        <div style={CARD}>
          <SwapTable swap={swap} />

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

        {/* Signature / done card */}
        <div style={CARD}>
          {showDone ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem 0', gap: '1.25rem' }}>
              <p style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-color)', textAlign: 'center' }}>
                ✅ Swap Request Completed!
              </p>
              <button onClick={() => navigate('/screen1')} style={{ ...BTN_PRIMARY, maxWidth: 240 }}>
                OK
              </button>
            </div>
          ) : (
            <>
              <span style={FIELD_LABEL}>Signature</span>
              <SignaturePad ref={sigRef} />
              {error && (
                <p style={{ color: AP_RED, fontSize: 13, fontWeight: 700, textAlign: 'center', marginTop: '0.5rem' }}>
                  {error}
                </p>
              )}
              <div style={{ marginTop: '1rem' }}>
                <button onClick={handleSubmit} style={BTN_PRIMARY}>
                  Submit
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
