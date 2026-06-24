import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// パスワード再設定メールのリンクから飛んでくる経路。
// メール内のリンクには一時的な code が付いており、それを実際のログインセッションに
// 交換してから、新しいパスワードを入力する画面へ転送する。
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${origin}/reset-password`);
}
