import { AP_RED } from '../theme'

export default function Header({ showAdmin = false }) {
  return (
    <header
      style={{
        background: AP_RED,
        padding: '1rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flexShrink: 0,
      }}
    >
      <svg
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M7 16V4m0 0L3 8m4-4l4 4" />
        <path d="M17 8v12m0 0l4-4m-4 4l-4-4" />
      </svg>
      <div style={{ flex: 1 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: 'white', lineHeight: 1.2 }}>
          Duty Swap
        </h1>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>Brisbane Transport</p>
      </div>
      {showAdmin && (
        <span
          style={{
            fontSize: 11,
            color: 'white',
            border: '1px solid rgba(255,255,255,0.7)',
            borderRadius: 4,
            padding: '2px 8px',
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          Admin
        </span>
      )}
    </header>
  )
}
