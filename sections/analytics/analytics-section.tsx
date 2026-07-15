"use client";

import { useState } from "react";
import { usePageViews } from "@/lib/api/hooks";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { EmptyState, ErrorBlock, LoadingBlock } from "@/components/ui/feedback";
import { DailyViewsChart } from "@/components/analytics/daily-views-chart";
import { cn } from "@/lib/utils";

const PRESETS = [
  { label: "7 hari", days: 7 },
  { label: "30 hari", days: 30 },
  { label: "90 hari", days: 90 },
];

export function AnalyticsSection({ websiteId }: { websiteId: string }) {
  const [days, setDays] = useState<number | null>(30);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [path, setPath] = useState("");

  const range = days !== null ? presetRange(days) : { from, to };
  const { data, isLoading, isFetching, error } = usePageViews(websiteId, {
    from: range.from || undefined,
    to: range.to || undefined,
    path: path || undefined,
  });

  return (
    <div className="space-y-4">
      {/* Filters: one row, above everything they scope. Date range first. */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label>Rentang</Label>
          <div className="flex gap-1">
            {PRESETS.map((preset) => (
              <button
                key={preset.days}
                type="button"
                onClick={() => setDays(preset.days)}
                className={cn(
                  "h-9 rounded-lg border px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-700/40",
                  days === preset.days
                    ? "border-primary-700 bg-primary-50 font-medium text-primary-700"
                    : "border-border bg-surface text-muted hover:bg-slate-50",
                )}
              >
                {preset.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setDays(null)}
              className={cn(
                "h-9 rounded-lg border px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-700/40",
                days === null
                  ? "border-primary-700 bg-primary-50 font-medium text-primary-700"
                  : "border-border bg-surface text-muted hover:bg-slate-50",
              )}
            >
              Kustom
            </button>
          </div>
        </div>

        {days === null && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="a-from">Dari</Label>
              <Input
                id="a-from"
                type="date"
                className="w-40"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="a-to">Sampai</Label>
              <Input
                id="a-to"
                type="date"
                className="w-40"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
          </>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="a-path">Path</Label>
          <Input
            id="a-path"
            className="w-56 font-mono text-xs"
            placeholder="/tour-packages"
            value={path}
            onChange={(e) => setPath(e.target.value)}
          />
        </div>

        {path && (
          <Button variant="secondary" onClick={() => setPath("")}>
            Hapus filter
          </Button>
        )}
      </div>

      {isLoading && <LoadingBlock />}
      {error && <ErrorBlock error={error} />}

      {data && (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardBody>
                <p className="text-sm text-muted">Total kunjungan</p>
                {/* Proportional figures: tabular-nums looks loose at this size. */}
                <p className="mt-1 text-3xl font-bold">
                  {data.total.toLocaleString("id-ID")}
                </p>
                <p className="mt-1 font-mono text-xs text-faint">
                  {data.range.from} → {data.range.to}
                </p>
              </CardBody>
            </Card>

            <Card className="lg:col-span-2">
              <CardBody>
                <p className="text-sm text-muted">Halaman unik terlacak</p>
                <p className="mt-1 text-3xl font-bold">
                  {data.topPaths.length.toLocaleString("id-ID")}
                </p>
                <p className="mt-1 text-xs text-faint">
                  Analytics menghitung counter harian per path, bukan baris per
                  kunjungan — jadi tidak ada data per-pengunjung, jam sibuk, atau
                  referrer.
                </p>
              </CardBody>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Kunjungan harian</CardTitle>
            </CardHeader>
            <CardBody>
              {data.total === 0 ? (
                <EmptyState
                  title="Belum ada kunjungan tercatat"
                  description="Frontend harus memanggil POST /content/{slug}/analytics/page-view agar terhitung."
                />
              ) : (
                <DailyViewsChart
                  data={data.daily}
                  dimmed={isFetching && !isLoading}
                />
              )}
            </CardBody>
          </Card>

          {data.topPaths.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Path terpopuler</CardTitle>
                <span className="text-xs text-muted">
                  {data.topPaths.length} path
                </span>
              </CardHeader>
              <CardBody>
                <TopPaths
                  paths={data.topPaths}
                  dimmed={isFetching && !isLoading}
                  onPick={setPath}
                />
              </CardBody>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Horizontal bars: paths are long strings, and horizontal is the form that lets
 * them be read. Same single hue as the column chart — nominal categories take
 * one colour; colouring them by value would re-encode what bar length shows.
 */
function TopPaths({
  paths,
  dimmed,
  onPick,
}: {
  paths: { path: string; count: number }[];
  dimmed?: boolean;
  onPick: (path: string) => void;
}) {
  const max = Math.max(...paths.map((p) => p.count), 1);

  return (
    <div className={cn("space-y-1.5 transition-opacity", dimmed && "opacity-60")}>
      {paths.slice(0, 12).map((item) => (
        <button
          key={item.path}
          type="button"
          onClick={() => onPick(item.path)}
          className="group flex w-full items-center gap-3 rounded-md px-1 py-1 text-left transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-700/40"
          title={`Filter ke ${item.path}`}
        >
          <span className="w-64 shrink-0 truncate font-mono text-xs text-slate-700">
            {item.path}
          </span>
          <span className="relative h-4 flex-1 overflow-hidden rounded-sm bg-slate-100">
            <span
              className="absolute inset-y-0 left-0 rounded-r-[4px] bg-[#0052cc] transition-colors group-hover:bg-[#0066ff]"
              style={{ width: `${(item.count / max) * 100}%` }}
            />
          </span>
          {/* Value at the tip — text wears an ink token, never the mark colour. */}
          <span className="w-16 shrink-0 text-right text-sm tabular-nums text-slate-700">
            {item.count.toLocaleString("id-ID")}
          </span>
        </button>
      ))}

      {paths.length > 12 && (
        <p className="pt-1 text-xs text-faint">
          Menampilkan 12 dari {paths.length} path. Pakai filter path untuk
          melihat yang lain.
        </p>
      )}
    </div>
  );
}

/** Inclusive window ending today, matching the backend's default of 30 days. */
function presetRange(days: number) {
  const to = new Date();
  const from = new Date();
  from.setUTCDate(from.getUTCDate() - (days - 1));
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}
