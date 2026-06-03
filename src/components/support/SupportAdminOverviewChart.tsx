import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CheckCircle2, Eye, EyeOff, Target, TrendingUp, Activity } from "lucide-react";

import { useApi } from "@/context/ApiProvider";
import { TASK_TYPES, type TaskType } from "@/lib/support";

type SupportPeriodSummary = {
  month: number;
  month_name: string;
  period: number;
  period_name: string;
  label: string;
  tasks: Record<TaskType, { label: string; real: number; forecast: number }>;
  total_real: number;
  total_forecast: number;
};

type LineKey = "total_real" | "total_forecast";

const LINE_CONFIG: Record<LineKey, { label: string; color: string; dash?: string }> = {
  total_real: {
    label: "تسک واقعی",
    color: "hsl(var(--chart-1))",
  },
  total_forecast: {
    label: "هدف",
    color: "hsl(var(--chart-2))",
    dash: "6 3",
  },
};

const TASK_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
];

export function SupportAdminOverviewChart({ year = "1405" }: { year?: string }) {
  const api = useApi();

  const [half, setHalf] = useState<"1" | "2">("1");
  const [data, setData] = useState<SupportPeriodSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const [visible, setVisible] = useState<Record<LineKey, boolean>>({
    total_real: true,
    total_forecast: true,
  });

  useEffect(() => {
    let alive = true;
    setLoading(true);

    const params = new URLSearchParams({ year, half });

    api
      .get(`/api/support/admin/summary/?${params.toString()}`)
      .then((res) => {
        if (!alive) return;
        setData(Array.isArray(res.body) ? res.body : []);
        setLoading(false);
      })
      .catch(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [api, year, half]);

  const totals = useMemo(() => {
    const totalReal = data.reduce((sum, item) => sum + Number(item.total_real || 0), 0);
    const totalForecast = data.reduce((sum, item) => sum + Number(item.total_forecast || 0), 0);
    const achievement = totalForecast ? Math.round((totalReal / totalForecast) * 100) : 0;
    const gap = totalReal - totalForecast;

    return { totalReal, totalForecast, achievement, gap };
  }, [data]);

  const taskBreakdown = useMemo(() => {
    return TASK_TYPES.map((task) => {
      const real = data.reduce(
        (sum, item) => sum + Number(item.tasks?.[task.value]?.real || 0),
        0
      );

      const forecast = data.reduce(
        (sum, item) => sum + Number(item.tasks?.[task.value]?.forecast || 0),
        0
      );

      return {
        name: task.label,
        واقعی: real,
        هدف: forecast,
        سهم_از_کل: totals.totalReal ? Math.round((real / totals.totalReal) * 100) : 0,
        تحقق: forecast ? Math.round((real / forecast) * 100) : 0,
      };
    });
  }, [data, totals.totalReal]);

  const toggleLine = (key: LineKey) => {
    setVisible((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return (
      <div className="card-elegant grid place-items-center py-20 text-muted-foreground animate-pulse">
        در حال بارگذاری KPI پشتیبانی...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card-elegant space-y-5 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-bold text-muted-foreground">
              KPI واحد پشتیبانی — {half === "1" ? "نیمه اول سال" : "نیمه دوم سال"} {year}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              مقایسه تعداد تسک‌های انجام‌شده با هدف تعیین‌شده
            </p>
          </div>

          <div className="flex gap-2 rounded-xl border border-border bg-muted/30 p-1">
            <button
              onClick={() => setHalf("1")}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
                half === "1"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-background/70 hover:text-foreground"
              }`}
            >
              نیمه اول
            </button>

            <button
              onClick={() => setHalf("2")}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
                half === "2"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-background/70 hover:text-foreground"
              }`}
            >
              نیمه دوم
            </button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MiniStat
            icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
            label="تسک‌های انجام‌شده"
            value={formatNumber(totals.totalReal)}
            sub="مجموع واقعی"
          />

          <MiniStat
            icon={<Target className="h-4 w-4 text-primary" />}
            label="هدف کل"
            value={formatNumber(totals.totalForecast)}
            sub="مجموع هدف‌ها"
          />

          <MiniStat
            icon={<TrendingUp className="h-4 w-4 text-amber-500" />}
            label="درصد تحقق"
            value={`${totals.achievement}٪`}
            sub="واقعی نسبت به هدف"
          />

          <MiniStat
            icon={<Activity className="h-4 w-4 text-violet-500" />}
            label="اختلاف با هدف"
            value={formatNumber(totals.gap)}
            sub={totals.gap >= 0 ? "بالاتر از هدف" : "پایین‌تر از هدف"}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {(Object.keys(LINE_CONFIG) as LineKey[]).map((key) => {
            const cfg = LINE_CONFIG[key];
            const isVisible = visible[key];

            return (
              <button
                key={key}
                onClick={() => toggleLine(key)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  isVisible
                    ? "border-transparent text-white shadow-sm"
                    : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
                }`}
                style={isVisible ? { backgroundColor: cfg.color } : undefined}
              >
                {isVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                {cfg.label}
              </button>
            );
          })}
        </div>

        <ResponsiveContainer width="100%" height={340}>
          <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.65)" vertical={false} />

            <XAxis
              dataKey="label"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />

            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              width={60}
            />

            <Tooltip
              cursor={{ stroke: "hsl(var(--primary) / 0.25)", strokeWidth: 1 }}
              contentStyle={tooltipStyle()}
              itemStyle={{ color: "hsl(var(--popover-foreground))" }}
              labelStyle={{ color: "hsl(var(--popover-foreground))", fontWeight: 700 }}
              labelFormatter={(label, payload) => {
                const item = payload?.[0]?.payload as SupportPeriodSummary | undefined;
                if (item) return `${item.month_name} — ${item.period_name}`;
                return label;
              }}
            />

            <Legend wrapperStyle={{ color: "hsl(var(--muted-foreground))", fontSize: 12 }} />

            {(Object.keys(LINE_CONFIG) as LineKey[]).map((key) => {
              const cfg = LINE_CONFIG[key];
              if (!visible[key]) return null;

              return (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={cfg.label}
                  stroke={cfg.color}
                  strokeWidth={2.5}
                  strokeDasharray={cfg.dash}
                  dot={{ r: 4, fill: cfg.color, strokeWidth: 0 }}
                  activeDot={{ r: 6, stroke: "hsl(var(--background))", strokeWidth: 2 }}
                  animationDuration={600}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card-elegant p-5">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          تفکیک عملکرد بر اساس نوع تسک
        </h3>

        <ResponsiveContainer width="100%" height={290}>
          <BarChart data={taskBreakdown} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
            <Bar dataKey="واقعی" fill="hsl(var(--chart-1))" radius={[6, 6, 0, 0]} />
            <Bar dataKey="هدف" fill="hsl(var(--chart-2))" radius={[6, 6, 0, 0]} opacity={0.45} />
          </BarChart>
        </ResponsiveContainer>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[620px] text-right text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="py-3 font-medium">نوع تسک</th>
                <th className="py-3 font-medium">واقعی</th>
                <th className="py-3 font-medium">هدف</th>
                <th className="py-3 font-medium">تحقق</th>
                <th className="py-3 font-medium">سهم از کل تسک‌ها</th>
              </tr>
            </thead>
            <tbody>
              {taskBreakdown.map((task) => (
                <tr key={task.name} className="border-b border-border/70 last:border-0 hover:bg-muted/20">
                  <td className="py-3 font-semibold">{task.name}</td>
                  <td className="num-fa py-3">{formatNumber(task.واقعی)}</td>
                  <td className="num-fa py-3">{formatNumber(task.هدف)}</td>
                  <td className="num-fa py-3">{task.تحقق}٪</td>
                  <td className="num-fa py-3">{task.سهم_از_کل}٪</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MiniStat({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/25 p-4 transition hover:bg-muted/35">
      <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="num-fa text-xl font-extrabold text-foreground">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
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
