import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { useSwaps } from '../context/SwapContext'
import Header from '../components/Header'
import StatusBadge from '../components/StatusBadge'

const AP_RED = '#E11B22'

export default function ShareScreen() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getSwap } = useSwaps()
  const swap = getSwap(id)
  const [copied, setCopied] = useState(false)

  if (!swap) {
    return (
      <div className="min-h-svh bg-gray-50 flex flex-col">
        <Header title="Not Found" onBack={() => navigate('/')} />
        <div className="flex-1 flex items-center justify-center p-8 text-center text-gray-400">
          <p className="text-sm">Swap request not found.</p>
        </div>
      </div>
    )
  }

  const signUrl = `${window.location.origin}/sign/${id}`

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(signUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="min-h-svh bg-gray-50 flex flex-col">
      <Header title="Request Submitted" onBack={() => navigate('/')} />

      <div className="flex-1 p-4 space-y-4 pb-8">
        {/* Success banner */}
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-start gap-3">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ backgroundColor: '#16a34a' }}
          >
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-green-800">Request submitted successfully</p>
            <p className="text-xs text-green-700 mt-0.5">
              Share the QR code or link below with Driver B to collect their signature.
            </p>
          </div>
        </div>

        {/* Reference */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
            Reference Number
          </p>
          <p className="text-sm font-mono font-semibold text-gray-800 mb-2">{id}</p>
          <StatusBadge status={swap.status} />
        </div>

        {/* QR Code */}
        <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col items-center gap-4">
          <p className="text-sm font-semibold text-gray-700">Share with Driver B</p>
          <div className="p-4 bg-white border-2 border-gray-100 rounded-2xl shadow-sm">
            <QRCodeSVG
              value={signUrl}
              size={192}
              fgColor="#111827"
              bgColor="#ffffff"
              level="M"
            />
          </div>
          <p className="text-xs text-gray-400 text-center leading-relaxed">
            Driver B scans this QR code to review details and add their signature
          </p>
        </div>

        {/* Copy link */}
        <button
          onClick={copyLink}
          className={`w-full py-4 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 border transition-all ${
            copied
              ? 'bg-green-50 border-green-300 text-green-700'
              : 'bg-white border-gray-300 text-gray-700 active:bg-gray-50'
          }`}
        >
          {copied ? (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Copied to clipboard!
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy Link
            </>
          )}
        </button>

        {/* Admin */}
        <button
          onClick={() => navigate('/admin')}
          className="w-full py-3.5 rounded-2xl text-sm font-medium text-gray-500 border border-gray-200 bg-white active:bg-gray-50"
        >
          View Admin Dashboard
        </button>
      </div>
    </div>
  )
}
