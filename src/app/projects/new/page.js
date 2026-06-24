"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Header from "@/components/Header";
import HourlyRateHint from "@/components/HourlyRateHint";
import BudgetEstimateHelper from "@/components/BudgetEstimateHelper";

const inputClass =
  "w-full border border-border rounded-lg px-3 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-accent-soft";

export default function NewProjectPage() {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [budgetMode, setBudgetMode] = useState("direct"); // "direct" | "estimate"
  const [budgetAmount, setBudgetAmount] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [myHourlyRate, setMyHourlyRate] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("ログインが必要です");
      setLoading(false);
      return;
    }

    const { data: project, error: insertError } = await supabase
      .from("projects")
      .insert({
        name,
        description,
        budget_amount: Number(budgetAmount) || 0,
        start_date: startDate || null,
        end_date: endDate || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    // 作成者を owner としてプロジェクトメンバーに登録(このプロジェクトでの時給も一緒に登録)
    const { error: memberError } = await supabase.from("project_members").insert({
      project_id: project.id,
      user_id: user.id,
      role: "owner",
      hourly_rate: Number(myHourlyRate) || 0,
    });

    if (memberError) {
      setError(memberError.message);
      setLoading(false);
      return;
    }

    router.push(`/projects/${project.id}`);
  }

  return (
    <>
      <Header />
      <main className="max-w-2xl mx-auto w-full px-5 py-10 flex-1">
        <Link href="/" className="text-xs text-muted hover:text-accent-dark transition">
          ← プロジェクト一覧
        </Link>
        <h1 className="text-xl font-bold text-foreground mt-2 mb-6 tracking-tight">新規プロジェクト</h1>
        <form onSubmit={handleSubmit} className="space-y-5 bg-card border border-border shadow-sm rounded-2xl p-6">
          <div>
            <label className="block text-sm text-muted mb-1">プロジェクト名</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm text-muted mb-1">概要(任意)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputClass}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-muted mb-1">開始日(任意)</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm text-muted mb-1">終了日(任意)</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-muted mb-2">予算総額の決め方</label>
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => setBudgetMode("direct")}
                className={`text-xs px-3 py-1.5 rounded-full transition ${
                  budgetMode === "direct" ? "bg-accent text-white" : "bg-card-soft text-muted"
                }`}
              >
                金額を直接入力
              </button>
              <button
                type="button"
                onClick={() => setBudgetMode("estimate")}
                className={`text-xs px-3 py-1.5 rounded-full transition ${
                  budgetMode === "estimate" ? "bg-accent text-white" : "bg-card-soft text-muted"
                }`}
              >
                逆算のヒントを使う
              </button>
            </div>

            {budgetMode === "estimate" && (
              <div className="mb-3">
                <BudgetEstimateHelper projectName={name} startDate={startDate} endDate={endDate} />
              </div>
            )}

            <label className="block text-sm text-muted mb-1">予算総額(円)</label>
            <input
              type="number"
              min="0"
              required
              value={budgetAmount}
              onChange={(e) => setBudgetAmount(e.target.value)}
              className={inputClass}
              placeholder={budgetMode === "estimate" ? "AIの計算結果を入力してください" : undefined}
            />
          </div>

          <div>
            <label className="block text-sm text-muted mb-1">あなたの時給(このプロジェクトでの・任意)</label>
            <input
              type="number"
              min="0"
              value={myHourlyRate}
              onChange={(e) => setMyHourlyRate(e.target.value)}
              className={inputClass}
            />
            <div className="mt-2">
              <HourlyRateHint onApply={(v) => setMyHourlyRate(String(v))} />
            </div>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent hover:bg-accent-dark text-white text-sm font-medium px-4 py-2.5 rounded-xl disabled:opacity-50 transition"
          >
            {loading ? "作成中..." : "作成する"}
          </button>
        </form>
      </main>
    </>
  );
}
