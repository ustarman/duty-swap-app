import { AP_RED, AP_RED_GRADIENT } from '../theme'
import Swoosh from './Swoosh'

export default function Header({ showAdmin = false }) {
  return (
    <header
      style={{
        background: AP_RED_GRADIENT,
        position: 'relative',
        padding: '1rem 1.25rem 2.9rem',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flexShrink: 0,
      }}
    >
      <div style={{
        width: 38, height: 38, borderRadius: '50%',
        background: 'white', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke={AP_RED}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M7 16V4m0 0L3 8m4-4l4 4" />
          <path d="M17 8v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      </div>
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

      <div style={{
        width: 38, height: 38, borderRadius: '50%',
        background: 'white', flexShrink: 0, overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <img
          src={`${import.meta.env.BASE_URL}icon.jpg`}
          alt="Australia Post"
          width={38}
          height={38}
          style={{ objectFit: 'cover' }}
        />
      </div>

      <Swoosh height={42} />
    </header>
  )
}
