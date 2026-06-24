"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function formatYen(n) {
  return new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" }).format(n || 0);
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
      <path
        d="M4 16.5V20h3.5L18 9.5l-3.5-3.5L4 16.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M13 7l3.5 3.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
      <path d="M5 7h14M9 7V5h6v2M7 7l1 13h8l1-13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// 人件費の履歴1行。編集(その場でフォーム化)・削除(その場で2段階確認)に対応。
// 自分が登録した行のみ編集・削除できる(他メンバーの記録を誤って書き換えられないようにするため)。
export default function LaborEntryRow({ entry, members, canEdit }) {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState("view"); // "view" | "edit" | "confirmDelete"
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState({
    work_date: entry.work_date,
    user_id: entry.user_id,
    hours: entry.hours,
    hourly_rate: entry.hourly_rate,
    note: entry.note || "",
  });

  function setValue(field, v) {
    setValues((prev) => ({ ...prev, [field]: v }));
  }

  function cancel() {
    setValues({
      work_date: entry.work_date,
      user_id: entry.user_id,
      hours: entry.hours,
      hourly_rate: entry.hourly_rate,
      note: entry.note || "",
    });
    setMode("view");
  }

  async function handleSave() {
    setSaving(true);
    await supabase
      .from("labor_entries")
      .update({
        work_date: values.work_date,
        user_id: values.user_id,
        hours: Number(values.hours) || 0,
        hourly_rate: Number(values.hourly_rate) || 0,
        note: values.note || null,
      })
      .eq("id", entry.id);
    setSaving(false);
    setMode("view");
    router.refresh();
  }

  async function handleDelete() {
    setSaving(true);
    await supabase.from("labor_entries").delete().eq("id", entry.id);
    setSaving(false);
    router.refresh();
  }

  if (mode === "edit") {
    return (
      <tr className="border-t border-border bg-accent-soft/40">
        <td className="px-2 py-2">
          <input
            type="date"
            value={values.work_date}
            onChange={(e) => setValue("work_date", e.target.value)}
            className="w-full border border-border rounded-lg px-1.5 py-1 text-xs bg-card"
          />
        </td>
        <td className="px-2 py-2">
          <select
            value={values.user_id}
            onChange={(e) => setValue("user_id", e.target.value)}
            className="w-full border border-border rounded-lg px-1.5 py-1 text-xs bg-card"
          >
            {members.map((m) => (
              <option key={m.user_id} value={m.user_id}>{m.name}</option>
            ))}
          </select>
        </td>
        <td className="px-2 py-2">
          <input
            type="number"
            min="0"
            step="0.5"
            value={values.hours}
            onChange={(e) => setValue("hours", e.target.value)}
            className="w-full border border-border rounded-lg px-1.5 py-1 text-xs bg-card text-right"
          />
        </td>
        <td className="px-2 py-2">
          <input
            type="number"
            min="0"
            value={values.hourly_rate}
            onChange={(e) => setValue("hourly_rate", e.target.value)}
            className="w-full border border-border rounded-lg px-1.5 py-1 text-xs bg-card text-right"
          />
        </td>
        <td className="px-4 py-2 text-right text-foreground font-medium">
          {formatYen((Number(values.hours) || 0) * (Number(values.hourly_rate) || 0))}
        </td>
        <td className="px-2 py-2">
          <input
            value={values.note}
            onChange={(e) => setValue("note", e.target.value)}
            className="w-full border border-border rounded-lg px-1.5 py-1 text-xs bg-card"
          />
        </td>
        <td className="px-2 py-2 text-right whitespace-nowrap">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="text-xs bg-accent hover:bg-accent-dark text-white px-2.5 py-1 rounded-lg transition disabled:opacity-50"
          >
            保存
          </button>
          <button
            type="button"
            onClick={cancel}
            className="text-xs text-muted hover:text-accent-dark transition ml-1.5"
          >
            取消
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t border-border">
      <td className="px-4 py-2.5 text-foreground whitespace-nowrap">{entry.work_date}</td>
      <td className="px-4 py-2.5 text-foreground truncate">{entry.profiles?.full_name || entry.profiles?.email}</td>
      <td className="px-4 py-2.5 text-right text-foreground">{entry.hours}h</td>
      <td className="px-4 py-2.5 text-right text-foreground">{formatYen(entry.hourly_rate)}</td>
      <td className="px-4 py-2.5 text-right text-foreground font-medium">{formatYen(entry.hours * entry.hourly_rate)}</td>
      <td className="px-4 py-2.5 text-muted truncate">{entry.note || "—"}</td>
      <td className="px-2 py-2.5 text-right whitespace-nowrap">
        {canEdit && mode === "view" && (
          <span className="inline-flex gap-1">
            <button
              type="button"
              onClick={() => setMode("edit")}
              title="編集する"
              className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-muted hover:text-accent-dark hover:bg-accent-soft transition"
            >
              <PencilIcon />
            </button>
            <button
              type="button"
              onClick={() => setMode("confirmDelete")}
              title="削除する"
              className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-muted hover:text-danger hover:bg-danger-soft transition"
            >
              <TrashIcon />
            </button>
          </span>
        )}
        {canEdit && mode === "confirmDelete" && (
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-xs text-danger">削除しますか?</span>
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving}
              className="text-xs bg-danger hover:opacity-90 text-white px-2.5 py-1 rounded-lg transition disabled:opacity-50"
            >
              削除
            </button>
            <button
              type="button"
              onClick={() => setMode("view")}
              className="text-xs text-muted hover:text-accent-dark transition"
            >
              取消
            </button>
          </span>
        )}
      </td>
    </tr>
  );
}
