# 予算管理アプリ(Supabase + Next.js 練習用)

プロジェクトの予算に対して、人件費(時給×稼働時間)と購入費・経費を記録し、
予算消化状況を一覧・詳細画面で確認できる社内向けアプリです。

## 機能

- メール+パスワードでのログイン/新規登録(Supabase Auth)
- プロジェクトの作成(予算総額・期間を設定)
- プロジェクトへのメンバー追加(メールアドレス指定、共同利用)
- 人件費の記録(作業日・稼働時間・時給)
  - 時給がわからない場合、月額基本給と月間所定労働時間から逆算するヒント機能つき
- 購入費・経費の記録(品目・金額・カテゴリ自由入力)
- プロジェクトごとの予算 vs 実績(人件費+購入費)の自動集計・残予算表示

## 技術構成

- フロントエンド: Next.js (App Router)
- バックエンド: Supabase(PostgreSQL + Auth + Row Level Security)
- スタイル: Tailwind CSS

## セットアップ手順

### 1. Supabaseプロジェクトを作成

1. https://supabase.com にアクセスし、新規プロジェクトを作成
2. 作成後、ダッシュボードの「SQL Editor」を開く
3. このリポジトリの `supabase/schema.sql` の内容を全てコピーして実行
   - テーブル(profiles, projects, project_members, labor_entries, expenses)
   - RLS(Row Level Security)ポリシー
   - 予算集計用ビュー(project_budget_summary)
   が作成されます

### 2. 環境変数を設定

Supabaseダッシュボードの「Project Settings > API」から下記2つを取得します。

- Project URL
- anon public key

`.env.local.example` を `.env.local` にコピーし、値を書き換えてください。

```bash
cp .env.local.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=あなたのProject URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=あなたのanon key
```

### 3. 依存パッケージのインストールと起動

```bash
npm install
npm run dev
```

http://localhost:3000 を開くとログイン画面が表示されます。
「新規登録はこちら」からアカウントを作成して使い始めてください。

### 4. 本番ビルド

```bash
npm run build
npm start
```

※ 開発に使用したサンドボックス環境では、Next.jsが使うネイティブバイナリ(SWC)が
環境側の制約でクラッシュし `npm run build` を実行できませんでした(コード自体の
構文エラーではなく、esbuildによる構文チェックは全ファイルパスしています)。
実際のPC上では問題なく動作するはずですが、もし `npm run build` でエラーが出た場合は
教えてください。

## ディレクトリ構成

```
src/
  app/
    login/page.js          ログイン・新規登録
    projects/new/page.js   プロジェクト作成
    projects/[id]/page.js  プロジェクト詳細(予算サマリー・履歴・入力フォーム)
    page.js                プロジェクト一覧(ダッシュボード)
  components/
    Header.js              共通ヘッダー(ログアウト)
    AddLaborForm.js         人件費入力フォーム
    AddExpenseForm.js       購入費入力フォーム
    HourlyRateHint.js        時給逆算ヒント
    InviteMemberForm.js     メンバー追加フォーム
  lib/supabase/
    client.js               ブラウザ用Supabaseクライアント
    server.js               サーバー用Supabaseクライアント
  middleware.js             ログイン状態のチェック・セッション更新
supabase/
  schema.sql                テーブル・RLS・ビューのSQL
```

## データモデルの考え方

- `projects`: プロジェクトごとの予算総額を持つ
- `project_members`: どのユーザーがどのプロジェクトにアクセスできるかを管理(共同利用の中核)
- `labor_entries`: 1件 = 1人の1日分の稼働(時間×時給で人件費を算出)
- `expenses`: 1件 = 1つの購入・経費
- `project_budget_summary`: 上記を集計して「予算 / 人件費合計 / 購入費合計 / 残予算」を計算するビュー

## 今後の改善余地(練習として試すと良い点)

- メンバー追加を管理者(owner)のみに制限する(現状は全ログインユーザーが追加可能)
- プロジェクトの編集・削除機能
- 月次・カテゴリ別の集計グラフ
- CSVエクスポート
