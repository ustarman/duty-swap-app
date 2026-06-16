// Australia Post signature swoosh — asymmetric concave diagonal sweep.
// Place as the last child of a red header that has `position: relative`
// and enough padding-bottom (>= 56px) so text never overlaps it.
// `color` must match the page background behind the header (it carves the curve).
export default function Swoosh({ color = 'var(--app-bg)', height = 56 }) {
  return (
    <svg
      viewBox="0 0 330 56"
      preserveAspectRatio="none"
      aria-hidden="true"
      style={{ position: 'absolute', left: 0, bottom: -1, width: '100%', height, pointerEvents: 'none', display: 'block' }}
    >
      {/* v1: red deeper on the right. Mirror horizontally or tune control points (95,40 / 210,52) for depth. */}
      <path d="M0,56 L0,14 C95,40 210,52 330,44 L330,56 Z" fill={color} />
    </svg>
  )
}
