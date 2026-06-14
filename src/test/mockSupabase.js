// In-memory mock of the Supabase client — enough to run the apps' real
// dataService.js on top of it. Models: tables, insert/select/update/delete,
// eq/neq/ilike/in filters, order/limit/single/maybeSingle, rpc, functions,
// a unique-index constraint, and the applicants(count) aggregate.

export const _db = {
  shift_swap_requests: [],
  supervisors: [],
  posts: [],
  applicants: [],
  notifications: [],
  push_subscriptions: [],
  profiles: [],
}

// Configurable behaviors for tests
export const _config = {
  emailWillFail: false,
  pushWillFail: false,
  // unique index on shift_swap_requests for active (non-Completed) swaps
}

export function _reset() {
  for (const k of Object.keys(_db)) _db[k] = []
  _config.emailWillFail = false
  _config.pushWillFail = false
}

const norm = v => (v ?? '').toString().trim().toLowerCase()

// Unique-index check mirroring: uniq_active_swap WHERE status <> 'Completed'
function violatesActiveSwapIndex(table, record, ignoreId = null) {
  if (table !== 'shift_swap_requests') return false
  if (record.status === 'Completed') return false
  return _db[table].some(r =>
    r.id !== ignoreId &&
    r.status !== 'Completed' &&
    norm(r.driver_a_name) === norm(record.driver_a_name) &&
    norm(r.driver_a_duty) === norm(record.driver_a_duty) &&
    norm(r.driver_b_name) === norm(record.driver_b_name) &&
    norm(r.driver_b_duty) === norm(record.driver_b_duty) &&
    r.week_commencing === record.week_commencing
  )
}

// applicants has a unique (post_id, applicant_id) constraint in the real DB
function violatesApplicantUnique(table, record) {
  if (table !== 'applicants') return false
  return _db[table].some(r => r.post_id === record.post_id && r.applicant_id === record.applicant_id)
}

class Query {
  constructor(table) {
    this.table = table
    this.filters = []
    this._order = null
    this._limit = null
    this._op = 'select'
    this._payload = null
    this._returning = false
    this._count = null
    this._head = false
  }
  select(_cols, opts) {
    if (opts?.count) { this._count = opts.count; this._head = !!opts.head }
    if (this._op === 'insert' || this._op === 'update') this._returning = true
    else this._op = 'select'
    return this
  }
  insert(payload) { this._op = 'insert'; this._payload = payload; return this }
  update(payload) { this._op = 'update'; this._payload = payload; return this }
  delete() { this._op = 'delete'; return this }
  eq(c, v) { this.filters.push(r => r[c] === v); return this }
  neq(c, v) { this.filters.push(r => r[c] !== v); return this }
  ilike(c, v) { const t = norm(v); this.filters.push(r => norm(r[c]) === t); return this }
  in(c, arr) { this.filters.push(r => arr.includes(r[c])); return this }
  order(c, opts) { this._order = { c, asc: opts?.ascending !== false }; return this }
  limit(n) { this._limit = n; return this }
  _match() { return _db[this.table].filter(r => this.filters.every(f => f(r))) }
  _run() {
    if (this._op === 'insert') {
      const rows = Array.isArray(this._payload) ? this._payload : [this._payload]
      for (const row of rows) {
        if (violatesActiveSwapIndex(this.table, row)) return { data: null, error: { code: '23505', message: 'duplicate key value violates unique constraint "uniq_active_swap"' } }
        if (violatesApplicantUnique(this.table, row)) return { data: null, error: { code: '23505', message: 'duplicate key value violates unique constraint "applicants_post_applicant_key"' } }
      }
      const inserted = rows.map(r => ({ ...r }))
      // auto-id for tables that need it
      inserted.forEach(r => {
        if (r.id === undefined) {
          const ids = _db[this.table].map(x => typeof x.id === 'number' ? x.id : 0)
          r.id = (ids.length ? Math.max(...ids) : 0) + 1
        }
        if (r.created_at === undefined) r.created_at = new Date().toISOString()
        if (this.table === 'applicants' && r.status === undefined) r.status = 'pending'
        if (this.table === 'posts' && r.status === undefined) r.status = 'open'
        if (this.table === 'notifications' && r.is_read === undefined) r.is_read = false
      })
      _db[this.table].push(...inserted)
      return { data: this._returning ? inserted : null, error: null }
    }
    if (this._op === 'update') {
      const matched = this._match()
      for (const r of matched) {
        const merged = { ...r, ...this._payload }
        if (violatesActiveSwapIndex(this.table, merged, r.id)) return { data: null, error: { code: '23505', message: 'unique violation' } }
        Object.assign(r, this._payload)
      }
      return { data: this._returning ? matched.map(r => ({ ...r })) : null, error: null }
    }
    if (this._op === 'delete') {
      const keep = _db[this.table].filter(r => !this.filters.every(f => f(r)))
      const removed = _db[this.table].length - keep.length
      _db[this.table] = keep
      return { data: null, error: null, count: removed }
    }
    // select
    let rows = this._match()
    if (this._order) rows = [...rows].sort((a, b) => {
      const x = a[this._order.c], y = b[this._order.c]
      return (x < y ? -1 : x > y ? 1 : 0) * (this._order.asc ? 1 : -1)
    })
    if (this._count) return { data: this._head ? null : rows, count: rows.length, error: null }
    if (this._limit != null) rows = rows.slice(0, this._limit)
    return { data: rows.map(r => ({ ...r })), error: null }
  }
  single() { const { data, error } = this._run(); if (error) return Promise.resolve({ data: null, error }); const arr = Array.isArray(data) ? data : [data]; if (arr.length !== 1) return Promise.resolve({ data: null, error: { code: 'PGRST116', message: 'no/again rows' } }); return Promise.resolve({ data: arr[0], error: null }) }
  maybeSingle() { const { data, error } = this._run(); if (error) return Promise.resolve({ data: null, error }); const arr = Array.isArray(data) ? data : (data ? [data] : []); if (arr.length > 1) return Promise.resolve({ data: null, error: { message: 'multiple' } }); return Promise.resolve({ data: arr[0] ?? null, error: null }) }
  then(resolve) { resolve(this._run()) } // awaitable
}

export const supabase = {
  from(table) { return new Query(table) },
  rpc(fn, params) {
    if (fn === 'accept_applicant_tx') {
      const { p_applicant_id, p_post_id } = params
      const post = _db.posts.find(p => p.id === p_post_id)
      if (!post) return Promise.resolve({ error: { message: 'Post not found' } })
      const target = _db.applicants.find(a => a.id === p_applicant_id && a.post_id === p_post_id)
      if (!target) return Promise.resolve({ error: { message: 'Applicant not found' } })
      // atomic: accept one, reject others, close post
      target.status = 'accepted'
      _db.applicants.filter(a => a.post_id === p_post_id && a.id !== p_applicant_id).forEach(a => a.status = 'rejected')
      post.status = 'closed'
      return Promise.resolve({ error: null })
    }
    if (fn === 'get_post_applicant_count') {
      const n = _db.applicants.filter(a => a.post_id === params.p_post_id).length
      return Promise.resolve({ data: n, error: null })
    }
    return Promise.resolve({ data: null, error: null })
  },
  functions: {
    invoke(name, _opts) {
      if (name.includes('email')) return _config.emailWillFail ? Promise.resolve({ data: null, error: { message: 'email down' } }) : Promise.resolve({ data: { success: true }, error: null })
      if (name === 'send-push') return _config.pushWillFail ? Promise.resolve({ data: null, error: { message: 'push down' } }) : Promise.resolve({ data: { ok: true }, error: null })
      return Promise.resolve({ data: null, error: null })
    },
  },
}
