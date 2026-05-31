const STYLES = {
  "Awaiting Driver B's Signature": 'bg-blue-100 text-blue-800 border-blue-300',
  "Awaiting Supervisor's Signature": 'bg-orange-100 text-orange-800 border-orange-300',
  'Completed': 'bg-green-100 text-green-800 border-green-300',
}

export default function StatusBadge({ status }) {
  const cls = STYLES[status] ?? 'bg-gray-100 text-gray-700 border-gray-300'
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold border ${cls}`}>
      {status}
    </span>
  )
}
