import { redirect } from "next/navigation";

// プロフィール情報はホーム画面(プロジェクト一覧)に統合されたため、
// 古いブックマークなどでこのURLに来た場合はホームへ転送する
export default function ProfilePage() {
  redirect("/");
}
