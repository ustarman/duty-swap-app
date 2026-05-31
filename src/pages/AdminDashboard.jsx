import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSwaps } from '../context/SwapContext'
import Header from '../components/Header'
import StatusBadge from '../components/StatusBadge'
import { formatDate } from '../utils/helpers'

const AP_RED = '#E11B22'

const FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Driver B', value: "Awaiting Driver B's Signature" },
  { label: 'Supervisor', value: "Awaiting Supervisor's Signature" },
  { label: 'Completed', value: 'Completed' },
]

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { swaps } = useSwaps()
  const [filter, setFilter] = useState('all')

  const filtered = filter === 'all' ? swaps : swaps.filter(s => s.status === filter)

  const countFor = val =>
    val === 'all' ? swaps.length : swaps.filter(s => s.status === val).length

  return (
    <div className="min-h-svh bg-gray-50 flex flex-col">
      <Header title="Admin Dashboard" onBack={() => navigate('/')} />

      {/* Filter tabs */}
      <div className="bg-white border-b border-gray-100 flex overflow-x-auto shrink-0" style={{ scrollbarWidth: 'none' }}>
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap flex-shrink-0 border-b-2 transition-colors flex items-center gap-1.5 ${
              filter === f.value
                ? 'border-[#E11B22] text-[#E11B22]'
                : 'border-transparent text-gray-500 active:text-gray-700'
            }`}
          >
            {f.label}
            <span
              className={`text-[10px] font-semibold rounded-full px-1.5 py-0.5 leading-none ${
                filter === f.value ? 'bg-[#E11B22]/10 text-[#E11B22]' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {countFor(f.value)}
            </span>
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 p-3 space-y-2 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400">
            <svg className="w-10 h-10 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm">No swap requests found</p>
          </div>
        ) : (
          filtered.map(swap => (
            <button
              key={swap.id}
              onClick={() => navigate(`/approve/${swap.id}`)}
              className="w-full bg-white rounded-2xl p-4 shadow-sm text-left flex items-start justify-between gap-3 active:bg-gray-50 transition-colors"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-[10px] font-mono text-gray-400 tracking-wide">{swap.id}</p>
                <p className="text-sm font-semibold text-gray-800">
                  {swap.driverAName}
                  <span className="text-gray-400 font-normal mx-1">→</span>
                  {swap.driverBName}
                </p>
                <p className="text-xs text-gray-500">
                  Duty {swap.driverADuty} ↔ Duty {swap.driverBDuty}
                </p>
                <p className="text-xs text-gray-400">
                  Week of {formatDate(swap.weekCommencing)}
                  {swap.sundayOnly && (
                    <span className="ml-1.5 inline-flex items-center text-[10px] bg-orange-50 text-orange-600 border border-orange-200 rounded-full px-1.5 py-0.5 font-semibold">
                      SUN
                    </span>
                  )}
                </p>
                <div className="pt-0.5">
                  <StatusBadge status={swap.status} />
                </div>
              </div>
              <svg
                className="w-4 h-4 text-gray-300 flex-shrink-0 mt-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))
        )}
      </div>

      {/* New request */}
      <div className="p-4 border-t border-gray-100 bg-white flex-shrink-0">
        <button
          onClick={() => navigate('/')}
          className="w-full text-white font-semibold py-3.5 rounded-2xl text-sm active:opacity-90 transition-opacity"
          style={{ backgroundColor: AP_RED }}
        >
          + New Swap Request
        </button>
      </div>
    </div>
  )
}
