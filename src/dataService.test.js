import { describe, it, expect, beforeEach, vi } from 'vitest'

// Replace the real Supabase client with the in-memory mock
vi.mock('./lib/supabase', async () => {
  const mod = await import('./test/mockSupabase.js')
  return { supabase: mod.supabase }
})

import { _db, _reset, _config } from './test/mockSupabase.js'
import * as App from './dataService.js'
import { normalizeDuty } from './utils/helpers.js'

const baseSwap = () => ({
  weekCommencing: '2026-06-21', weekType: 'sun-fri',
  driverAName: 'Paul Kwon', driverADuty: normalizeDuty('100'),
  driverBName: 'John Smith', driverBDuty: normalizeDuty('rdo'),
  driverASignature: 'sigA', driverASignedDate: new Date().toISOString(),
})

beforeEach(() => {
  _reset()
  _db.supervisors.push(
    { id: 1, name: 'Sup One', email: 's1@x.com', role: 'PTC3', authority_to_sign: true, active: true },
    { id: 2, name: 'Sup Two', email: 's2@x.com', role: 'PTC3', authority_to_sign: false, active: true },
  )
})

describe('createSwap', () => {
  it('creates a swap with a UUID id and normalized duty', async () => {
    const rec = await App.createSwap(baseSwap())
    expect(rec.id).toMatch(/^[0-9a-f-]{36}$/)
    expect(rec.driverADuty).toBe('BT100')
    expect(rec.status).toBe("Awaiting Driver B's Signature")
    expect(rec.driverBSignature).toBeNull()
  })

  it('goes straight to supervisor approval when Driver B signs on the spot', async () => {
    const signedDate = new Date().toISOString()
    const rec = await App.createSwap({
      ...baseSwap(),
      driverBSignature: 'sigB',
      driverBSignedDate: signedDate,
    })
    expect(rec.driverBSignature).toBe('sigB')
    expect(rec.driverBSignedDate).toBe(signedDate)
    expect(rec.status).toBe("Awaiting Supervisor's Signature")
  })
})

describe('findDuplicateSwap', () => {
  beforeEach(async () => { await App.createSwap(baseSwap()) })

  it('detects a duplicate regardless of case / spaces / BT prefix', async () => {
    const dup = await App.findDuplicateSwap(' paul kwon ', '100', 'JOHN SMITH', ' rdo ', '2026-06-21')
    expect(dup).toBeTruthy()
  })

  it('allows a different Driver B (legitimate multi-swap)', async () => {
    expect(await App.findDuplicateSwap('Paul Kwon', 'BT100', 'Mike Lee', 'RDO', '2026-06-21')).toBeNull()
  })

  it('allows Paul receiving a different duty (multi-swap)', async () => {
    expect(await App.findDuplicateSwap('Chris Ng', 'BT200', 'Paul Kwon', 'RDO', '2026-06-21')).toBeNull()
  })

  it('allows a different week', async () => {
    expect(await App.findDuplicateSwap('Paul Kwon', 'BT100', 'John Smith', 'RDO', '2026-06-28')).toBeNull()
  })
})

describe('unique index backstop', () => {
  it('blocks a true duplicate insert and keeps only one record', async () => {
    await App.createSwap(baseSwap())
    let blocked = false
    try {
      await App.createSwap({ ...baseSwap(), driverAName: 'paul kwon', driverBDuty: 'rdo' })
    } catch (e) { blocked = e.code === 'DUPLICATE_SWAP' }
    expect(blocked).toBe(true)
    expect(_db.shift_swap_requests.length).toBe(1)
  })

  it('allows re-creation after the previous swap is Completed', async () => {
    const rec = await App.createSwap(baseSwap())
    await App.updateSwap(rec.id, { status: 'Completed' })
    const rec2 = await App.createSwap(baseSwap())
    expect(rec2.id).toBeTruthy()
  })
})

describe('status transitions', () => {
  it('advances Driver B → Supervisor → Completed', async () => {
    const rec = await App.createSwap(baseSwap())
    const afterB = await App.updateSwap(rec.id, { driverBSignature: 'sigB', status: "Awaiting Supervisor's Signature" })
    expect(afterB.status).toBe("Awaiting Supervisor's Signature")
    const done = await App.updateSwap(rec.id, { supervisorName: 'Sup One', status: 'Completed' })
    expect(done.status).toBe('Completed')
  })
})

describe('supervisors & email', () => {
  it('lists only signing supervisors', async () => {
    expect((await App.getSupervisors()).length).toBe(1)
  })
  it('returns ok:true when email sends', async () => {
    _config.emailWillFail = false
    expect((await App.sendApprovalEmail({}, [])).ok).toBe(true)
  })
  it('returns ok:false when email fails', async () => {
    _config.emailWillFail = true
    expect((await App.sendCompletionEmail({}, [])).ok).toBe(false)
  })
})
