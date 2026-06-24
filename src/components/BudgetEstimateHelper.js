"use client";

import { useMemo, useState } from "react";

// 「具体的な予算額がまだ決まっていない」場合に使う、AIに計算してもらうための
// プロンプト文章を組み立てるヘルパー。アプリ自体は計算をせず、テキストを生成してコピーできるだけ。
export default function BudgetEstimateHelper({ projectName, startDate, endDate }) {
  const [members, setMembers] = useState([{ name: "", hourlyRate: "", weeklyHours: "" }]);
  const [copied, setCopied] = useState(false);

  function updateMember(index, field, value) {
    setMembers((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m))
    );
  }

  function addMember() {
    setMembers((prev) => [...prev, { name: "", hourlyRate: "", weeklyHours: "" }]);
  }

  function removeMember(index) {
    setMembers((prev) => prev.filter((_, i) => i !== index));
  }

  const prompt = useMemo(() => {
    const lines = [];
    lines.push("以下の条件から、プロジェクトの予算総額のおおよその見積もりを計算してください。");
    lines.push("");
    lines.push(`プロジェクト名: ${projectName || "(未入力)"}`);
    lines.push(`期間: ${startDate || "(未設定)"} 〜 ${endDate || "(未設定)"}`);
    lines.push("");
    lines.push("稼働予定メンバー:");
    members.forEach((m, i) => {
      lines.push(
        `- ${m.name || `メンバー${i + 1}`}: 時給 ${m.hourlyRate || "?"} 円, 週あたり想定稼働 ${m.weeklyHours || "?"} 時間(目安: フルタイム=週40時間)`
      );
    });
    lines.push("");
    lines.push(
      "各メンバーの「時給 × 週あたり稼働時間 × 期間内の週数」を合計して、人件費の見積もり総額を計算してください。" +
      "また、購入費・外注費などその他経費が別途発生しそうであれば、ざっくり加味した総額の目安も合わせて教えてください。"
    );
    return lines.join("\n");
  }, [projectName, startDate, endDate, members]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card-soft p-4 space-y-3">
      <p className="text-xs text-muted">
        プロジェクトに関わりそうなメンバーと、時給・週あたりの想定稼働時間を入力すると、
        AI(ChatGPTなど)に貼って計算してもらうための文章を作成できます。
      </p>

      <div className="space-y-2">
        {members.map((m, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end">
            <div>
              {i === 0 && <label className="block text-xs text-muted mb-1">名前</label>}
              <input
                value={m.name}
                onChange={(e) => updateMember(i, "name", e.target.value)}
                placeholder="例: 田中"
                className="w-full border border-border rounded-lg px-2 py-1.5 text-sm bg-card"
              />
            </div>
            <div>
              {i === 0 && <label className="block text-xs text-muted mb-1">時給(円)</label>}
              <input
                type="number"
                value={m.hourlyRate}
                onChange={(e) => updateMember(i, "hourlyRate", e.target.value)}
                className="w-full border border-border rounded-lg px-2 py-1.5 text-sm bg-card"
              />
            </div>
            <div>
              {i === 0 && <label className="block text-xs text-muted mb-1">週あたり稼働(h)</label>}
              <input
                type="number"
                value={m.weeklyHours}
                onChange={(e) => updateMember(i, "weeklyHours", e.target.value)}
                className="w-full border border-border rounded-lg px-2 py-1.5 text-sm bg-card"
              />
            </div>
            <button
              type="button"
              onClick={() => removeMember(i)}
              className="text-xs text-muted hover:text-danger px-2 py-1.5"
            >
              削除
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addMember}
        className="text-xs text-accent-dark underline"
      >
        + メンバーを追加
      </button>

      <div>
        <label className="block text-xs text-muted mb-1">生成されたプロンプト</label>
        <textarea
          readOnly
          value={prompt}
          rows={8}
          className="w-full border border-border rounded-lg px-3 py-2 text-xs bg-card font-mono"
        />
        <button
          type="button"
          onClick={handleCopy}
          className="mt-2 text-xs bg-accent hover:bg-accent-dark text-white px-3 py-1.5 rounded-lg transition"
        >
          {copied ? "コピーしました" : "コピーする"}
        </button>
      </div>
    </div>
  );
}
