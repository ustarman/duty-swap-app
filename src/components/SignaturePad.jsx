import { forwardRef, useImperativeHandle, useRef, useEffect, useState } from 'react'
import SignatureCanvas from 'react-signature-canvas'

function PenIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
    </svg>
  )
}

function EraserIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M15.14 3c-.51 0-1.02.2-1.41.59L2.59 14.73a2 2 0 000 2.83l2.27 2.27c.2.19.44.28.71.28h3.89L20.29 9.27a1.996 1.996 0 000-2.83L16.56 3.6A2 2 0 0015.14 3zm0 2 3.73 3.73-2.33 2.33-3.73-3.73 2.33-2.33zm-3.75 3.75 3.73 3.73-6.67 6.67H5.57L3.41 17l7.98-7.98z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
    </svg>
  )
}

const SignaturePad = forwardRef(({ disabled = false }, ref) => {
  const internalRef = useRef(null)
  const containerRef = useRef(null)
  const [canvasWidth, setCanvasWidth] = useState(null)
  const [mode, setMode] = useState('pen')

  useEffect(() => {
    if (containerRef.current) {
      const w = containerRef.current.offsetWidth
      if (w > 10) setCanvasWidth(w)
    }
  }, [])

  useImperativeHandle(ref, () => ({
    clear: () => internalRef.current?.clear(),
    isEmpty: () => internalRef.current?.isEmpty() ?? true,
    toDataURL: () => internalRef.current?.toDataURL(),
  }))

  const applyPen = () => {
    const sp = internalRef.current?.getSignaturePad?.()
    if (sp) {
      sp.penColor = '#000000'
      sp.minWidth = 0.5
      sp.maxWidth = 2.5
    }
    setMode('pen')
  }

  const applyEraser = () => {
    const sp = internalRef.current?.getSignaturePad?.()
    if (sp) {
      sp.penColor = '#ffffff'
      sp.minWidth = 14
      sp.maxWidth = 18
    }
    setMode('eraser')
  }

  const handleClear = () => {
    internalRef.current?.clear()
    applyPen()
  }

  return (
    <div style={{ border: '2px solid black', borderRadius: 10, overflow: 'hidden' }}>
      <div ref={containerRef} className="bg-white">
        {disabled ? (
          <div
            className="flex items-center justify-center text-gray-400 text-xs italic bg-white"
            style={{ height: 100 }}
          >
            No signature
          </div>
        ) : canvasWidth ? (
          <SignatureCanvas
            ref={internalRef}
            penColor="#000000"
            canvasProps={{
              width: canvasWidth,
              height: 100,
              style: { display: 'block', width: '100%', height: '100px' },
            }}
            backgroundColor="white"
          />
        ) : (
          <div style={{ height: 100 }} />
        )}
      </div>

      {!disabled && (
        <div className="flex items-center justify-center gap-8 py-2.5 bg-black">
          <button
            type="button"
            onClick={applyPen}
            title="Pen"
            className={`transition-opacity ${mode === 'pen' ? 'text-white opacity-100' : 'text-white opacity-35'}`}
          >
            <PenIcon />
          </button>
          <button
            type="button"
            onClick={applyEraser}
            title="Eraser"
            className={`transition-opacity ${mode === 'eraser' ? 'text-white opacity-100' : 'text-white opacity-35'}`}
          >
            <EraserIcon />
          </button>
          <button
            type="button"
            onClick={handleClear}
            title="Clear all"
            className="text-white opacity-60 hover:opacity-100 transition-opacity"
          >
            <TrashIcon />
          </button>
        </div>
      )}
    </div>
  )
})

SignaturePad.displayName = 'SignaturePad'
export default SignaturePad
