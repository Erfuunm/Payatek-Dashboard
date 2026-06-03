import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CheckSquare, Phone, Target, TrendingUp, Truck, Wrench } from "lucide-react";

import { useApi } from "@/context/ApiProvider";
import { TASK_TYPES, type TaskType } from "@/lib/support";

type PeriodSummary = {
  month: number;
  month_name: string;
  period: number;
  period_name: string;
  label: string;
  tasks: Record<string, { label: string; real: number; forecast: number }>;
  total_real?: number;
  total_forecast?: number;
};

interface Props {
  year: string;
  month: string;
  period: string;
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
];

const ICONS: Record<TaskType, React.ReactNode> = {
  technical: <Phone className="h-4 w-4" />,
  qc: <CheckSquare className="h-4 w-4" />,
  shipment: <Truck className="h-4 w-4" />,
  internal: <Wrench className="h-4 w-4" />,
};

export function SupportCharts({ year, month, period }: Props) {
  const api = useApi();

  const [summary, setSummary] = useState<PeriodSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);

    const half = Number(month) <= 6 ? "1" : "2";
    const params = new URLSearchParams({ year, half });

    api
      .get(`/api/support/admin/summary/?${params.toString()}`)
      .then((res) => {
        if (!alive) return;

        const all: PeriodSummary[] = Array.isArray(res.body) ? res.body : [];
        const current =
          all.find((d) => String(d.month) === month && String(d.period) === period) ?? null;

        setSummary(current);
        setLoading(false);
      })
      .catch(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [api, year, month, period]);

  const chartData = useMemo(() => {
    return TASK_TYPES.map((task, i) => {
      const real = Number(summary?.tasks?.[task.value]?.real ?? 0);
      const forecast = Number(summary?.tasks?.[task.value]?.forecast ?? 0);

      return {
        name: task.label,
        واقعی: real,
        هدف: forecast,
        تحقق: forecast ? Math.round((real / forecast) * 100) : 0,
        color: COLORS[i % COLORS.length],
      };
    });
  }, [summary]);

  const totals = useMemo(() => {
    const totalReal = chartData.reduce((sum, item) => sum + item.واقعی, 0);
    const totalForecast = chartData.reduce((sum, item) => sum + item.هدف, 0);

    return {
      totalReal,
      totalForecast,
      achievement: totalForecast ? Math.round((totalReal / totalForecast) * 100) : 0,
    };
  }, [chartData]);

  if (loading) {
    return (
      <div className="card-elegant grid place-items-center py-16 text-muted-foreground animate-pulse">
        در حال بارگذاری گزارش پشتیبانی...
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="card-elegant grid place-items-center py-16 text-center">
        <p className="text-muted-foreground">برای این دوره هنوز گزارشی ثبت نشده است.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TASK_TYPES.map((task, i) => {
          const real = Number(summary.tasks?.[task.value]?.real ?? 0);
          const forecast = Number(summary.tasks?.[task.value]?.forecast ?? 0);
          const pct = forecast ? Math.round((real / forecast) * 100) : 0;

          return (
            <div key={task.value} className="card-elegant space-y-3 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{task.label}</span>
                <div
                  className="grid h-8 w-8 place-items-center rounded-lg border border-border"
                  style={{ backgroundColor: `${COLORS[i]}22`, color: COLORS[i] }}
                >
                  {ICONS[task.value]}
                </div>
              </div>

              <div className="num-fa text-2xl font-extrabold text-foreground">
                {formatNumber(real)}
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>هدف: {formatNumber(forecast)}</span>
                <span>{forecast ? `${pct}٪ تحقق` : "بدون هدف"}</span>
              </div>

              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: COLORS[i] }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <MiniStat
          icon={<CheckSquare className="h-4 w-4 text-emerald-500" />}
          label="کل تسک‌ها"
          value={formatNumber(totals.totalReal)}
        />
        <MiniStat
          icon={<Target className="h-4 w-4 text-primary" />}
          label="هدف دوره"
          value={formatNumber(totals.totalForecast)}
        />
        <MiniStat
          icon={<TrendingUp className="h-4 w-4 text-amber-500" />}
          label="تحقق کل"
          value={`${totals.achievement}٪`}
        />
      </div>

      <ChartCard title={`مقایسه واقعی و هدف — ${summary.month_name} ${summary.period_name}`}>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.65)" vertical={false} />
            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip
              cursor={{ fill: "hsl(var(--muted) / 0.18)" }}
              contentStyle={tooltipStyle()}
              itemStyle={{ color: "hsl(var(--popover-foreground))" }}
              labelStyle={{ color: "hsl(var(--popover-foreground))", fontWeight: 700 }}
            />
            <Legend wrapperStyle={{ color: "hsl(var(--muted-foreground))", fontSize: 12 }} />

            <Bar dataKey="واقعی" radius={[6, 6, 0, 0]}>
              {chartData.map((item) => (
                <Cell key={item.name} fill={item.color} />
              ))}
            </Bar>

            <Bar
              dataKey="هدف"
              radius={[6, 6, 0, 0]}
              fill="hsl(var(--chart-2))"
              opacity={0.42}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
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
    <div className="card-elegant p-4">
      <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="num-fa text-xl font-extrabold text-foreground">{value}</div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card-elegant p-5">
      <h3 className="mb-5 flex items-center gap-2 text-sm font-bold text-muted-foreground">
        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
        {title}
      </h3>
      {children}
    </div>
  );
}

function tooltipStyle() {
  return {
    background: "hsl(var(--popover))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "var(--radius)",
    boxShadow: "var(--shadow-elegant)",
    color: "hsl(var(--popover-foreground))",
    fontSize: 12,
    direction: "rtl" as const,
    textAlign: "right" as const,
  };
}

function formatNumber(value: number | string) {
  return Number(value || 0).toLocaleString("fa-IR");
}
