"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Single-series column chart, built in plain HTML/CSS — no chart library.
 *
 * Colour: marks use `primary-600` (#0052cc), not the brand primary-700
 * (#00419c). primary-700 sits at OKLCH L 0.402, below the 0.43–0.77 mark band;
 * primary-600 is the first step of the same ramp that clears the band, the
 * chroma floor and 3:1 contrast on white. Buttons keep primary-700 — that is
 * UI chrome, not a data mark.
 *
 * One series, so there is no legend: the card title says what is plotted.
 */
export function DailyViewsChart({
  data,
  dimmed,
}: {
  data: { day: string; count: number }[];
  /** True while refetching — the frame is held rather than replaced. */
  dimmed?: boolean;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);

  const max = Math.max(...data.map((d) => d.count), 1);
  const ceiling = niceCeiling(max);
  const peakIndex = data.reduce(
    (best, d, i) => (d.count > data[best].count ? i : best),
    0,
  );

  if (showTable) {
    return (
      <div className="space-y-3">
        <TableToggle showTable onToggle={() => setShowTable(false)} />
        <div className="max-h-72 overflow-y-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="sticky top-0 border-b border-border bg-slate-50 text-left text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Tanggal</th>
                <th className="px-4 py-2 text-right font-medium">Kunjungan</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.day} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-1.5 font-mono text-xs">{d.day}</td>
                  <td className="px-4 py-1.5 text-right tabular-nums">
                    {d.count.toLocaleString("id-ID")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <TableToggle showTable={false} onToggle={() => setShowTable(true)} />

      <div
        className={cn(
          "flex gap-3 transition-opacity",
          dimmed && "opacity-60",
        )}
      >
        {/* Y ticks carry the values that are not directly labelled. */}
        <div className="flex h-56 w-12 shrink-0 flex-col justify-between py-0 text-right text-xs tabular-nums text-faint">
          <span>{ceiling.toLocaleString("id-ID")}</span>
          <span>{(ceiling / 2).toLocaleString("id-ID")}</span>
          <span>0</span>
        </div>

        <div className="relative min-w-0 flex-1">
          {/* Recessive hairline gridlines — 1px solid, one step off surface. */}
          <div className="pointer-events-none absolute inset-0 flex h-56 flex-col justify-between">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-px w-full bg-slate-200" />
            ))}
          </div>

          <div className="relative flex h-56 items-end gap-[2px]">
            {data.map((d, i) => {
              const height = (d.count / ceiling) * 100;
              return (
                <div
                  key={d.day}
                  // The column takes an equal share of the width; the 24px cap
                  // lives on the bar inside it, so the leftover becomes air in
                  // every slot instead of dead space at the right edge.
                  // The hit target is the whole column, not the painted bar —
                  // a 3px-tall bar is otherwise impossible to hover.
                  className="group relative flex h-full min-w-0 flex-1 cursor-default items-end justify-center"
                  onPointerEnter={() => setHover(i)}
                  onPointerLeave={() => setHover(null)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                  tabIndex={0}
                  role="img"
                  aria-label={`${d.day}: ${d.count} kunjungan`}
                >
                  <div
                    className={cn(
                      // 4px rounded data-end, square at the baseline. Capped at
                      // 24px so a short range does not produce slab-wide bars.
                      "w-full max-w-[24px] rounded-t-[4px] bg-[#0052cc] transition-colors",
                      "group-hover:bg-[#0066ff] group-focus:bg-[#0066ff]",
                    )}
                    style={{
                      // A non-zero day must stay visible even at 1 view.
                      height: d.count > 0 ? `max(${height}%, 3px)` : "0px",
                    }}
                  />

                  {/* Selective direct label: only the peak. */}
                  {i === peakIndex && d.count > 0 && (
                    <span
                      className="pointer-events-none absolute inset-x-0 -top-5 text-center text-xs font-medium tabular-nums text-slate-700"
                      style={{ bottom: `calc(${height}% + 4px)`, top: "auto" }}
                    >
                      {d.count.toLocaleString("id-ID")}
                    </span>
                  )}

                  {hover === i && (
                    <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-border bg-surface px-2.5 py-1.5 shadow-pop">
                      {/* Value leads, label follows. */}
                      <p className="text-sm font-semibold tabular-nums">
                        {d.count.toLocaleString("id-ID")}
                      </p>
                      <p className="font-mono text-xs text-muted">{d.day}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-2 flex justify-between font-mono text-xs text-faint">
            <span>{data[0]?.day.slice(5)}</span>
            <span>{data[data.length - 1]?.day.slice(5)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function TableToggle({
  showTable,
  onToggle,
}: {
  showTable: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex justify-end">
      <button
        type="button"
        onClick={onToggle}
        className="rounded-md px-2 py-1 text-xs text-muted transition-colors hover:bg-slate-100 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-700/40"
      >
        {showTable ? "Lihat grafik" : "Lihat tabel"}
      </button>
    </div>
  );
}

/** Rounds the axis top to a clean number so ticks read 0 / 500 / 1,000. */
function niceCeiling(max: number) {
  if (max <= 4) return 4;
  const magnitude = 10 ** Math.floor(Math.log10(max));
  return Math.ceil(max / (magnitude / 2)) * (magnitude / 2);
}
