import { supabase } from './lib/supabase'

function generateId() {
  return Date.now().toString()
}

function generateRef() {
  const now = new Date()
  const dd = String(now.getDate()).padStart(2, '0')
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const yyyy = now.getFullYear()
  const hh = String(now.getHours()).padStart(2, '0')
  const min = String(now.getMinutes()).padStart(2, '0')
  const ss = String(now.getSeconds()).padStart(2, '0')
  return `SWAP-${dd}${mm}${yyyy}-${hh}${min}${ss}`
}

// DB row (snake_case) → app object (camelCase)
function mapToApp(row) {
  if (!row) return null
  return {
    id: row.id,
    title: row.title,
    driverAName: row.driver_a_name,
    driverAPayroll: row.driver_a_payroll,
    driverADuty: row.driver_a_duty,
    driverBName: row.driver_b_name,
    driverBPayroll: row.driver_b_payroll,
    driverBDuty: row.driver_b_duty,
    weekCommencing: row.week_commencing,
    weekType: row.week_type,
    driverASignature: row.driver_a_signature,
    driverBSignature: row.driver_b_signature,
    status: row.status,
    createdAt: row.created_at,
    supervisorName: row.supervisor_name,
    supervisorSignature: row.supervisor_signature,
    supervisorSignedDate: row.supervisor_signed_date,
  }
}

export async function createSwap(data) {
  const record = {
    id: generateId(),
    title: generateRef(),
    driver_a_name: data.driverAName,
    driver_a_payroll: data.driverAPayroll ?? null,
    driver_a_duty: data.driverADuty,
    driver_b_name: data.driverBName,
    driver_b_payroll: data.driverBPayroll ?? null,
    driver_b_duty: data.driverBDuty,
    week_commencing: data.weekCommencing,
    week_type: data.weekType,
    driver_a_signature: data.driverASignature,
    status: "Awaiting Driver B's Signature",
  }

  const { data: result, error } = await supabase
    .from('shift_swap_requests')
    .insert(record)
    .select()
    .single()

  if (error) throw error
  return mapToApp(result)
}

export async function getSwap(id) {
  const { data, error } = await supabase
    .from('shift_swap_requests')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return mapToApp(data)
}

export async function updateSwap(id, updates) {
  const dbUpdates = {}
  if (updates.driverBSignature !== undefined) dbUpdates.driver_b_signature = updates.driverBSignature
  if (updates.driverBSignedDate !== undefined) dbUpdates.driver_b_signed_date = updates.driverBSignedDate
  if (updates.status !== undefined) dbUpdates.status = updates.status
  if (updates.supervisorName !== undefined) dbUpdates.supervisor_name = updates.supervisorName
  if (updates.supervisorSignature !== undefined) dbUpdates.supervisor_signature = updates.supervisorSignature
  if (updates.supervisorSignedDate !== undefined) dbUpdates.supervisor_signed_date = updates.supervisorSignedDate

  const { data, error } = await supabase
    .from('shift_swap_requests')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return mapToApp(data)
}

export async function getAllSwaps() {
  const { data, error } = await supabase
    .from('shift_swap_requests')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return []
  return data.map(mapToApp)
}

export async function getSupervisors() {
  const { data, error } = await supabase
    .from('supervisors')
    .select('*')
    .eq('authority_to_sign', true)
    .eq('active', true)
    .order('name')

  if (error) return []
  return data.map(s => ({
    id: s.id,
    name: s.name,
    email: s.email,
    role: s.role,
    authorityToSign: s.authority_to_sign,
  }))
}

export async function sendApprovalEmail(swap, supervisors) {
  const { data, error } = await supabase.functions.invoke('send-approval-email-', {
    body: { swap, supervisors },
  })
  if (error) console.error('Email send error:', error)
  return data
}
