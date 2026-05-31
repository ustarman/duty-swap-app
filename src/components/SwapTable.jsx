const AP_RED = '#E11B22'

const TD = {
  padding: '8px',
  border: '1px solid var(--card-border)',
  color: 'var(--text-color)',
  fontSize: 13,
}

export default function SwapTable({ swap }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ background: AP_RED }}>
          {['Driver', 'Current Duty', 'New Duty'].map(h => (
            <th
              key={h}
              style={{
                ...TD,
                color: 'white',
                fontWeight: 700,
                border: '1px solid #b81519',
                textAlign: 'left',
              }}
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        <tr style={{ background: 'var(--card-bg)' }}>
          <td style={TD}>{swap.driverAName}</td>
          <td style={TD}>{swap.driverADuty}</td>
          <td style={TD}>{swap.driverBDuty}</td>
        </tr>
        <tr style={{ background: 'var(--input-bg)' }}>
          <td style={TD}>{swap.driverBName}</td>
          <td style={TD}>{swap.driverBDuty}</td>
          <td style={TD}>{swap.driverADuty}</td>
        </tr>
      </tbody>
    </table>
  )
}
