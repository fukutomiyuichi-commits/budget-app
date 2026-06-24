"use client";

import { useMemo, useState } from "react";

// 月給・想定月間稼働時間から時給を逆算するヒント計算機
// 雇用契約書に書かれている「月額基本給」「みなし所定労働時間/月」などから算出するイメージ
// onApply を渡さない場合は「結果を表示するだけ」のスタンドアロン計算機として動作する
export default function HourlyRateHint({ onApply, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const [monthlySalary, setMonthlySalary] = useState("");
  const [monthlyHours, setMonthlyHours] = useState("160"); // 一般的な月間稼働時間の目安

  const hourlyRate = useMemo(() => {
    const salary = Number(monthlySalary);
    const hours = Number(monthlyHours);
    if (!salary || !hours) return null;
    return Math.round(salary / hours);
  }, [monthlySalary, monthlyHours]);

  return (
    <div className={defaultOpen ? "" : "sm:text-right"}>
      {!defaultOpen && (
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="text-xs font-medium text-accent-dark bg-accent-soft hover:bg-accent hover:text-white px-3 py-1.5 rounded-full transition"
        >
          {open ? "ヒントを閉じる" : "時給がわからない場合のヒント"}
        </button>
      )}

      {open && (
        <div className={defaultOpen ? "space-y-2" : "mt-3 space-y-2 text-left rounded-xl p-3 bg-card-soft text-sm"}>
          <p className="text-xs text-muted">
            雇用契約書に記載の「月額基本給」と「月間の所定労働時間」から、おおよその時給を計算します。
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-muted mb-1">月額基本給(円)</label>
              <input
                type="number"
                value={monthlySalary}
                onChange={(e) => setMonthlySalary(e.target.value)}
                className="w-full border border-border rounded-lg px-2 py-1 text-sm bg-card"
                placeholder="契約書の基本給"
              />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">月間所定労働時間</label>
              <input
                type="number"
                value={monthlyHours}
                onChange={(e) => setMonthlyHours(e.target.value)}
                className="w-full border border-border rounded-lg px-2 py-1 text-sm bg-card"
                placeholder="契約書の所定労働時間"
              />
            </div>
          </div>

          {hourlyRate !== null && (
            <div className="flex items-center justify-between bg-card border border-border rounded-lg px-3 py-2">
              <span className="text-foreground">
                計算結果: <strong>{hourlyRate.toLocaleString()} 円/時</strong>
              </span>
              {onApply && (
                <button
                  type="button"
                  onClick={() => onApply(hourlyRate)}
                  className="text-xs bg-accent hover:bg-accent-dark text-white px-3 py-1 rounded-lg transition"
                >
                  この値を使う
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
