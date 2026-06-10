import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import Header from '../components/Header'
import SectionDivider from '../components/SectionDivider'
import SignaturePad from '../components/SignaturePad'
import InputBox from '../components/InputBox'
import { createSwap, findDuplicateSwap } from '../dataService'
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
  try {
    const stored = localStorage.getItem('dutySwapPrefill')
    if (stored) {
      const data = JSON.parse(stored)
      localStorage.removeItem('dutySwapPrefill')
      // Ignore stale data older than 2 minutes
      if (data._ts && Date.now() - data._ts > 2 * 60 * 1000) return EMPTY_FORM
      return {
        weekCommencing: data.weekCommencing ? new Date(data.weekCommencing + 'T12:00:00') : null,
        weekType: data.weekType || null,
        driverAName: data.driverAName || '',
        driverADuty: data.driverADuty || '',
        driverBName: data.driverBName || '',
        driverBDuty: '',
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
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState(getInitialForm)

  const set = field => e =>
    setForm(prev => ({
      ...prev,
      [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
    }))

  const handleSubmit = async () => {
    setError('')
    if (!form.weekCommencing) { setError('Week Commencing is required'); return }

    if (!form.driverAName.trim()) { setError('Driver A Name is required'); return }
    if (!form.driverADuty.trim()) { setError('Driver A Duty Number is required'); return }
    if (!form.driverBName.trim()) { setError('Driver B Name is required'); return }
    if (!form.driverBDuty.trim()) { setError('Driver B Duty Number is required'); return }
    if (sigRef.current?.isEmpty()) { setError('Driver A signature is required'); return }

    setSubmitting(true)
    try {
      const weekStr = form.weekCommencing.toISOString().slice(0, 10)
      const duplicate = await findDuplicateSwap(form.driverAName, form.driverADuty, weekStr)
      if (duplicate) {
        setError(`A swap request for duty ${duplicate.driverADuty} on this week already exists (Ref: ${duplicate.title}, Status: ${duplicate.status}). Please check with your supervisor or admin.`)
        setSubmitting(false)
        return
      }

      const record = await createSwap({
        weekCommencing: weekStr,
        weekType: form.weekType,
        driverAName: form.driverAName,
        driverADuty: form.driverADuty,
        driverBName: form.driverBName,
        driverBDuty: form.driverBDuty,
        driverASignature: sigRef.current.toDataURL(),
        driverASignedDate: new Date().toISOString(),
      })
      navigate(`/screen2?swapId=${record.id}`)
    } catch (err) {
      setError('Failed to save. Please try again.')
      setSubmitting(false)
    }
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
