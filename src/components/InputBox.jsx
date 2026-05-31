import { INPUT_BOX, INPUT_LABEL } from '../theme'

export default function InputBox({ label, children, style }) {
  return (
    <div style={{ ...INPUT_BOX, ...style }}>
      {label && <span style={INPUT_LABEL}>{label}</span>}
      {children}
    </div>
  )
}
