import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import Header from '../components/Header'
import SectionDivider from '../components/SectionDivider'
import SignaturePad from '../components/SignaturePad'
import InputBox from '../components/InputBox'
import { createSwap, findDuplicateSwap, getSupervisors, sendApprovalEmail } from '../dataService'
import { normalizeDuty } from '../utils/helpers'
import { AP_RED, CARD, INPUT_STYLE, FIELD_LABEL, BTN_PRIMARY } from '../theme'

const WEEK_TYPES = [
  { label: 'Sunday Only', value: 'sunday' },
  { label: 'Sun to Fri', value: 'sun-fri' },
  { label: 'Mon to Fri', value: 'mon-fri' },
]

const EMPTY_FORM = {
  weekCommencing: null,
  weekType: null,
  driverAName: '',
  driverADuty: '',
  driverBName: '',
  driverBDuty: '',
}

function getInitialForm() {
  // 1. URL params — works in both browser tabs and PWA context
  const params = new URLSearchParams(window.location.search)
  const wc = params.get('weekCommencing')
  if (wc || params.get('driverAName')) {
    return {
      weekCommencing: wc ? new Date(wc + 'T12:00:00') : null,
      weekType: params.get('weekType') || null,
      driverAName: params.get('driverAName') || '',
      driverADuty: params.get('driverADuty') || '',
      driverBName: params.get('driverBName') || '',
      driverBDuty: params.get('driverBDuty') || '',
    }
  }
  // 2. localStorage — fallback for same-origin browser tabs
  try {
    const stored = localStorage.getItem('dutySwapPrefill')
    if (stored) {
      const data = JSON.parse(stored)
      localStorage.removeItem('dutySwapPrefill')
      if (data._ts && Date.now() - data._ts > 2 * 60 * 1000) return EMPTY_FORM
      return {
        weekCommencing: data.weekCommencing ? new Date(data.weekCommencing + 'T12:00:00') : null,
        weekType: data.weekType || null,
        driverAName: data.driverAName || '',
        driverADuty: data.driverADuty || '',
        driverBName: data.driverBName || '',
        driverBDuty: data.driverBDuty || '',
      }
    }
  } catch {}
  return EMPTY_FORM
}

function FieldGroup({ label, children }) {
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      {label && <span style={FIELD_LABEL}>{label}</span>}
      {children}
    </div>
  )
}

export default function Screen1() {
  const navigate = useNavigate()
  const sigRef = useRef(null)
  const sigBRef = useRef(null)
  const submitLock = useRef(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState(getInitialForm)
  const [bHere, setBHere] = useState(false)
  const [done, setDone] = useState(false)
  const [emailFailed, setEmailFailed] = useState(false)

  const set = field => e =>
    setForm(prev => ({
      ...prev,
      [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
    }))

  const handleSubmit = async () => {
    setError('')
    if (!form.weekCommencing) { setError('Week Commencing is required'); return }
    if (!form.weekType) { setError('Week Type is required'); return }

    if (!form.driverAName.trim()) { setError('Driver A Name is required'); return }
    if (!form.driverADuty.trim()) { setError('Driver A Duty Number is required'); return }
    if (!form.driverBName.trim()) { setError('Driver B Name is required'); return }
    if (!form.driverBDuty.trim()) { setError('Driver B Duty Number is required'); return }
    if (sigRef.current?.isEmpty()) { setError('Driver A signature is required'); return }
    if (bHere && sigBRef.current?.isEmpty()) { setError('Driver B signature is required'); return }

    // Synchronous guard against double-tap (setSubmitting only applies on next render)
    if (submitLock.current) return
    submitLock.current = true

    setSubmitting(true)
    try {
      const wc = form.weekCommencing
      const weekStr = `${wc.getFullYear()}-${String(wc.getMonth() + 1).padStart(2, '0')}-${String(wc.getDate()).padStart(2, '0')}`
      const dutyA = normalizeDuty(form.driverADuty)
      const dutyB = normalizeDuty(form.driverBDuty)

      const duplicate = await findDuplicateSwap(form.driverAName, dutyA, form.driverBName, dutyB, weekStr)
      if (duplicate) {
        setError(`An identical swap request already exists for this week (Ref: ${duplicate.title}, Status: ${duplicate.status}). Please check with your supervisor or admin.`)
        return
      }

      const record = await createSwap({
        weekCommencing: weekStr,
        weekType: form.weekType,
        driverAName: form.driverAName,
        driverADuty: dutyA,
        driverBName: form.driverBName,
        driverBDuty: dutyB,
        driverASignature: sigRef.current.toDataURL(),
        driverASignedDate: new Date().toISOString(),
        ...(bHere && {
          driverBSignature: sigBRef.current.toDataURL(),
          driverBSignedDate: new Date().toISOString(),
        }),
      })

      if (bHere) {
        // Both drivers signed on the spot — notify supervisors, skip the share step
        const supervisors = await getSupervisors()
        const result = await sendApprovalEmail(record, supervisors)
        if (!result?.ok) setEmailFailed(true)
        setDone(true)
      } else {
        navigate(`/screen2?swapId=${record.id}`)
      }
    } catch (err) {
      if (err?.code === 'DUPLICATE_SWAP') {
        setError('An identical swap request already exists for this week. Please check with your supervisor or admin.')
      } else {
        setError('Failed to save. Please try again.')
      }
    } finally {
      submitLock.current = false
      setSubmitting(false)
    }
  }

  const startNew = () => {
    setForm({ ...EMPTY_FORM })
    setBHere(false)
    setEmailFailed(false)
    setDone(false)
  }

  if (done) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100svh' }}>
        <Header />
        <div style={{ flex: 1, padding: '1rem', paddingBottom: '2rem' }}>
          <div style={CARD}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem 0', gap: '1.25rem' }}>
              <p style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-color)', textAlign: 'center' }}>
                ✅ Signed!{!emailFailed && ' Supervisors have been notified.'}
              </p>
              {emailFailed && (
                <p style={{
                  fontSize: 13, fontWeight: 600, color: '#92600a',
                  background: '#FFF8E5', border: '1px solid #F2DC9F',
                  borderRadius: 8, padding: '10px 14px',
                  textAlign: 'center', lineHeight: 1.5,
                }}>
                  ⚠️ However, the notification email could not be sent.<br />
                  Please contact a supervisor directly.
                </p>
              )}
              <button onClick={startNew} style={{ ...BTN_PRIMARY, maxWidth: 240 }}>
                OK
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100svh' }}>
      <Header />

      <div style={{ flex: 1, padding: '1rem', paddingBottom: '2rem' }}>

        {/* Schedule card */}
        <div style={CARD}>
          <FieldGroup label="Week Commencing">
            <InputBox>
              <span style={{ fontSize: 11, color: 'var(--input-label-color)', fontWeight: 600, letterSpacing: '0.5px', display: 'block', marginBottom: 4 }}>
                DATE
              </span>
              <DatePicker
                selected={form.weekCommencing}
                onChange={date => setForm(prev => ({ ...prev, weekCommencing: date }))}
                calendarStartDay={0}
                dateFormat="dd/MM/yyyy"
                placeholderText="dd/mm/yyyy"
                customInput={<input readOnly inputMode="none" style={{ ...INPUT_STYLE, width: '100%', cursor: 'pointer' }} />}
                withPortal
              />
            </InputBox>
          </FieldGroup>

          <div style={{ marginTop: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--label-color)', fontWeight: 600, display: 'block', marginBottom: 6 }}>WEEK TYPE</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
              {WEEK_TYPES.map(wt => {
                const active = form.weekType === wt.value
                return (
                  <button
                    key={String(wt.value)}
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, weekType: wt.value }))}
                    style={{
                      padding: '7px 4px',
                      border: `1.5px solid ${active ? AP_RED : 'var(--tab-border)'}`,
                      borderRadius: 8,
                      background: active ? AP_RED : 'var(--tab-bg)',
                      color: active ? 'white' : 'var(--tab-color)',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {wt.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Driver A */}
        <SectionDivider title="Driver A" />

        <div style={CARD}>
          <FieldGroup label="Name">
            <InputBox>
              <span style={{ fontSize: 11, color: 'var(--input-label-color)', fontWeight: 600, letterSpacing: '0.5px', display: 'block', marginBottom: 4 }}>
                FULL NAME
              </span>
              <input
                type="text"
                value={form.driverAName}
                onChange={set('driverAName')}
                style={INPUT_STYLE}
                placeholder="e.g. John Smith"
              />
            </InputBox>
          </FieldGroup>

          <FieldGroup label="Duty Number">
            <InputBox>
              <span style={{ fontSize: 11, color: 'var(--input-label-color)', fontWeight: 600, letterSpacing: '0.5px', display: 'block', marginBottom: 4 }}>
                DUTY NO.
              </span>
              <input
                type="text"
                value={form.driverADuty}
                onChange={set('driverADuty')}
                style={INPUT_STYLE}
                placeholder="e.g. BT100 or RDO/Spare"
              />
            </InputBox>
          </FieldGroup>

          <div>
            <span style={FIELD_LABEL}>Signature</span>
            <SignaturePad ref={sigRef} />
          </div>
        </div>

        {/* Driver B */}
        <SectionDivider title="Driver B" />

        <div style={CARD}>
          <FieldGroup label="Name">
            <InputBox>
              <span style={{ fontSize: 11, color: 'var(--input-label-color)', fontWeight: 600, letterSpacing: '0.5px', display: 'block', marginBottom: 4 }}>
                FULL NAME
              </span>
              <input
                type="text"
                value={form.driverBName}
                onChange={set('driverBName')}
                style={INPUT_STYLE}
                placeholder="e.g. Jane Doe"
              />
            </InputBox>
          </FieldGroup>

          <FieldGroup label="Duty Number">
            <InputBox>
              <span style={{ fontSize: 11, color: 'var(--input-label-color)', fontWeight: 600, letterSpacing: '0.5px', display: 'block', marginBottom: 4 }}>
                DUTY NO.
              </span>
              <input
                type="text"
                value={form.driverBDuty}
                onChange={set('driverBDuty')}
                style={INPUT_STYLE}
                placeholder="e.g. BT135 or RDO/Spare"
              />
            </InputBox>
          </FieldGroup>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', userSelect: 'none', marginTop: 4 }}>
            <input
              type="checkbox"
              checked={bHere}
              onChange={e => setBHere(e.target.checked)}
              style={{ width: 18, height: 18, accentColor: AP_RED, marginTop: 1, flexShrink: 0 }}
            />
            <span>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-color)', display: 'block' }}>
                Driver B is here with me
              </span>
              <span style={{ fontSize: 12, color: 'var(--subtext-color)' }}>
                Collect Driver B's signature now.
              </span>
            </span>
          </label>

          {bHere && (
            <div style={{ marginTop: '0.75rem' }}>
              <span style={FIELD_LABEL}>Signature</span>
              <p style={{ fontSize: 12, color: 'var(--subtext-color)', margin: '0 0 6px' }}>
                I, <strong>{form.driverBName.trim() || 'Driver B'}</strong>, agree to this duty swap.
              </p>
              <SignaturePad ref={sigBRef} />
            </div>
          )}
        </div>

        {error && (
          <p style={{ color: AP_RED, fontSize: 13, fontWeight: 700, textAlign: 'center', marginBottom: '1rem' }}>
            {error}
          </p>
        )}

        <button onClick={handleSubmit} disabled={submitting} style={{ ...BTN_PRIMARY, opacity: submitting ? 0.6 : 1 }}>
          {submitting ? 'Saving...' : 'Submit'}
        </button>

      </div>
    </div>
  )
}
