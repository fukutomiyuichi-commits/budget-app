"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// パスワード再設定メールのリンクを踏んだ後に表示される、新しいパスワードの入力画面。
export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("パスワードは6文字以上にしてください");
      return;
    }
    if (password !== confirm) {
      setError("パスワードが一致しません");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm bg-card rounded-2xl shadow-sm border border-border p-6 text-center">
          <p className="text-sm text-foreground mb-4">
            パスワードを変更しました。新しいパスワードでログインしてください。
          </p>
          <button
            onClick={() => router.push("/login")}
            className="w-full bg-accent hover:bg-accent-dark text-white rounded-xl py-2 text-sm font-medium transition"
          >
            ログイン画面へ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm bg-card rounded-2xl shadow-sm border border-border p-6">
        <h1 className="text-xl font-bold text-accent-dark mb-1">パスワードの再設定</h1>
        <p className="text-sm text-muted mb-6">新しいパスワードを入力してください</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm text-muted mb-1">新しいパスワード</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-card"
            />
          </div>
          <div>
            <label className="block text-sm text-muted mb-1">新しいパスワード(確認)</label>
            <input
              type="password"
              required
              minLength={6}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-card"
            />
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent hover:bg-accent-dark text-white rounded-xl py-2 text-sm font-medium disabled:opacity-50 transition"
          >
            {loading ? "変更中..." : "パスワードを変更する"}
          </button>
        </form>
      </div>
    </div>
  );
}
