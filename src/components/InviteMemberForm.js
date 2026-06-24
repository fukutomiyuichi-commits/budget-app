"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// メールアドレスを指定して、既にアカウント登録済みのメンバーをプロジェクトに追加する
// (本人がまだ未登録の場合は、先にそのメンバーにログイン/新規登録してもらう必要がある)
export default function InviteMemberForm({ projectId }) {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (profileError || !profile) {
      setError("そのメールアドレスのユーザーが見つかりません。先にアプリへの登録が必要です。");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("project_members").insert({
      project_id: projectId,
      user_id: profile.id,
      role: "member",
      hourly_rate: Number(hourlyRate) || 0,
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    setEmail("");
    setHourlyRate("");
    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="pt-4 border-t border-border">
      <p className="text-xs text-muted mb-2">メンバーを追加(アプリに登録済みのメールアドレス)</p>
      <div className="flex flex-wrap gap-2 items-start">
        <input
          type="email"
          required
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 text-sm bg-card flex-1 min-w-[180px]"
        />
        <input
          type="number"
          min="0"
          placeholder="時給(円)"
          value={hourlyRate}
          onChange={(e) => setHourlyRate(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 text-sm bg-card w-28"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-accent hover:bg-accent-dark text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50 transition"
        >
          追加
        </button>
      </div>
      {error && <p className="text-xs text-danger mt-2">{error}</p>}
    </form>
  );
}
