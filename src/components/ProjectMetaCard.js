"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function formatYen(n) {
  return new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" }).format(n || 0);
}

function formatDate(d) {
  const date = new Date(d);
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
}

const fieldInputClass =
  "w-full border border-border rounded-lg px-2.5 py-1.5 text-sm bg-card";

// プロジェクトの基本情報(名前・概要・予算・開始日・終了日)を
// 表示しつつ、クリックでその場編集できるカード
export default function ProjectMetaCard({ project }) {
  const router = useRouter();
  const supabase = createClient();

  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [values, setValues] = useState({
    name: project.name,
    description: project.description || "",
    budget_amount: project.budget_amount,
    start_date: project.start_date || "",
    end_date: project.end_date || "",
  });

  function setValue(field, v) {
    setValues((prev) => ({ ...prev, [field]: v }));
  }

  function cancel(field) {
    setValues((prev) => ({
      ...prev,
      [field]: field === "budget_amount" ? project.budget_amount : project[field] || "",
    }));
    setEditing(null);
  }

  async function save(field) {
    setSaving(true);
    const payload = {
      [field]: field === "budget_amount" ? Number(values[field]) || 0 : values[field] || null,
    };
    await supabase.from("projects").update(payload).eq("id", project.id);
    setSaving(false);
    setEditing(null);
    router.refresh();
  }

  const isClosed = project.status === "closed";

  async function toggleStatus() {
    setTogglingStatus(true);
    await supabase
      .from("projects")
      .update({ status: isClosed ? "active" : "closed" })
      .eq("id", project.id);
    setTogglingStatus(false);
    router.refresh();
  }

  return (
    <div className="bg-card border border-border shadow-sm rounded-2xl p-5">
      {/* ステータス行: 完了済みバッジ + 完了/再開ボタン */}
      <div className="flex items-center justify-between mb-3">
        {isClosed ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted bg-card-soft px-2.5 py-1 rounded-full">
            完了済み
          </span>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={toggleStatus}
          disabled={togglingStatus}
          className={`text-xs font-medium px-3 py-1.5 rounded-lg transition disabled:opacity-50 ${
            isClosed
              ? "bg-accent-soft text-accent-dark hover:bg-accent hover:text-white"
              : "text-muted hover:text-accent-dark hover:bg-card-soft"
          }`}
        >
          {togglingStatus ? "更新中..." : isClosed ? "再開する" : "プロジェクトを完了にする"}
        </button>
      </div>

      {/* プロジェクト名 */}
      {editing === "name" ? (
        <div className="flex items-center gap-2 mb-1.5">
          <input
            autoFocus
            value={values.name}
            onChange={(e) => setValue("name", e.target.value)}
            className="text-lg font-bold text-foreground tracking-tight border border-border rounded-lg px-2.5 py-1.5 bg-card flex-1"
          />
          <button
            type="button"
            onClick={() => save("name")}
            disabled={saving}
            className="text-xs bg-accent hover:bg-accent-dark text-white px-3 py-1.5 rounded-lg transition shrink-0"
          >
            保存
          </button>
          <button
            type="button"
            onClick={() => cancel("name")}
            className="text-xs text-muted hover:text-accent-dark transition shrink-0"
          >
            取消
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditing("name")}
          className="block text-xl font-bold text-foreground tracking-tight mb-1.5 hover:text-accent-dark transition text-left"
        >
          {project.name}
        </button>
      )}

      {/* 概要 */}
      {editing === "description" ? (
        <div className="flex items-start gap-2 mb-4">
          <textarea
            autoFocus
            rows={2}
            value={values.description}
            onChange={(e) => setValue("description", e.target.value)}
            placeholder="概要を入力"
            className="text-sm border border-border rounded-lg px-2.5 py-1.5 bg-card flex-1"
          />
          <div className="flex flex-col gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => save("description")}
              disabled={saving}
              className="text-xs bg-accent hover:bg-accent-dark text-white px-3 py-1 rounded-lg transition"
            >
              保存
            </button>
            <button
              type="button"
              onClick={() => cancel("description")}
              className="text-xs text-muted hover:text-accent-dark transition"
            >
              取消
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditing("description")}
          className="block text-sm text-muted mb-4 hover:text-accent-dark transition text-left"
        >
          {project.description || "概要を追加"}
        </button>
      )}

      {/* 予算・開始日・終了日 */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
        <MetaField
          label="予算総額"
          editing={editing === "budget_amount"}
          saving={saving}
          display={formatYen(project.budget_amount)}
          onEdit={() => setEditing("budget_amount")}
          onSave={() => save("budget_amount")}
          onCancel={() => cancel("budget_amount")}
        >
          <input
            type="number"
            min="0"
            autoFocus
            value={values.budget_amount}
            onChange={(e) => setValue("budget_amount", e.target.value)}
            className={fieldInputClass}
          />
        </MetaField>

        <MetaField
          label="開始日"
          editing={editing === "start_date"}
          saving={saving}
          display={project.start_date ? formatDate(project.start_date) : "未設定"}
          onEdit={() => setEditing("start_date")}
          onSave={() => save("start_date")}
          onCancel={() => cancel("start_date")}
        >
          <input
            type="date"
            autoFocus
            value={values.start_date}
            onChange={(e) => setValue("start_date", e.target.value)}
            className={fieldInputClass}
          />
        </MetaField>

        <MetaField
          label="終了日"
          editing={editing === "end_date"}
          saving={saving}
          display={project.end_date ? formatDate(project.end_date) : "未設定"}
          onEdit={() => setEditing("end_date")}
          onSave={() => save("end_date")}
          onCancel={() => cancel("end_date")}
        >
          <input
            type="date"
            autoFocus
            value={values.end_date}
            onChange={(e) => setValue("end_date", e.target.value)}
            className={fieldInputClass}
          />
        </MetaField>
      </div>
    </div>
  );
}

function MetaField({ label, editing, saving, display, onEdit, onSave, onCancel, children }) {
  return (
    <div>
      <p className="text-xs text-muted mb-1">{label}</p>
      {editing ? (
        <div className="space-y-1.5">
          {children}
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="text-xs bg-accent hover:bg-accent-dark text-white px-2.5 py-1 rounded-lg transition"
            >
              保存
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="text-xs text-muted hover:text-accent-dark transition"
            >
              取消
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={onEdit}
          className="font-semibold text-foreground hover:text-accent-dark transition text-left"
        >
          {display}
        </button>
      )}
    </div>
  );
}
