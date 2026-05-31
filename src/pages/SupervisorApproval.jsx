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

export default function SupervisorApproval() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getSwap, updateSwap } = useSwaps()
  const swap = getSwap(id)
  const sigRef = useRef(null)
  const [decision, setDecision] = useState('Approved')
  const [sigError, setSigError] = useState('')

  if (!swap) {
    return (
      <div className="min-h-svh bg-gray-50 flex flex-col">
        <Header title="Not Found" onBack={() => navigate('/admin')} />
        <div className="flex-1 flex items-center justify-center p-8 text-center text-gray-400">
          <p className="text-sm">Swap request not found.</p>
        </div>
      </div>
    )
  }

  /* ── Awaiting Driver B ── */
  if (swap.status === "Awaiting Driver B's Signature") {
    return (
      <div className="min-h-svh bg-gray-50 flex flex-col">
        <Header title="Swap Details" onBack={() => navigate('/admin')} />
        <div className="flex-1 p-4 space-y-4 pb-8">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">Reference</p>
            <p className="text-sm font-mono font-semibold text-gray-800 mb-2">{id}</p>
            <StatusBadge status={swap.status} />
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">Swap Details</p>
            <Row label="Week Commencing" value={formatDate(swap.weekCommencing)} />
            <Row label="Sunday Only" value={swap.sundayOnly ? 'Yes' : 'No'} />
            <Row label="Driver A" value={`${swap.driverAName} · Duty ${swap.driverADuty}`} />
            <Row label="Driver B" value={`${swap.driverBName} · Duty ${swap.driverBDuty}`} />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <p className="text-sm font-medium text-amber-800">Awaiting Driver B</p>
            <p className="text-xs text-amber-700 mt-1">
              This request is pending Driver B's signature. Supervisor approval will be available once Driver B has signed.
            </p>
          </div>

          <button
            onClick={() => navigate(`/share/${id}`)}
            className="w-full py-3.5 rounded-2xl text-sm font-medium text-gray-600 border border-gray-300 bg-white active:bg-gray-50"
          >
            View Share Page
          </button>
        </div>
      </div>
    )
  }

  /* ── Completed ── */
  if (swap.status === 'Completed') {
    return (
      <div className="min-h-svh bg-gray-50 flex flex-col">
        <Header title="Supervisor Approval" onBack={() => navigate('/admin')} />
        <div className="flex-1 p-4 space-y-4 pb-8">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">Reference</p>
            <p className="text-sm font-mono font-semibold text-gray-800 mb-2">{id}</p>
            <StatusBadge status={swap.status} />
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">Swap Details</p>
            <Row label="Week Commencing" value={formatDate(swap.weekCommencing)} />
            <Row label="Sunday Only" value={swap.sundayOnly ? 'Yes' : 'No'} />
            <Row label="Driver A" value={`${swap.driverAName} · Duty ${swap.driverADuty}`} />
            <Row label="Driver B" value={`${swap.driverBName} · Duty ${swap.driverBDuty}`} />
            {swap.supervisorDecision && (
              <Row label="Decision" value={swap.supervisorDecision} />
            )}
          </div>

          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-green-800">Swap completed</p>
              <p className="text-xs text-green-700 mt-0.5">All signatures have been collected.</p>
            </div>
          </div>

          <button
            onClick={() => navigate('/admin')}
            className="w-full py-3.5 rounded-2xl text-sm font-medium text-gray-600 border border-gray-300 bg-white active:bg-gray-50"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  /* ── Awaiting Supervisor ── */
  const handleSubmit = () => {
    if (sigRef.current?.isEmpty()) {
      setSigError('Supervisor signature is required')
      return
    }
    updateSwap(id, {
      supervisorSignature: sigRef.current.toDataURL(),
      supervisorDecision: decision,
      status: 'Completed',
    })
  }

  return (
    <div className="min-h-svh bg-gray-50 flex flex-col">
      <Header title="Supervisor Approval" onBack={() => navigate('/admin')} />

      <div className="flex-1 p-4 space-y-4 pb-8">
        {/* Reference */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">Reference</p>
          <p className="text-sm font-mono font-semibold text-gray-800 mb-2">{id}</p>
          <StatusBadge status={swap.status} />
        </div>

        {/* Details */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">Swap Details</p>
          <Row label="Week Commencing" value={formatDate(swap.weekCommencing)} />
          <Row label="Sunday Only" value={swap.sundayOnly ? 'Yes' : 'No'} />
          <Row label="Driver A" value={`${swap.driverAName} · Duty ${swap.driverADuty}`} />
          <Row label="Driver B" value={`${swap.driverBName} · Duty ${swap.driverBDuty}`} />
        </div>

        {/* Received signatures */}
        {(swap.driverASignature || swap.driverBSignature) && (
          <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Received Signatures</p>
            {swap.driverASignature && (
              <div>
                <p className="text-xs text-gray-500 mb-1.5">Driver A</p>
                <img
                  src={swap.driverASignature}
                  alt="Driver A signature"
                  className="border border-gray-200 rounded-xl w-full h-16 object-contain bg-white"
                />
              </div>
            )}
            {swap.driverBSignature && (
              <div>
                <p className="text-xs text-gray-500 mb-1.5">Driver B</p>
                <img
                  src={swap.driverBSignature}
                  alt="Driver B signature"
                  className="border border-gray-200 rounded-xl w-full h-16 object-contain bg-white"
                />
              </div>
            )}
          </div>
        )}

        {/* Decision */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Decision</label>
          <select
            value={decision}
            onChange={e => setDecision(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm text-gray-900 bg-white focus:outline-none focus:border-[#E11B22] focus:ring-2 focus:ring-[#E11B22]/20"
          >
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        {/* Supervisor signature */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <SignaturePad ref={sigRef} label="Supervisor Signature" />
          {sigError && <p className="mt-1 text-xs text-red-600">{sigError}</p>}
        </div>

        <button
          onClick={handleSubmit}
          className="w-full text-white font-semibold py-4 rounded-2xl text-base shadow-sm active:opacity-90 transition-opacity"
          style={{ backgroundColor: AP_RED }}
        >
          Submit Decision
        </button>
      </div>
    </div>
  )
}
