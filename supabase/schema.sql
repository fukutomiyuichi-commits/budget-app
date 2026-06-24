-- ============================================================
-- 予算管理アプリ スキーマ
-- Supabase の SQL Editor にこのファイルの内容を貼り付けて実行してください
-- ============================================================

-- 1. プロフィール(ユーザー情報の拡張)
-- Supabase Auth の auth.users と1:1で紐づく
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  created_at timestamptz default now()
);

-- 新規ユーザー登録時に自動でprofilesにも行を作成するトリガー
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. プロジェクト
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  budget_amount numeric(14,2) not null default 0, -- プロジェクト予算総額
  start_date date,
  end_date date,
  status text not null default 'active', -- 'active' | 'closed'(クロージング済み。いつでも再開可)
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- 3. プロジェクトメンバー(誰がどのプロジェクトにアクセスできるか)
create table if not exists public.project_members (
  project_id uuid references public.projects(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  role text not null default 'member', -- 'owner' | 'member'
  hourly_rate numeric(10,2) not null default 0, -- このプロジェクトでのこの人の時給
  joined_at timestamptz default now(),
  primary key (project_id, user_id)
);

-- 4. 人件費エントリー(プロジェクトに関わった人の稼働分)
create table if not exists public.labor_entries (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  work_date date not null,
  hours numeric(6,2) not null check (hours > 0),
  hourly_rate numeric(10,2) not null check (hourly_rate >= 0), -- 1時間あたりの単価
  note text,
  created_at timestamptz default now()
);

-- 5. 購入費・その他経費エントリー
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id), -- 登録者
  item_name text not null,
  amount numeric(12,2) not null check (amount >= 0),
  expense_date date not null,
  category text, -- 例: '備品', '外注費', '交通費' など自由入力
  note text,
  created_at timestamptz default now()
);

-- ============================================================
-- Row Level Security (RLS)
-- 「プロジェクトメンバーだけが、そのプロジェクトのデータを見える/編集できる」設計
-- ============================================================

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.labor_entries enable row level security;
alter table public.expenses enable row level security;

-- profiles: 自分の情報は誰でも見れる(社内ツールのため全員参照可にしている)
create policy "profiles_select_all" on public.profiles
  for select using (true);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- projects: メンバーになっているプロジェクト、または自分が作成したプロジェクトのみ参照可
-- (作成者自身も条件に含めるのは、作成直後にreturning(select)でその行を取得する必要があるため)
create policy "projects_select_member" on public.projects
  for select using (
    created_by = auth.uid()
    or exists (
      select 1 from public.project_members pm
      where pm.project_id = projects.id and pm.user_id = auth.uid()
    )
  );
create policy "projects_insert_any_authenticated" on public.projects
  for insert with check (auth.uid() is not null);
create policy "projects_update_owner" on public.projects
  for update using (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = projects.id and pm.user_id = auth.uid() and pm.role = 'owner'
    )
  );

-- project_members: 自分が所属するプロジェクトのメンバー一覧は見える
-- (project_members自身を参照すると無限再帰になるため、RLSを回避するヘルパー関数を使う)
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

create policy "members_select_same_project" on public.project_members
  for select using ( public.is_project_member(project_id) );
create policy "members_insert_owner_or_self" on public.project_members
  for insert with check (
    auth.uid() is not null
  );
create policy "members_update_same_project" on public.project_members
  for update using ( public.is_project_member(project_id) );

-- labor_entries: プロジェクトメンバーのみ参照・登録可
create policy "labor_select_member" on public.labor_entries
  for select using (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = labor_entries.project_id and pm.user_id = auth.uid()
    )
  );
create policy "labor_insert_member" on public.labor_entries
  for insert with check (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = labor_entries.project_id and pm.user_id = auth.uid()
    )
  );
create policy "labor_update_own" on public.labor_entries
  for update using (user_id = auth.uid());
create policy "labor_delete_own" on public.labor_entries
  for delete using (user_id = auth.uid());

-- expenses: プロジェクトメンバーのみ参照・登録可
create policy "expenses_select_member" on public.expenses
  for select using (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = expenses.project_id and pm.user_id = auth.uid()
    )
  );
create policy "expenses_insert_member" on public.expenses
  for insert with check (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = expenses.project_id and pm.user_id = auth.uid()
    )
  );
create policy "expenses_update_own" on public.expenses
  for update using (user_id = auth.uid());
create policy "expenses_delete_own" on public.expenses
  for delete using (user_id = auth.uid());

-- ============================================================
-- 便利ビュー: プロジェクトごとの予算消化状況
-- ============================================================
create or replace view public.project_budget_summary as
select
  p.id as project_id,
  p.name,
  p.budget_amount,
  p.status,
  coalesce(l.total_labor_cost, 0) as total_labor_cost,
  coalesce(e.total_expense_cost, 0) as total_expense_cost,
  coalesce(l.total_labor_cost, 0) + coalesce(e.total_expense_cost, 0) as total_actual_cost,
  p.budget_amount - (coalesce(l.total_labor_cost, 0) + coalesce(e.total_expense_cost, 0)) as remaining_budget
from public.projects p
left join (
  select project_id, sum(hours * hourly_rate) as total_labor_cost
  from public.labor_entries
  group by project_id
) l on l.project_id = p.id
left join (
  select project_id, sum(amount) as total_expense_cost
  from public.expenses
  group by project_id
) e on e.project_id = p.id;

-- このビューを「見ている本人の権限」で評価させる(デフォルトはビュー作成者=postgresの権限で
-- 動いてしまい、各テーブルのRLSが素通りしてしまうため、明示的に指定する)
alter view public.project_budget_summary set (security_invoker = true);
