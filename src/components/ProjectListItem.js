"use client";

import { useState } from "react";
import Link from "next/link";
import AddLaborForm from "@/components/AddLaborForm";
import AddExpenseForm from "@/components/AddExpenseForm";

function formatYen(n) {
  return new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" }).format(n || 0);
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
      <path
        d="M4 8.2 12 4l8 4.2v7.6L12 20l-8-4.2V8.2Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M4 8.2 12 12l8-3.8M12 12v8" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5">
      <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

// プロジェクト一覧の1行分。カード本体に加えて、稼動/購入の記録ボタンを押すと
// 詳細ページに移動せずその場で軽量フォームを開けるようにする。
// (現場で「1件だけサッと記録したい」時に、グラフや履歴を含む詳細ページ全体を
//  読み込ませる必要がないようにするための導線)
export default function ProjectListItem({ project: p, members }) {
  const [openMode, setOpenMode] = useState(null); // null | "labor" | "expense"

  const usedRatio = p.budget_amount > 0
    ? Math.min(100, (p.total_actual_cost / p.budget_amount) * 100)
    : 0;
  const overBudget = p.remaining_budget < 0;
  const isClosed = p.status === "closed";

  function toggle(mode) {
    setOpenMode((cur) => (cur === mode ? null : mode));
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-3 items-stretch">
        <Link
          href={`/projects/${p.project_id}`}
          className="flex-1 min-w-0 block rounded-2xl p-5 bg-card border border-border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
        >
          <div className="flex justify-between items-start mb-3">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              {p.name}
              {isClosed && (
                <span className="text-xs font-medium text-muted bg-card-soft px-1.5 py-0.5 rounded-full leading-none">
                  完了済み
                </span>
              )}
            </h2>
            <span className={`text-sm font-semibold ${overBudget ? "text-danger" : "text-accent-dark"}`}>
              残り {formatYen(p.remaining_budget)}
            </span>
          </div>
          <div className="w-full bg-card-soft rounded-full h-2 mb-3 overflow-hidden">
            <div
              className={`h-2 rounded-full ${overBudget ? "bg-danger" : "bg-accent"}`}
              style={{ width: `${usedRatio}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted">
            <span>予算 {formatYen(p.budget_amount)}</span>
            <span>
              実績 {formatYen(p.total_actual_cost)}(人件費 {formatYen(p.total_labor_cost)} / 購入費 {formatYen(p.total_expense_cost)})
            </span>
          </div>
        </Link>

        {!isClosed && (
        <div className="flex flex-col gap-2 shrink-0 justify-center">
          <button
            type="button"
            onClick={() => toggle("labor")}
            title="稼動を記録"
            className={`w-20 min-h-11 flex items-center gap-1.5 justify-center rounded-xl border transition-all px-2 ${
              openMode === "labor"
                ? "bg-accent text-white border-transparent"
                : "bg-accent-soft text-accent-dark border-transparent hover:bg-accent hover:text-white"
            }`}
          >
            <ClockIcon />
            <span className="text-xs font-medium leading-none">稼動</span>
          </button>
          <button
            type="button"
            onClick={() => toggle("expense")}
            title="購入費を記録"
            className={`w-20 min-h-11 flex items-center gap-1.5 justify-center rounded-xl border transition-all px-2 ${
              openMode === "expense"
                ? "bg-accent text-white border-transparent"
                : "bg-accent-soft text-accent-dark border-transparent hover:bg-accent hover:text-white"
            }`}
          >
            <BoxIcon />
            <span className="text-xs font-medium leading-none">購入</span>
          </button>
        </div>
        )}
      </div>

      {openMode && (
        <div className="relative pl-1">
          <button
            type="button"
            onClick={() => setOpenMode(null)}
            className="absolute -top-1 right-2 z-10 w-6 h-6 flex items-center justify-center rounded-full bg-card border border-border text-muted hover:text-accent-dark transition"
            title="閉じる"
          >
            <CloseIcon />
          </button>
          {openMode === "labor" ? (
            <AddLaborForm projectId={p.project_id} members={members} />
          ) : (
            <AddExpenseForm projectId={p.project_id} />
          )}
        </div>
      )}
    </div>
  );
}
