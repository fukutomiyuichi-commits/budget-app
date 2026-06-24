"use client";

import { useMemo, useRef, useState } from "react";

function formatYen(n) {
  return new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" }).format(n || 0);
}

function formatDate(d) {
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

const ACCENT = "#5c7a92";
const DANGER = "#b9594f";
const MUTED = "#a59c8a";

// laborEntries: [{ work_date, hours, hourly_rate }], expenses: [{ expense_date, amount }]
// project: { start_date, end_date, budget_amount }
export default function BudgetBurnChart({ project, laborEntries = [], expenses = [] }) {
  const svgRef = useRef(null);
  const [hoverIdx, setHoverIdx] = useState(null);

  const events = [
    ...laborEntries.map((l) => ({ date: new Date(l.work_date), amount: l.hours * l.hourly_rate })),
    ...expenses.map((e) => ({ date: new Date(e.expense_date), amount: e.amount })),
  ].sort((a, b) => a.date - b.date);

  const budget = Number(project.budget_amount) || 0;
  // 日付の「時刻」部分を切り捨てて当日0時で固定する。
  // サーバーでHTMLを生成した瞬間とブラウザが読み込む瞬間でミリ秒単位の差が出ると、
  // それがグラフの座標計算に伝わってハイドレーションエラーになるため、日単位に揃える。
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = project.start_date ? new Date(project.start_date) : (events[0]?.date ?? today);
  const endKnown = project.end_date ? new Date(project.end_date) : null;

  if (events.length === 0) {
    return (
      <div className="rounded-xl bg-card-soft p-4 text-sm text-muted">
        まだ記録がないため、予算消化の見通しはまだ表示できません。人件費や経費を記録すると、ここにグラフが表示されます。
      </div>
    );
  }

  // 累積消化額の折れ線(実績)
  let cumulative = 0;
  const actualPoints = events.map((e) => {
    cumulative += e.amount;
    return { date: e.date, value: cumulative };
  });
  const totalSpent = cumulative;
  const points = [{ date: start, value: 0 }, ...actualPoints];

  // 予測(終了日が未設定の場合): 開始日から今日までの平均ペースで延長する
  const daysElapsed = Math.max(1, Math.round((today - start) / 86400000));
  const dailyRate = totalSpent / daysElapsed;
  const projectedEnd = !endKnown && dailyRate > 0 && budget > 0
    ? addDays(start, Math.round(budget / dailyRate))
    : null;

  const xMax = endKnown ?? projectedEnd ?? addDays(start, Math.max(30, daysElapsed + 14));
  const xMin = start;
  const xSpan = Math.max(1, xMax - xMin);

  const yMax = Math.max(budget, totalSpent) * 1.1 || 1;

  const width = 640;
  const height = 200;
  const padL = 8;
  const padR = 8;
  const padT = 22;
  const padB = 24;

  function xScale(date) {
    return padL + ((date - xMin) / xSpan) * (width - padL - padR);
  }
  function yScale(value) {
    return height - padB - (value / yMax) * (height - padT - padB);
  }

  const linePoints = points.map((p) => ({ x: xScale(p.date), y: yScale(p.value) }));
  const actualLinePath = linePoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath =
    `${actualLinePath} L ${linePoints[linePoints.length - 1].x} ${height - padB} ` +
    `L ${linePoints[0].x} ${height - padB} Z`;

  // 理想ペース(終了日がある場合): 開始日0円 → 終了日に予算額ちょうど
  const idealPath = endKnown
    ? `M ${xScale(xMin)} ${yScale(0)} L ${xScale(endKnown)} ${yScale(budget)}`
    : null;

  // 予測ライン(終了日がない場合): 今日の実績地点 → 予測終了日に予算額
  const projectionPath = projectedEnd
    ? `M ${xScale(today)} ${yScale(totalSpent)} L ${xScale(projectedEnd)} ${yScale(budget)}`
    : null;

  const budgetLineY = yScale(budget);
  const overBudget = totalSpent > budget;

  function updateHoverFromClientX(clientX) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const relX = ((clientX - rect.left) / rect.width) * width;
    let nearest = 0;
    let nearestDist = Infinity;
    linePoints.forEach((p, i) => {
      const d = Math.abs(p.x - relX);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = i;
      }
    });
    setHoverIdx(nearest);
  }

  function handleMove(e) {
    updateHoverFromClientX(e.clientX);
  }

  // スマホ等のタッチ操作向け: 指でなぞっている間、マウスホバーと同じ見せ方にする
  function handleTouchMove(e) {
    const touch = e.touches[0];
    if (!touch) return;
    updateHoverFromClientX(touch.clientX);
  }

  const hover = hoverIdx !== null ? { point: points[hoverIdx], pos: linePoints[hoverIdx] } : null;

  return (
    <div className="space-y-2">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full touch-none cursor-crosshair"
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverIdx(null)}
        onTouchStart={handleTouchMove}
        onTouchMove={handleTouchMove}
        onTouchEnd={() => setHoverIdx(null)}
      >
        <defs>
          <linearGradient id="burnFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ACCENT} stopOpacity="0.22" />
            <stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* 横グリッド線(0%・50%・100%) */}
        {[0, 0.5, 1].map((f) => (
          <line
            key={f}
            x1={padL}
            y1={padT + f * (height - padT - padB)}
            x2={width - padR}
            y2={padT + f * (height - padT - padB)}
            stroke="#e5dcca"
            strokeWidth="1"
          />
        ))}

        {/* 予算ライン */}
        <line x1={padL} y1={budgetLineY} x2={width - padR} y2={budgetLineY} stroke={DANGER} strokeDasharray="4 4" strokeWidth="1.2" />
        <text x={width - padR} y={budgetLineY - 8} textAnchor="end" fontSize="11" fill={DANGER}>
          予算 {formatYen(budget)}
        </text>

        {/* 理想ペース(終了日がある場合) */}
        {idealPath && (
          <path d={idealPath} fill="none" stroke={MUTED} strokeDasharray="3 3" strokeWidth="1.5" />
        )}

        {/* 予測ライン(終了日がない場合) */}
        {projectionPath && (
          <path d={projectionPath} fill="none" stroke={MUTED} strokeDasharray="3 3" strokeWidth="1.5" />
        )}

        {/* 実績の累積消化額(塗り+線) */}
        <path d={areaPath} fill="url(#burnFill)" stroke="none" />
        <path
          d={actualLinePath}
          fill="none"
          stroke={ACCENT}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* ホバー時のガイド */}
        {hover && (
          <>
            <line
              x1={hover.pos.x}
              y1={padT}
              x2={hover.pos.x}
              y2={height - padB}
              stroke="#bdb39d"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
            <circle cx={hover.pos.x} cy={hover.pos.y} r="4.5" fill="#fffdf9" stroke={ACCENT} strokeWidth="2.5" />
          </>
        )}

        {/* 軸ラベル */}
        <text x={padL} y={height - 8} fontSize="11" fill={MUTED}>{formatDate(xMin)}</text>
        <text x={width - padR} y={height - 8} textAnchor="end" fontSize="11" fill={MUTED}>
          {formatDate(xMax)}
        </text>
      </svg>

      {/* ホバー時のツールチップ(数値表示) */}
      <div className="h-10 flex items-center">
        {hover ? (
          <div className="rounded-lg bg-card-soft px-3 py-1.5 text-sm">
            <span className="text-muted mr-2">{formatDate(hover.point.date)}</span>
            <span className="font-semibold text-accent-dark">{formatYen(hover.point.value)}</span>
            <span className="text-muted ml-1">消化</span>
          </div>
        ) : (
          <p className="text-xs text-muted">グラフ上をなぞる(指でもOK)と、その時点の消化額を確認できます。</p>
        )}
      </div>

      <div className="text-xs text-muted space-y-1">
        <p>
          <span className="inline-block w-3 h-1.5 rounded-full bg-accent align-middle mr-1" />実際の消化額の推移
          {endKnown && (
            <>
              <span className="inline-block w-3 h-1.5 rounded-full bg-muted align-middle mr-1 ml-3" />理想的なペース(終了日に予算ちょうど使い切る場合)
            </>
          )}
          {projectedEnd && (
            <>
              <span className="inline-block w-3 h-1.5 rounded-full bg-muted align-middle mr-1 ml-3" />このままのペースで進んだ場合の予測
            </>
          )}
          <span className="inline-block w-3 h-1.5 rounded-full bg-danger align-middle mr-1 ml-3" />予算総額のライン
        </p>
        {endKnown && (
          <p>
            実績の線が点線(理想ペース)より上にあると、予定より早いペースで予算を使っていることになります。
          </p>
        )}
        {projectedEnd && (
          <p className={overBudget ? "text-danger" : ""}>
            このままのペースが続くと、{formatDate(projectedEnd)}頃に予算消化率100%に達する見込みです。
          </p>
        )}
        {overBudget && <p className="text-danger">すでに予算を超過しています。</p>}
      </div>
    </div>
  );
}
