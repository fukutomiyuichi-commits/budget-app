"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Header() {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-10 bg-card/90 backdrop-blur-sm border-b border-border">
      <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between">
        <Link href="/" className="font-bold text-accent-dark tracking-tight">
          予算管理アプリ
        </Link>
        <button
          onClick={handleLogout}
          className="text-sm text-muted hover:text-accent-dark transition"
        >
          ログアウト
        </button>
      </div>
    </header>
  );
}
