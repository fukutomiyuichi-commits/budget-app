-- ============================================================
-- project_members の RLS 無限再帰エラーの修正
-- (「自分がメンバーかどうか」の判定を、ポリシー内で project_members を
--  直接参照する代わりに、RLSを回避するヘルパー関数で行うようにする)
-- ============================================================

create or replace function public.is_project_member(_project_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.project_members pm
    where pm.project_id = _project_id and pm.user_id = auth.uid()
  );
$$;

drop policy if exists "members_select_same_project" on public.project_members;
create policy "members_select_same_project" on public.project_members
  for select using ( public.is_project_member(project_id) );
