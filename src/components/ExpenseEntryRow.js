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

// 購入費・経費の履歴1行。編集・削除に対応(自分が登録した行のみ)。
export default function ExpenseEntryRow({ entry, canEdit }) {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState("view"); // "view" | "edit" | "confirmDelete"
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState({
    expense_date: entry.expense_date,
    item_name: entry.item_name,
    amount: entry.amount,
    note: entry.note || "",
  });

  function setValue(field, v) {
    setValues((prev) => ({ ...prev, [field]: v }));
  }

  function cancel() {
    setValues({
      expense_date: entry.expense_date,
      item_name: entry.item_name,
      amount: entry.amount,
      note: entry.note || "",
    });
    setMode("view");
  }

  async function handleSave() {
    setSaving(true);
    await supabase
      .from("expenses")
      .update({
        expense_date: values.expense_date,
        item_name: values.item_name,
        amount: Number(values.amount) || 0,
        note: values.note || null,
      })
      .eq("id", entry.id);
    setSaving(false);
    setMode("view");
    router.refresh();
  }

  async function handleDelete() {
    setSaving(true);
    await supabase.from("expenses").delete().eq("id", entry.id);
    setSaving(false);
    router.refresh();
  }

  if (mode === "edit") {
    return (
      <tr className="border-t border-border bg-accent-soft/40">
        <td className="px-2 py-2">
          <input
            type="date"
            value={values.expense_date}
            onChange={(e) => setValue("expense_date", e.target.value)}
            className="w-full border border-border rounded-lg px-1.5 py-1 text-xs bg-card"
          />
        </td>
        <td className="px-2 py-2">
          <input
            value={values.item_name}
            onChange={(e) => setValue("item_name", e.target.value)}
            className="w-full border border-border rounded-lg px-1.5 py-1 text-xs bg-card"
          />
        </td>
        <td className="px-4 py-2.5 text-foreground truncate">{entry.profiles?.full_name || entry.profiles?.email}</td>
        <td className="px-2 py-2">
          <input
            value={values.note}
            onChange={(e) => setValue("note", e.target.value)}
            className="w-full border border-border rounded-lg px-1.5 py-1 text-xs bg-card"
          />
        </td>
        <td className="px-2 py-2">
          <input
            type="number"
            min="0"
            value={values.amount}
            onChange={(e) => setValue("amount", e.target.value)}
            className="w-full border border-border rounded-lg px-1.5 py-1 text-xs bg-card text-right"
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
      <td className="px-4 py-2.5 text-foreground whitespace-nowrap">{entry.expense_date}</td>
      <td className="px-4 py-2.5 text-foreground truncate">{entry.item_name}</td>
      <td className="px-4 py-2.5 text-foreground truncate">{entry.profiles?.full_name || entry.profiles?.email}</td>
      <td className="px-4 py-2.5 text-muted truncate">{entry.note || "—"}</td>
      <td className="px-4 py-2.5 text-right text-foreground font-medium">{formatYen(entry.amount)}</td>
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
