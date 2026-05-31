import { createContext, useContext, useState, useEffect } from 'react'
import { initialSwaps } from '../data/mockData'

const SwapContext = createContext(null)

export function SwapProvider({ children }) {
  const [swaps, setSwaps] = useState(() => {
    try {
      const stored = localStorage.getItem('duty-swaps')
      return stored ? JSON.parse(stored) : initialSwaps
    } catch {
      return initialSwaps
    }
  })

  useEffect(() => {
    localStorage.setItem('duty-swaps', JSON.stringify(swaps))
  }, [swaps])

  function addSwap(swap) {
    setSwaps(prev => [swap, ...prev])
  }

  function updateSwap(id, updates) {
    setSwaps(prev => prev.map(s => (s.id === id ? { ...s, ...updates } : s)))
  }

  function getSwap(id) {
    return swaps.find(s => s.id === id) ?? null
  }

  return (
    <SwapContext.Provider value={{ swaps, addSwap, updateSwap, getSwap }}>
      {children}
    </SwapContext.Provider>
  )
}

export const useSwaps = () => useContext(SwapContext)
