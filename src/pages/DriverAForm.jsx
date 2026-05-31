import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSwaps } from '../context/SwapContext'
import Header from '../components/Header'
import SignaturePad from '../components/SignaturePad'
import { generateRef } from '../utils/helpers'

const AP_RED = '#E11B22'

function Field({ label, hint, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {hint && <span className="text-xs text-gray-400 font-normal ml-1">({hint})</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

function TextInput({ value, onChange, type = 'text', placeholder, hasError }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full border rounded-xl px-3 py-3 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 transition-colors ${
        hasError
          ? 'border-red-400 focus:ring-red-200'
          : 'border-gray-300 focus:border-[#E11B22] focus:ring-[#E11B22]/20'
      }`}
    />
  )
}

export default function DriverAForm() {
  const navigate = useNavigate()
  const { addSwap } = useSwaps()
  const sigRef = useRef(null)
  const [errors, setErrors] = useState({})

  const [form, setForm] = useState({
    weekCommencing: '',
    sundayOnly: false,
    driverAName: '',
    driverADuty: '',
    driverBName: '',
    driverBDuty: '',
  })

  const set = field => e =>
    setForm(prev => ({
      ...prev,
      [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
    }))

  const validate = () => {
    const e = {}
    if (!form.weekCommencing) {
      e.weekCommencing = 'Week commencing is required'
    } else {
      const d = new Date(form.weekCommencing + 'T00:00:00')
      if (d.getDay() !== 1) e.weekCommencing = 'Must be a Monday'
    }
    if (!form.driverAName.trim()) e.driverAName = 'Required'
    if (!form.driverADuty.trim()) e.driverADuty = 'Required'
    if (!form.driverBName.trim()) e.driverBName = 'Required'
    if (!form.driverBDuty.trim()) e.driverBDuty = 'Required'
    if (sigRef.current?.isEmpty()) e.signature = 'Signature is required'
    return e
  }

  const handleSubmit = () => {
    const e = validate()
    if (Object.keys(e).length) {
      setErrors(e)
      return
    }
    const id = generateRef()
    addSwap({
      id,
      ...form,
      driverASignature: sigRef.current.toDataURL(),
      driverBSignature: null,
      supervisorSignature: null,
      supervisorDecision: null,
      status: "Awaiting Driver B's Signature",
      createdAt: new Date().toISOString(),
    })
    navigate(`/share/${id}`)
  }

  return (
    <div className="min-h-svh bg-gray-50 flex flex-col">
      <Header title="Duty Swap Request" />

      <div className="flex-1 p-4 space-y-4 pb-8">
        {/* Week & Sunday */}
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
          <Field label="Week Commencing" hint="Monday" error={errors.weekCommencing}>
            <TextInput
              type="date"
              value={form.weekCommencing}
              onChange={set('weekCommencing')}
              hasError={!!errors.weekCommencing}
            />
          </Field>

          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.sundayOnly}
              onChange={set('sundayOnly')}
              className="w-4 h-4 rounded"
              style={{ accentColor: AP_RED }}
            />
            <span className="text-sm font-medium text-gray-700">Sunday Only</span>
          </label>
        </div>

        {/* Driver A */}
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Driver A — Requestor
          </p>
          <Field label="Full Name" error={errors.driverAName}>
            <TextInput
              value={form.driverAName}
              onChange={set('driverAName')}
              placeholder="e.g. John Smith"
              hasError={!!errors.driverAName}
            />
          </Field>
          <Field label="Duty Number" error={errors.driverADuty}>
            <TextInput
              value={form.driverADuty}
              onChange={set('driverADuty')}
              placeholder="e.g. 101"
              hasError={!!errors.driverADuty}
            />
          </Field>
        </div>

        {/* Driver B */}
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Driver B — Swap Partner
          </p>
          <Field label="Full Name" error={errors.driverBName}>
            <TextInput
              value={form.driverBName}
              onChange={set('driverBName')}
              placeholder="e.g. Jane Doe"
              hasError={!!errors.driverBName}
            />
          </Field>
          <Field label="Duty Number" error={errors.driverBDuty}>
            <TextInput
              value={form.driverBDuty}
              onChange={set('driverBDuty')}
              placeholder="e.g. 205"
              hasError={!!errors.driverBDuty}
            />
          </Field>
        </div>

        {/* Signature */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <SignaturePad ref={sigRef} label="Driver A Signature" />
          {errors.signature && (
            <p className="mt-1 text-xs text-red-600">{errors.signature}</p>
          )}
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          className="w-full text-white font-semibold py-4 rounded-2xl text-base shadow-sm active:opacity-90 transition-opacity"
          style={{ backgroundColor: AP_RED }}
        >
          Submit Request
        </button>

        <div className="text-center pb-2">
          <button
            onClick={() => navigate('/admin')}
            className="text-sm text-gray-400 hover:text-gray-600 underline"
          >
            Admin Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
