import { useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSwaps } from '../context/SwapContext'
import Header from '../components/Header'
import SignaturePad from '../components/SignaturePad'
import StatusBadge from '../components/StatusBadge'
import { formatDate } from '../utils/helpers'

const AP_RED = '#E11B22'

function Row({ label, value }) {
  return (
    <div className="flex justify-between items-start py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500 flex-shrink-0">{label}</span>
      <span className="text-sm font-medium text-gray-800 text-right ml-4">{value}</span>
    </div>
  )
}

export default function DriverBSign() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getSwap, updateSwap } = useSwaps()
  const swap = getSwap(id)
  const sigRef = useRef(null)
  const [sigError, setSigError] = useState('')

  if (!swap) {
    return (
      <div className="min-h-svh bg-gray-50 flex flex-col">
        <Header title="Invalid Link" />
        <div className="flex-1 flex items-center justify-center p-8 text-center">
          <div>
            <p className="text-base font-semibold text-gray-700">Link not found</p>
            <p className="text-sm text-gray-400 mt-1">This link may be invalid or expired.</p>
          </div>
        </div>
      </div>
    )
  }

  const alreadySigned = swap.status !== "Awaiting Driver B's Signature"

  if (alreadySigned) {
    return (
      <div className="min-h-svh bg-gray-50 flex flex-col">
        <Header title="Driver B Confirmation" />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-base font-semibold text-gray-800">Already signed</p>
          <p className="text-sm text-gray-500">This request has already been signed by Driver B.</p>
          <StatusBadge status={swap.status} />
        </div>
      </div>
    )
  }

  const handleSubmit = () => {
    if (sigRef.current?.isEmpty()) {
      setSigError('Your signature is required')
      return
    }
    updateSwap(id, {
      driverBSignature: sigRef.current.toDataURL(),
      status: "Awaiting Supervisor's Signature",
    })
  }

  return (
    <div className="min-h-svh bg-gray-50 flex flex-col">
      <Header title="Driver B Confirmation" />

      <div className="flex-1 p-4 space-y-4 pb-8">
        {/* Reference */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">Reference</p>
          <p className="text-sm font-mono font-semibold text-gray-800 mb-2">{id}</p>
          <StatusBadge status={swap.status} />
        </div>

        {/* Swap Details */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">Swap Details</p>
          <Row label="Week Commencing" value={formatDate(swap.weekCommencing)} />
          <Row label="Sunday Only" value={swap.sundayOnly ? 'Yes' : 'No'} />
        </div>

        {/* Driver A */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">Driver A</p>
          <Row label="Name" value={swap.driverAName} />
          <Row label="Duty Number" value={swap.driverADuty} />
        </div>

        {/* Driver B */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">Driver B (You)</p>
          <Row label="Name" value={swap.driverBName} />
          <Row label="Duty Number" value={swap.driverBDuty} />
        </div>

        {/* Signature */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <SignaturePad ref={sigRef} label="Your Signature (Driver B)" />
          {sigError && <p className="mt-1 text-xs text-red-600">{sigError}</p>}
        </div>

        <button
          onClick={handleSubmit}
          className="w-full text-white font-semibold py-4 rounded-2xl text-base shadow-sm active:opacity-90 transition-opacity"
          style={{ backgroundColor: AP_RED }}
        >
          Confirm &amp; Submit
        </button>
      </div>
    </div>
  )
}
