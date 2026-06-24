import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/Header";
import AddLaborForm from "@/components/AddLaborForm";
import AddExpenseForm from "@/components/AddExpenseForm";
import InviteMemberForm from "@/components/InviteMemberForm";
import MemberRateEditor from "@/components/MemberRateEditor";
import BudgetBurnChart from "@/components/BudgetBurnChart";
import ProjectMetaCard from "@/components/ProjectMetaCard";
import LaborEntryRow from "@/components/LaborEntryRow";
import ExpenseEntryRow from "@/components/ExpenseEntryRow";

function formatYen(n) {
  return new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" }).format(n || 0);
}

export default async function ProjectDetailPage({ params }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const currentUserId = user.id;

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!project) notFound();

  const [{ data: summary }, { data: laborEntries }, { data: expenses }, { data: members }] =
    await Promise.all([
      supabase.from("project_budget_summary").select("*").eq("project_id", id).maybeSingle(),
      supabase
        .from("labor_entries")
        .select("*, profiles(full_name, email)")
        .eq("project_id", id)
        .order("work_date", { ascending: false }),
      supabase
        .from("expenses")
        .select("*, profiles(full_name, email)")
        .eq("project_id", id)
        .order("expense_date", { ascending: false }),
      supabase
        .from("project_members")
        .select("user_id, role, hourly_rate, profiles(full_name, email)")
        .eq("project_id", id),
    ]);

  const totalActual = summary?.total_actual_cost ?? 0;
  const remaining = summary?.remaining_budget ?? project.budget_amount;
  const overBudget = remaining < 0;
  const usedRatio = project.budget_amount > 0
    ? Math.min(100, (totalActual / project.budget_amount) * 100)
    : 0;

  const memberOptions = members?.map((m) => ({
    user_id: m.user_id,
    name: m.profiles?.full_name || m.profiles?.email,
    hourly_rate: m.hourly_rate,
  })) ?? [];

  const isClosed = project.status === "closed";

  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto w-full px-5 py-10 flex-1 space-y-6">
        <div>
          <Link href="/" className="text-xs text-muted hover:text-accent-dark transition">
            ← プロジェクト一覧
          </Link>
        </div>

        <ProjectMetaCard project={project} />

        {/* メイン2カラム: 左=予算消化状況とグラフ / 右=メンバーと入力フォーム */}
        <div className="grid lg:grid-cols-5 gap-5 items-start">
          {/* 予算サマリー */}
          <section className="lg:col-span-3 bg-card border border-border shadow-sm rounded-2xl p-5">
            <h2 className="font-semibold text-sm text-foreground mb-3">予算消化状況</h2>
            <div className="w-full bg-card-soft rounded-full h-3 mb-3 overflow-hidden">
              <div
                className={`h-3 rounded-full transition-all ${overBudget ? "bg-danger" : "bg-accent"}`}
                style={{ width: `${usedRatio}%` }}
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-5">
              <div>
                <p className="text-xs text-muted">予算総額</p>
                <p className="font-semibold text-foreground">{formatYen(project.budget_amount)}</p>
              </div>
              <div>
                <p className="text-xs text-muted">人件費合計</p>
                <p className="font-semibold text-foreground">{formatYen(summary?.total_labor_cost)}</p>
              </div>
              <div>
                <p className="text-xs text-muted">購入費合計</p>
                <p className="font-semibold text-foreground">{formatYen(summary?.total_expense_cost)}</p>
              </div>
              <div>
                <p className="text-xs text-muted">残予算</p>
                <p className={`font-semibold ${overBudget ? "text-danger" : "text-foreground"}`}>
                  {formatYen(remaining)}
                </p>
              </div>
            </div>

            <BudgetBurnChart project={project} laborEntries={laborEntries ?? []} expenses={expenses ?? []} />
          </section>

          {/* 右カラム: メンバー */}
          <section className="lg:col-span-2 bg-card border border-border shadow-sm rounded-2xl p-5">
            <h2 className="font-semibold text-sm text-foreground mb-3">メンバー</h2>
            <ul className="text-sm mb-1 divide-y divide-border">
              {members?.map((m) => (
                <li key={m.user_id} className="flex items-center justify-between py-2.5">
                  <span className="text-foreground">
                    {m.profiles?.full_name || m.profiles?.email}
                    {m.role === "owner" && <span className="text-xs text-muted ml-2">(作成者)</span>}
                  </span>
                  <MemberRateEditor projectId={id} userId={m.user_id} hourlyRate={m.hourly_rate} />
                </li>
              ))}
            </ul>
            <InviteMemberForm projectId={id} />
          </section>
        </div>

        {/* 記録する: 稼動・購入費の入力フォームを横並びで配置(完了済みプロジェクトでは新規記録を停止) */}
        {isClosed ? (
          <section className="bg-card-soft rounded-2xl p-5 text-sm text-muted">
            このプロジェクトは完了済みのため、新しい記録は追加できません。記録を追加したい場合は、上の「再開する」から再開してください。
          </section>
        ) : (
          <section>
            <h2 className="font-semibold text-sm text-foreground mb-3">記録する</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div id="labor-form" className="scroll-mt-20 rounded-2xl">
                <AddLaborForm projectId={id} members={memberOptions} />
              </div>
              <div id="expense-form" className="scroll-mt-20 rounded-2xl">
                <AddExpenseForm projectId={id} />
              </div>
            </div>
          </section>
        )}

        {/* 履歴(人件費・購入費。それぞれ全幅で表示し列が欠けないようにする) */}
        <div className="space-y-6">
          {/* 人件費一覧 */}
          <section>
            <h2 className="font-semibold text-sm text-foreground mb-3">人件費の履歴</h2>
            <div className="bg-card border border-border shadow-sm rounded-2xl overflow-hidden overflow-x-auto">
              <table className="w-full text-sm table-fixed min-w-[760px]">
                <colgroup>
                  <col className="w-[13%]" />
                  <col className="w-[16%]" />
                  <col className="w-[8%]" />
                  <col className="w-[12%]" />
                  <col className="w-[13%]" />
                  <col className="w-[28%]" />
                  <col className="w-[10%]" />
                </colgroup>
                <thead className="bg-card-soft text-muted text-xs">
                  <tr>
                    <th className="text-left px-4 py-2.5">日付</th>
                    <th className="text-left px-4 py-2.5">担当者</th>
                    <th className="text-right px-4 py-2.5">時間</th>
                    <th className="text-right px-4 py-2.5">時給</th>
                    <th className="text-right px-4 py-2.5">金額</th>
                    <th className="text-left px-4 py-2.5">メモ</th>
                    <th className="text-right px-4 py-2.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {laborEntries?.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-6 text-center text-muted">記録がありません</td></tr>
                  )}
                  {laborEntries?.map((l) => (
                    <LaborEntryRow
                      key={l.id}
                      entry={l}
                      members={memberOptions}
                      canEdit={l.user_id === currentUserId}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 購入費一覧 */}
          <section>
            <h2 className="font-semibold text-sm text-foreground mb-3">購入費・経費の履歴</h2>
            <div className="bg-card border border-border shadow-sm rounded-2xl overflow-hidden overflow-x-auto">
              <table className="w-full text-sm table-fixed min-w-[680px]">
                <colgroup>
                  <col className="w-[14%]" />
                  <col className="w-[20%]" />
                  <col className="w-[16%]" />
                  <col className="w-[24%]" />
                  <col className="w-[14%]" />
                  <col className="w-[12%]" />
                </colgroup>
                <thead className="bg-card-soft text-muted text-xs">
                  <tr>
                    <th className="text-left px-4 py-2.5">日付</th>
                    <th className="text-left px-4 py-2.5">品目</th>
                    <th className="text-left px-4 py-2.5">登録者</th>
                    <th className="text-left px-4 py-2.5">メモ</th>
                    <th className="text-right px-4 py-2.5">金額</th>
                    <th className="text-right px-4 py-2.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {expenses?.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-6 text-center text-muted">記録がありません</td></tr>
                  )}
                  {expenses?.map((ex) => (
                    <ExpenseEntryRow
                      key={ex.id}
                      entry={ex}
                      canEdit={ex.user_id === currentUserId}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
