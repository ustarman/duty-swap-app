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
-- UPDATE (2026-07-16): the supervisors table now ALSO has RLS enabled.
--   * SELECT — allowed for anon,authenticated (app reads the mailing list)
--   * INSERT/UPDATE/DELETE — no anon policy → denied.
-- Supervisor writes (Admin "Mailing List" tab) go through the
-- admin-supervisors edge function, which checks the mailing-list PIN
-- (Supabase secret MAILING_ADMIN_PIN) server-side and writes with the
-- service role. The mailing PIN is no longer shipped in the client bundle.
-- supervisors RLS is defined at the bottom of this file.
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

-- ── supervisors table (added 2026-07-16) ──────────────────────────────────
-- Read stays public (app needs the mailing list); writes are blocked for anon
-- and handled by the admin-supervisors edge function (service role).
alter table public.supervisors enable row level security;

create policy "anyone can read supervisors" on public.supervisors
  for select to anon, authenticated
  using (true);
-- No insert/update/delete policy for anon → writes only via service role.
