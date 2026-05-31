const AP_RED = '#E11B22'

export default function SectionDivider({ title }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', margin: '1rem 0 0.75rem' }}>
      <div style={{ flex: 1, height: 1, background: AP_RED }} />
      <span style={{ padding: '0 10px', fontWeight: 700, fontSize: 13, color: 'var(--text-color)' }}>
        {title}
      </span>
      <div style={{ flex: 1, height: 1, background: AP_RED }} />
    </div>
  )
}
