export function formatWeekType(swap) {
  if (swap.weekType === 'sunday') return 'Sunday Only'
  if (swap.weekType === 'sun-fri') return 'Sunday to Friday'
  if (swap.weekType === 'mon-fri') return 'Monday to Friday'
  if (swap.weekType == null && swap.sundayOnly) return 'Sunday Only'
  return 'Full Week'
}

export function formatDateTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (isNaN(date.getTime())) return '—'
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const yyyy = date.getFullYear()
  const hh = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`
}

export function formatDate(value) {
  if (!value) return '—'
  let date
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number)
    date = new Date(year, month - 1, day)
  } else {
    date = new Date(value)
  }
  if (isNaN(date.getTime())) return '—'
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const yyyy = date.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}
