-- RLS policies applied to the live project (ujwxjlhhwlxekqcyrkka) on 2026-07-02.
-- This file is documentation/backup — the policies are already live.
--
-- Why: the anon key ships inside the public JS bundle, so before RLS anyone
-- could read, modify, or DELETE every row via the REST API. These policies
-- keep every operation the app performs working while blocking destructive
-- or tampering operations:
--   * SELECT  — allowed (all screens read swaps)
--   * INSERT  — allowed (Screen1 creates swaps)
--   * UPDATE  — allowed only while status <> 'Completed'
--               (Screen3 Driver B sign, Screen4 supervisor approval;
--                completed records become immutable)
--   * DELETE  — no policy → denied for anon/authenticated
--
-- The send-approval-email-v2 edge function uses the service role, which
-- bypasses RLS, so it is unaffected.
--
-- The supervisors table intentionally has NO RLS: the Admin screen (PIN-gated
-- client side only) needs full CRUD with the anon key. Locking it down would
-- require real authentication for admins first.
--
-- Rollback (instant, if the app ever misbehaves):
--   alter table public.shift_swap_requests disable row level security;

alter table public.shift_swap_requests enable row level security;

create policy swaps_select_all on public.shift_swap_requests
  for select to anon, authenticated
  using (true);

create policy swaps_insert_all on public.shift_swap_requests
  for insert to anon, authenticated
  with check (true);

create policy swaps_update_not_completed on public.shift_swap_requests
  for update to anon, authenticated
  using (status <> 'Completed')
  with check (true);
