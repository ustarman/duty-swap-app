const STORAGE_KEY = 'bt-duty-swaps'

const SUPERVISORS = [
  { name: 'Brendon Yun', authorityToSign: true },
  { name: 'John Smith', authorityToSign: true },
]

function generateRef() {
  const now = new Date()
  const dd = String(now.getDate()).padStart(2, '0')
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const yyyy = now.getFullYear()
  const hh = String(now.getHours()).padStart(2, '0')
  const min = String(now.getMinutes()).padStart(2, '0')
  const ss = String(now.getSeconds()).padStart(2, '0')
  return `SWAP-${dd}${mm}${yyyy}-${hh}${min}${ss}`
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function persist(swaps) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(swaps))
}

export function createSwap(data) {
  const swaps = load()
  const record = {
    id: Date.now().toString(),
    title: generateRef(),
    ...data,
    status: "Awaiting Driver B's Signature",
    createdAt: new Date().toISOString(),
  }
  swaps.unshift(record)
  persist(swaps)
  return record
}

export function getSwap(id) {
  return load().find(s => s.id === id) ?? null
}

export function updateSwap(id, updates) {
  const swaps = load()
  const idx = swaps.findIndex(s => s.id === id)
  if (idx === -1) return null
  swaps[idx] = { ...swaps[idx], ...updates }
  persist(swaps)
  return swaps[idx]
}

export function getAllSwaps() {
  return load()
}

export function getSupervisors() {
  return SUPERVISORS
}
