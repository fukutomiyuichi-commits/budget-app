"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function formatYen(n) {
  return new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" }).format(n || 0);
}

// members: [{ user_id, name, hourly_rate }]
export default function AddLaborForm({ projectId, members }) {
  const router = useRouter();
  const supabase = createClient();

  const [userId, setUserId] = useState(members?.[0]?.user_id ?? "");
  const [workDate, setWorkDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [hours, setHours] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const selectedMember = useMemo(
    () => members?.find((m) => m.user_id === userId),
    [members, userId]
  );
  const hourlyRate = selectedMember?.hourly_rate ?? 0;
  const estimatedAmount = (Number(hours) || 0) * hourlyRate;

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!userId) {
      setError("メンバーを選択してください");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("labor_entries").insert({
      project_id: projectId,
      user_id: userId,
      work_date: workDate,
      hours: Number(hours),
      hourly_rate: hourlyRate,
      note: note || null,
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    setHours("");
    setNote("");
    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5 bg-card border border-border shadow-sm rounded-2xl p-5">
      <h3 className="font-semibold text-sm text-foreground">人件費を記録</h3>

      <div>
        <label className="block text-xs text-muted mb-1.5">メンバー</label>
        <select
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-card"
        >
          {members?.map((m) => (
            <option key={m.user_id} value={m.user_id}>
              {m.name}(時給 {formatYen(m.hourly_rate)})
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-muted mb-1.5">作業日</label>
          <input
            type="date"
            required
            value={workDate}
            onChange={(e) => setWorkDate(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-card"
          />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1.5">稼働時間(h)</label>
          <input
            type="number"
            step="0.25"
            min="0"
            required
            placeholder="例: 4"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-card"
          />
        </div>
      </div>

      {hours && (
        <div className="rounded-lg bg-accent-soft px-3 py-2.5 text-sm text-accent-dark">
          金額: <strong>{formatYen(estimatedAmount)}</strong>(時給 {formatYen(hourlyRate)} × {hours}h)
        </div>
      )}

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
        disabled={loading || !members?.length}
        className="w-full bg-accent hover:bg-accent-dark text-white text-sm font-medium px-4 py-2.5 rounded-xl disabled:opacity-50 transition"
      >
        {loading ? "登録中..." : "記録する"}
      </button>
    </form>
  );
}
