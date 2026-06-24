"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState("signin"); // 'signin' | 'signup'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [infoMsg, setInfoMsg] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setInfoMsg(null);
    setLoading(true);

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else {
        router.push("/");
        router.refresh();
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) {
        setError(error.message);
      } else {
        setInfoMsg("登録しました。確認メールが届いていればリンクをクリックしてからログインしてください。");
        setMode("signin");
      }
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm bg-card rounded-2xl shadow-sm border border-border p-6">
        <h1 className="text-xl font-bold text-accent-dark mb-1">予算管理アプリ</h1>
        <p className="text-sm text-muted mb-6">
          {mode === "signin" ? "ログイン" : "新規登録"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "signup" && (
            <div>
              <label className="block text-sm text-muted mb-1">氏名</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-card"
              />
            </div>
          )}
          <div>
            <label className="block text-sm text-muted mb-1">メールアドレス</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-card"
            />
          </div>
          <div>
            <label className="block text-sm text-muted mb-1">パスワード</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-card"
            />
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}
          {infoMsg && <p className="text-sm text-accent-dark">{infoMsg}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent hover:bg-accent-dark text-white rounded-xl py-2 text-sm font-medium disabled:opacity-50 transition"
          >
            {loading ? "処理中..." : mode === "signin" ? "ログイン" : "登録する"}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="w-full text-center text-sm text-muted mt-4 underline hover:text-accent-dark"
        >
          {mode === "signin" ? "新規登録はこちら" : "ログインはこちら"}
        </button>
      </div>
    </div>
  );
}
