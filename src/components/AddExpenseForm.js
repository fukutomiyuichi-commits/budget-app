"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AddExpenseForm({ projectId }) {
  const router = useRouter();
  const supabase = createClient();

  const [itemName, setItemName] = useState("");
  const [amount, setAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
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

    const { error: insertError } = await supabase.from("expenses").insert({
      project_id: projectId,
      user_id: user.id,
      item_name: itemName,
      amount: Number(amount),
      expense_date: expenseDate,
      note: note || null,
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    setItemName("");
    setAmount("");
    setNote("");
    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5 bg-card border border-border shadow-sm rounded-2xl p-5">
      <h3 className="font-semibold text-sm text-foreground">購入費・経費を記録</h3>

      <div>
        <label className="block text-xs text-muted mb-1.5">品目・内容</label>
        <input
          required
          placeholder="例: 文房具"
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-card"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-muted mb-1.5">購入日</label>
          <input
            type="date"
            required
            value={expenseDate}
            onChange={(e) => setExpenseDate(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-card"
          />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1.5">金額(円)</label>
          <input
            type="number"
            min="0"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-card"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-muted mb-1.5">メモ(任意)</label>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-card"
        />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-accent hover:bg-accent-dark text-white text-sm font-medium px-4 py-2.5 rounded-xl disabled:opacity-50 transition"
      >
        {loading ? "登録中..." : "記録する"}
      </button>
    </form>
  );
}
