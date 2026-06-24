-- ============================================================
-- project_members に「プロジェクトごとの時給」を持たせる変更
-- ============================================================

alter table public.project_members
  add column if not exists hourly_rate numeric(10,2) not null default 0;

-- メンバー自身、または同じプロジェクトの誰かが、メンバーの時給を更新できるようにする
-- (このアプリでは管理者/メンバーの権限差をつけない方針のため)
drop policy if exists "members_update_same_project" on public.project_members;
create policy "members_update_same_project" on public.project_members
  for update using ( public.is_project_member(project_id) );
