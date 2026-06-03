import { useMemo } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Flag,
  ListChecks,
} from "lucide-react";

import { formatNumber } from "@/lib/departments";

export type GanttUpdate = {
  id?: number | string;
  update_date?: string;
  progress_percent?: number;
  description?: string | null;
};

export type GanttItem = {
  id: number | string;
  title: string;
  metaLabel?: string;
  start_date: string;
  end_date: string;
  progress_percent?: number;
  status?: string;
  status_label?: string;
  priority?: string;
  priority_label?: string;
  description?: string | null;
  updates?: GanttUpdate[];
};

type Props = {
  title: string;
  subtitle?: string;
  metaTitle: string;
  items: GanttItem[];
  loading?: boolean;
  emptyMessage: string;
};

type Range = {
  start: Date;
  end: Date;
  totalDays: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;

const STATUS_META: Record<string, { label: string; className: string; dot: string }> = {
  planned: {
    label: "برنامه‌ریزی شده",
    className: "border-slate-500/30 bg-slate-500/10 text-slate-300",
    dot: "bg-slate-400",
  },
  doing: {
    label: "در حال انجام",
    className: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
    dot: "bg-cyan-400",
  },
  done: {
    label: "انجام شده",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    dot: "bg-emerald-400",
  },
  blocked: {
    label: "متوقف شده",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    dot: "bg-amber-400",
  },
  cancelled: {
    label: "لغو شده",
    className: "border-rose-500/30 bg-rose-500/10 text-rose-300",
    dot: "bg-rose-400",
  },
};

const PRIORITY_META: Record<string, string> = {
  low: "کم",
  normal: "معمولی",
  high: "زیاد",
  urgent: "فوری",
};

function parseDate(value: string) {
  const [year, month, day] = String(value || "").split("-").map(Number);

  if (!year || !month || !day) {
    const fallback = new Date(value);
    return Number.isNaN(fallback.getTime()) ? new Date() : fallback;
  }

  return new Date(year, month - 1, day);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function diffDays(start: Date, end: Date) {
  const a = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const b = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
  return Math.round((b - a) / DAY_MS);
}

function formatDate(value: string | Date) {
  const date = typeof value === "string" ? parseDate(value) : value;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}/${m}/${d}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getStatus(item: GanttItem) {
  const key = item.status || "planned";
  const meta = STATUS_META[key] || STATUS_META.planned;
  return {
    ...meta,
    label: item.status_label || meta.label,
  };
}

function getLastUpdate(item: GanttItem) {
  const updates = item.updates || [];
  if (!updates.length) return null;

  return [...updates].sort((a, b) => {
    const ad = a.update_date ? parseDate(a.update_date).getTime() : 0;
    const bd = b.update_date ? parseDate(b.update_date).getTime() : 0;
    return bd - ad;
  })[0];
}

function buildTicks(range: Range) {
  const maxTicks = range.totalDays <= 15 ? range.totalDays : 10;
  const step = Math.max(1, Math.ceil(range.totalDays / maxTicks));
  const ticks: { date: Date; offset: number; position: number }[] = [];

  for (let offset = 0; offset < range.totalDays; offset += step) {
    ticks.push({
      date: addDays(range.start, offset),
      offset,
      position: (offset / range.totalDays) * 100,
    });
  }

  const lastOffset = range.totalDays - 1;
  const hasLast = ticks.some((tick) => tick.offset === lastOffset);

  if (!hasLast) {
    ticks.push({
      date: addDays(range.start, lastOffset),
      offset: lastOffset,
      position: (lastOffset / range.totalDays) * 100,
    });
  }

  return ticks;
}

export function GanttTimeline({
  title,
  subtitle,
  metaTitle,
  items,
  loading,
  emptyMessage,
}: Props) {
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const ad = parseDate(a.start_date).getTime();
      const bd = parseDate(b.start_date).getTime();
      return ad - bd;
    });
  }, [items]);

  const range = useMemo<Range | null>(() => {
    if (!sortedItems.length) return null;

    const starts = sortedItems.map((item) => parseDate(item.start_date));
    const ends = sortedItems.map((item) => parseDate(item.end_date));

    const min = new Date(Math.min(...starts.map((date) => date.getTime())));
    const max = new Date(Math.max(...ends.map((date) => date.getTime())));

    const start = addDays(min, -1);
    const end = addDays(max, 1);
    const totalDays = Math.max(1, diffDays(start, end) + 1);

    return { start, end, totalDays };
  }, [sortedItems]);

  const stats = useMemo(() => {
    const total = sortedItems.length;
    const done = sortedItems.filter(
      (item) => item.status === "done" || Number(item.progress_percent || 0) >= 100
    ).length;
    const doing = sortedItems.filter((item) => item.status === "doing").length;
    const blocked = sortedItems.filter((item) => item.status === "blocked").length;
    const avg = total
      ? Math.round(
          sortedItems.reduce((sum, item) => sum + Number(item.progress_percent || 0), 0) / total
        )
      : 0;

    return { total, done, doing, blocked, avg };
  }, [sortedItems]);

  const ticks = useMemo(() => (range ? buildTicks(range) : []), [range]);

  const todayMarker = useMemo(() => {
    if (!range) return null;

    const today = new Date();
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    if (todayOnly < range.start || todayOnly > range.end) return null;

    const offset = diffDays(range.start, todayOnly);
    return (offset / range.totalDays) * 100;
  }, [range]);

  if (loading) {
    return (
      <div className="card-elegant grid place-items-center rounded-2xl py-16 text-muted-foreground animate-pulse">
        در حال بارگذاری گانت...
      </div>
    );
  }

  if (!sortedItems.length || !range) {
    return (
      <div className="card-elegant grid place-items-center rounded-2xl py-16 text-center">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  const trackWidth = Math.max(860, range.totalDays * 42);
  const gridSize = Math.max(34, trackWidth / range.totalDays);

  return (
    <section className="card-elegant overflow-hidden rounded-2xl border border-border/70 bg-card/80">
      <div className="space-y-5 border-b border-border/70 p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-base font-extrabold text-foreground">
              <CalendarDays className="h-5 w-5 text-primary" />
              {title}
            </h3>
            {subtitle ? <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p> : null}
          </div>

          <div className="grid gap-2 sm:grid-cols-4 xl:min-w-[620px]">
            <MiniStat icon={<ListChecks className="h-4 w-4 text-primary" />} label="کل کارها" value={stats.total} />
            <MiniStat icon={<Clock3 className="h-4 w-4 text-cyan-400" />} label="در حال انجام" value={stats.doing} />
            <MiniStat icon={<CheckCircle2 className="h-4 w-4 text-emerald-400" />} label="تکمیل‌شده" value={stats.done} />
            <MiniStat icon={<Flag className="h-4 w-4 text-amber-400" />} label="میانگین پیشرفت" value={`${stats.avg}٪`} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-full border border-border/70 bg-muted/20 px-3 py-1">
            بازه نمایش: <span className="num-fa text-foreground">{formatDate(range.start)}</span> تا{" "}
            <span className="num-fa text-foreground">{formatDate(range.end)}</span>
          </span>
          <span className="rounded-full border border-border/70 bg-muted/20 px-3 py-1">
            تعداد روزها: <span className="num-fa text-foreground">{formatNumber(range.totalDays)}</span>
          </span>
          {stats.blocked ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-300">
              <AlertTriangle className="h-3.5 w-3.5" />
              {formatNumber(stats.blocked)} کار متوقف شده
            </span>
          ) : null}
        </div>
      </div>

      <div className="overflow-x-auto pb-3">
        <div className="min-w-[1120px]" style={{ width: 320 + trackWidth }}>
          <div className="sticky top-0 z-30 grid grid-cols-[320px_1fr] border-b border-border/70 bg-card/95 backdrop-blur">
            <div className="sticky right-0 z-40 border-l border-border/70 bg-card/95 px-4 py-3 text-xs font-bold text-muted-foreground">
              عنوان کار / {metaTitle}
            </div>

            <div className="relative h-14 bg-muted/10" style={{ width: trackWidth }}>
              {ticks.map((tick) => (
                <div
                  key={`${tick.offset}-${tick.date.toISOString()}`}
                  className="absolute top-0 h-full border-r border-border/60 pr-2 text-[11px] text-muted-foreground"
                  style={{ right: `${tick.position}%` }}
                >
                  <span className="absolute top-2 whitespace-nowrap rounded-md bg-card/90 px-1.5 py-0.5 num-fa">
                    {formatDate(tick.date).slice(5)}
                  </span>
                </div>
              ))}

              {todayMarker !== null ? (
                <div
                  className="absolute top-0 z-20 h-full border-r-2 border-primary/80"
                  style={{ right: `${todayMarker}%` }}
                >
                  <span className="absolute -right-8 top-8 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground shadow">
                    امروز
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          <div className="divide-y divide-border/60">
            {sortedItems.map((item) => {
              const start = parseDate(item.start_date);
              const end = parseDate(item.end_date);
              const offset = clamp(diffDays(range.start, start), 0, range.totalDays - 1);
              const span = Math.max(1, diffDays(start, end) + 1);
              const right = (offset / range.totalDays) * 100;
              const width = Math.max(2.5, (span / range.totalDays) * 100);
              const progress = clamp(Number(item.progress_percent || 0), 0, 100);
              const status = getStatus(item);
              const lastUpdate = getLastUpdate(item);

              return (
                <div key={item.id} className="grid grid-cols-[320px_1fr] bg-card/40 transition hover:bg-muted/15">
                  <div className="sticky right-0 z-20 border-l border-border/70 bg-card/95 p-4">
                    <div className="min-w-0 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-bold text-foreground">{item.title}</div>
                          <div className="mt-1 text-xs text-muted-foreground">{item.metaLabel || "-"}</div>
                        </div>

                        <span
                          className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[11px] ${status.className}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                        <span className="rounded-full bg-muted/25 px-2 py-1 num-fa">
                          {formatDate(item.start_date)} تا {formatDate(item.end_date)}
                        </span>
                        <span className="rounded-full bg-muted/25 px-2 py-1">
                          اولویت: {item.priority_label || PRIORITY_META[item.priority || "normal"] || "معمولی"}
                        </span>
                      </div>

                      {lastUpdate ? (
                        <div className="rounded-xl border border-border/60 bg-background/45 px-3 py-2 text-[11px] text-muted-foreground">
                          <div className="mb-1 font-medium text-foreground">
                            آخرین گزارش: <span className="num-fa">{lastUpdate.update_date ? formatDate(lastUpdate.update_date) : "-"}</span>
                            {typeof lastUpdate.progress_percent === "number" ? (
                              <span className="mr-2 text-primary num-fa">{formatNumber(lastUpdate.progress_percent)}٪</span>
                            ) : null}
                          </div>
                          <p className="line-clamp-2 leading-5">{lastUpdate.description || "بدون توضیح"}</p>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div
                    className="relative h-[112px] bg-muted/10"
                    style={{
                      width: trackWidth,
                      backgroundImage:
                        "linear-gradient(to left, hsl(var(--border) / 0.45) 1px, transparent 1px)",
                      backgroundSize: `${gridSize}px 100%`,
                    }}
                  >
                    {todayMarker !== null ? (
                      <div
                        className="absolute inset-y-0 z-10 border-r-2 border-primary/50"
                        style={{ right: `${todayMarker}%` }}
                      />
                    ) : null}

                    <div
                      className="absolute top-8 h-12 overflow-hidden rounded-2xl border border-primary/35 bg-primary/15 shadow-[0_10px_28px_hsl(var(--primary)/0.12)]"
                      style={{ right: `${right}%`, width: `${width}%` }}
                      title={`${item.title} — ${progress}%`}
                    >
                      <div
                        className="absolute inset-y-0 right-0 bg-primary/80"
                        style={{ width: `${progress}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-between gap-2 px-3 text-xs font-bold">
                        <span className="relative z-10 truncate text-primary-foreground drop-shadow-sm">
                          {item.title}
                        </span>
                        <span className="relative z-10 shrink-0 rounded-full bg-background/80 px-2 py-0.5 text-foreground num-fa">
                          {formatNumber(progress)}٪
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function MiniStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/45 px-3 py-3">
      <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="text-lg font-extrabold text-foreground num-fa">
        {typeof value === "number" ? formatNumber(value) : value}
      </div>
    </div>
  );
}
