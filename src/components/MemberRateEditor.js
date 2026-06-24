"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import HourlyRateHint from "@/components/HourlyRateHint";

export default function MemberRateEditor({ projectId, userId, hourlyRate }) {
  const router = useRouter();
  const supabase = createClient();

  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(hourlyRate ?? 0);
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setLoading(true);
    await supabase
      .from("project_members")
      .update({ hourly_rate: Number(value) || 0 })
      .eq("project_id", projectId)
      .eq("user_id", userId);
    setLoading(false);
    setEditing(false);
    router.refresh();
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-accent-dark text-sm hover:underline"
      >
        {new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" }).format(hourlyRate || 0)} / 時
      </button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-1">
        <input
          type="number"
          min="0"
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-20 border border-border rounded-lg px-1.5 py-0.5 text-sm bg-card"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={loading}
          className="text-xs bg-accent hover:bg-accent-dark text-white px-2 py-1 rounded-lg transition"
        >
          保存
        </button>
      </div>
      <HourlyRateHint onApply={(v) => setValue(v)} />
    </div>
  );
}
