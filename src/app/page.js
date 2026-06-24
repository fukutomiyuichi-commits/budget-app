import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/Header";
import HourlyRateHint from "@/components/HourlyRateHint";
import ProjectListItem from "@/components/ProjectListItem";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 自分が参加しているプロジェクトの予算消化状況とプロフィールを取得
  const [{ data: summaries, error }, { data: profile }] = await Promise.all([
    supabase.from("project_budget_summary").select("*").order("name"),
    supabase.from("profiles").select("full_name, email").eq("id", user.id).maybeSingle(),
  ]);

  // ホーム画面からその場で稼動・購入費を記録できるように、関係する全プロジェクトの
  // メンバー(と時給)をまとめて取得しておく
  const projectIds = summaries?.map((s) => s.project_id) ?? [];
  const { data: allMembers } = projectIds.length
    ? await supabase
        .from("project_members")
        .select("project_id, user_id, hourly_rate, profiles(full_name, email)")
        .in("project_id", projectIds)
    : { data: [] };

  const membersByProject = {};
  for (const m of allMembers ?? []) {
    const list = membersByProject[m.project_id] ?? (membersByProject[m.project_id] = []);
    list.push({
      user_id: m.user_id,
      name: m.profiles?.full_name || m.profiles?.email,
      hourly_rate: m.hourly_rate,
    });
  }

  // 完了済みプロジェクトは別セクションに分けて表示し、進行中のものだけを上に出す
  const activeProjects = summaries?.filter((p) => p.status !== "closed") ?? [];
  const closedProjects = summaries?.filter((p) => p.status === "closed") ?? [];

  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto w-full px-5 py-10 flex-1 space-y-8">
        {/* プロフィール */}
        <section className="bg-card border border-border shadow-sm rounded-2xl p-5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <p className="text-xs text-muted mb-1">ようこそ</p>
            <p className="font-semibold text-foreground">{profile?.full_name || user.email}</p>
            <p className="text-xs text-muted mt-0.5">{profile?.email || user.email}</p>
          </div>
          <div className="w-full sm:w-72 sm:shrink-0">
            <HourlyRateHint />
          </div>
        </section>

        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground tracking-tight">プロジェクト一覧</h1>
          <Link
            href="/projects/new"
            className="bg-accent hover:bg-accent-dark text-white text-sm font-medium px-4 py-2.5 rounded-xl transition shadow-sm"
          >
            + 新規プロジェクト
          </Link>
        </div>

        {error && (
          <p className="text-sm text-danger">読み込みエラー: {error.message}</p>
        )}

        {summaries && summaries.length === 0 && (
          <p className="text-sm text-muted">
            まだプロジェクトがありません。「新規プロジェクト」から作成してください。
          </p>
        )}

        <div className="grid gap-3">
          {activeProjects.map((p) => (
            <ProjectListItem
              key={p.project_id}
              project={p}
              members={membersByProject[p.project_id] ?? []}
            />
          ))}
        </div>

        {closedProjects.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-muted mb-3">完了済み</h2>
            <div className="grid gap-3 opacity-80">
              {closedProjects.map((p) => (
                <ProjectListItem
                  key={p.project_id}
                  project={p}
                  members={membersByProject[p.project_id] ?? []}
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
