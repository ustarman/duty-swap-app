import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import Header from '../components/Header'
import SwapTable from '../components/SwapTable'
import { getSwap } from '../dataService'
import { formatDate, formatWeekType } from '../utils/helpers'
import { AP_RED, CARD } from '../theme'

export default function Screen2() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const swapId = searchParams.get('swapId')

  const [swap, setSwap] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!swapId) { setLoading(false); return }
    getSwap(swapId).then(data => {
      setSwap(data)
      setLoading(false)
    })
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
          <p style={{ color: 'var(--subtext-color)', fontSize: 14 }}>
            Swap not found.{' '}
            <button onClick={() => navigate('/screen1')} style={{ color: AP_RED, fontWeight: 700, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}>
              Start new request
            </button>
          </p>
        </div>
      </div>
    )
  }

  const screen3Url = `${window.location.origin}${import.meta.env.BASE_URL}screen3?swapId=${swapId}`

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(screen3Url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100svh' }}>
      <Header />

      <div style={{ flex: 1, padding: '1rem', paddingBottom: '2rem' }}>

        {/* Details card */}
        <div style={CARD}>
          <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-color)', textAlign: 'center', marginBottom: '0.75rem' }}>
            Swap Request Submitted!
          </p>

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

        {/* Share card */}
        <div style={CARD}>
          <p style={{ fontSize: 13, color: 'var(--label-color)', textAlign: 'center', marginBottom: '1rem', lineHeight: 1.5 }}>
            Share the QR code or link with{' '}
            <span style={{ color: AP_RED, fontWeight: 700 }}>{swap.driverBName}</span>{' '}
            to collect their signature.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <div style={{ padding: 12, border: '2px solid var(--card-border)', borderRadius: 8, background: 'white', display: 'inline-block' }}>
              <QRCodeSVG value={screen3Url} size={160} fgColor="#000000" bgColor="#ffffff" level="M" />
            </div>
          </div>

          <p style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: 'var(--subtext-color)', marginBottom: '0.75rem' }}>OR</p>

          <button
            onClick={copyLink}
            style={{
              width: '100%',
              padding: '14px',
              background: copied ? '#2e7d32' : AP_RED,
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {copied ? '✓ Copied!' : 'Copy Link'}
          </button>
        </div>
      </div>
    </div>
  )
}
