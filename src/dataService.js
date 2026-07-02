import { supabase } from './lib/supabase'
import { normalizeDuty } from './utils/helpers'

function generateId() {
  // UUID: collision-proof + unguessable links
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback for very old browsers
  return Date.now().toString() + '-' + Math.random().toString(36).slice(2, 10)
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
    driverASignedDate: row.driver_a_signed_date,
    driverBSignature: row.driver_b_signature,
    driverBSignedDate: row.driver_b_signed_date,
    status: row.status,
    createdAt: row.created_at,
    supervisorName: row.supervisor_name,
    supervisorSignature: row.supervisor_signature,
    supervisorSignedDate: row.supervisor_signed_date,
  }
}

export async function findDuplicateSwap(driverAName, driverADuty, driverBName, driverBDuty, weekCommencing) {
  // Duplicate = same A name+duty AND same B name+duty AND same week, among active swaps.
  // Case- and whitespace-insensitive (ilike + trim).
  const { data, error } = await supabase
    .from('shift_swap_requests')
    .select('id, title, status')
    .ilike('driver_a_name', driverAName.trim())
    .ilike('driver_a_duty', normalizeDuty(driverADuty))
    .ilike('driver_b_name', driverBName.trim())
    .ilike('driver_b_duty', normalizeDuty(driverBDuty))
    .eq('week_commencing', weekCommencing)
    .neq('status', 'Completed')
    .limit(1)
    .maybeSingle()

  if (error) return null
  return data ? mapToApp(data) : null
}

export async function createSwap(data) {
  // When Driver B signs on the spot (on Driver A's phone), the swap is
  // created fully signed and goes straight to supervisor approval.
  const hasDriverBSignature = !!data.driverBSignature
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
    driver_a_signed_date: data.driverASignedDate,
    driver_b_signature: data.driverBSignature ?? null,
    driver_b_signed_date: data.driverBSignedDate ?? null,
    status: hasDriverBSignature ? "Awaiting Supervisor's Signature" : "Awaiting Driver B's Signature",
  }

  const { data: result, error } = await supabase
    .from('shift_swap_requests')
    .insert(record)
    .select()
    .single()

  if (error) {
    // 23505 = unique index violation → an identical active swap already exists
    if (error.code === '23505') {
      const dupErr = new Error('DUPLICATE_SWAP')
      dupErr.code = 'DUPLICATE_SWAP'
      throw dupErr
    }
    throw error
  }
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

export async function getAllSupervisors() {
  const { data, error } = await supabase
    .from('supervisors')
    .select('*')
    .order('name')
  if (error) return []
  return data.map(s => ({
    id: s.id,
    name: s.name,
    email: s.email,
    role: s.role,
    authorityToSign: s.authority_to_sign,
    active: s.active,
  }))
}

export async function addSupervisor(data) {
  const { data: result, error } = await supabase
    .from('supervisors')
    .insert({
      name: data.name,
      email: data.email,
      role: data.role ?? null,
      authority_to_sign: data.authorityToSign ?? false,
      active: true,
    })
    .select()
    .single()
  if (error) throw error
  return result
}

export async function updateSupervisor(id, updates) {
  const dbUpdates = {}
  if (updates.authorityToSign !== undefined) dbUpdates.authority_to_sign = updates.authorityToSign
  if (updates.active !== undefined) dbUpdates.active = updates.active
  if (updates.name !== undefined) dbUpdates.name = updates.name
  if (updates.email !== undefined) dbUpdates.email = updates.email
  const { error } = await supabase.from('supervisors').update(dbUpdates).eq('id', id)
  if (error) throw error
}

export async function deleteSupervisor(id) {
  const { error } = await supabase.from('supervisors').delete().eq('id', id)
  if (error) throw error
}

export async function getAllActiveRecipients() {
  const { data, error } = await supabase
    .from('supervisors')
    .select('*')
    .eq('active', true)
    .order('name')

  if (error) return []
  return data.map(s => ({ name: s.name, email: s.email }))
}

export async function sendApprovalEmail(swap, supervisors) {
  try {
    const { data, error } = await supabase.functions.invoke('send-approval-email-', {
      body: { type: 'approval', swap, supervisors },
    })
    if (error) { console.error('Approval email error:', error); return { ok: false } }
    return { ok: true, data }
  } catch (err) {
    console.error('Approval email error:', err)
    return { ok: false }
  }
}

export async function sendCompletionEmail(swap, recipients) {
  try {
    const { data, error } = await supabase.functions.invoke('send-approval-email-', {
      body: { type: 'completion', swap, supervisors: recipients },
    })
    if (error) { console.error('Completion email error:', error); return { ok: false } }
    return { ok: true, data }
  } catch (err) {
    console.error('Completion email error:', err)
    return { ok: false }
  }
}
