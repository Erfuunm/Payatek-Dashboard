import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, CheckCircle2, Factory, Target } from "lucide-react";

import { useApi } from "@/context/ApiProvider";
import { formatNumber } from "@/lib/departments";
import { PRODUCTION_DEVICES, PRODUCTION_ENDPOINTS } from "@/lib/production";

type ProductionSummary = {
  year: number;
  month: number;
  month_name: string;
  period: number;
  period_name: string;
  label: string;
  total_predicted: number;
  total_produced: number;
  achievement_percent: number;
  remaining_quantity: number;
  devices: Record<string, any>;
};

type Props = { year: string; month: string; period: string };

const axisProps = { stroke: "hsl(var(--muted-foreground))", tickLine: false, axisLine: false };
const chartCursor = { fill: "hsl(var(--muted) / 0.18)" };
const legendStyle = { color: "hsl(var(--foreground))", fontSize: 12 };

export function ProductionCharts({ year, month, period }: Props) {
  const api = useApi();
  const [summary, setSummary] = useState<ProductionSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const params = new URLSearchParams({ year, month, period });

    api.get(`${PRODUCTION_ENDPOINTS.summary}?${params.toString()}`)
      .then((res) => {
        if (!alive) return;
        const list = Array.isArray(res.body) ? res.body : [];
        setSummary(list[0] ?? null);
        setLoading(false);
      })
      .catch(() => alive && setLoading(false));

    return () => { alive = false; };
  }, [api, year, month, period]);

  const deviceData = useMemo(() => {
    return PRODUCTION_DEVICES.map((device) => {
      const item = summary?.devices?.[device.value];
      return {
        name: device.label,
        پیش‌بینی: Number(item?.predicted_quantity || 0),
        تولید: Number(item?.produced_quantity || 0),
        باقی‌مانده: Number(item?.remaining_quantity || 0),
        تحقق: Number(item?.achievement_percent || 0),
      };
    });
  }, [summary]);

  if (loading) {
    return <div className="card-elegant grid place-items-center rounded-2xl py-16 text-muted-foreground animate-pulse">در حال بارگذاری گزارش تولید...</div>;
  }

  if (!summary) {
    return <div className="card-elegant grid place-items-center rounded-2xl py-16 text-center"><p className="text-muted-foreground">برای این دوره هنوز گزارشی ثبت نشده است.</p></div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat icon={<Target className="h-4 w-4 text-violet-400" />} label="پیش‌بینی کل" value={formatNumber(summary.total_predicted)} sub={`${summary.month_name} — ${summary.period_name}`} />
        <MiniStat icon={<Factory className="h-4 w-4 text-primary" />} label="تولید واقعی" value={formatNumber(summary.total_produced)} sub={`${summary.achievement_percent}٪ تحقق`} />
        <MiniStat icon={<Activity className="h-4 w-4 text-amber-400" />} label="باقی‌مانده" value={formatNumber(summary.remaining_quantity)} sub="نسبت به پیش‌بینی" />
        <MiniStat icon={<CheckCircle2 className="h-4 w-4 text-cyan-400" />} label="درصد تحقق" value={`${summary.achievement_percent}٪`} sub="تولید / پیش‌بینی" />
      </div>

      <ChartCard title="پیش‌بینی و تولید واقعی به تفکیک دستگاه">
        <ResponsiveContainer width="100%" height={340}>
          <BarChart data={deviceData} margin={{ top: 10, right: 6, left: 0, bottom: 0 }} barGap={6}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.55)" vertical={false} />
            <XAxis dataKey="name" fontSize={11} interval={0} {...axisProps} />
            <YAxis fontSize={11} allowDecimals={false} width={42} {...axisProps} />
            <Tooltip content={<ChartTooltip />} cursor={chartCursor} />
            <Legend wrapperStyle={legendStyle} />
            <Bar dataKey="پیش‌بینی" fill="hsl(262 83% 70%)" opacity={0.58} radius={[7, 7, 0, 0]} maxBarSize={36} />
            <Bar dataKey="تولید" fill="hsl(var(--primary))" radius={[7, 7, 0, 0]} maxBarSize={36} />
            <Bar dataKey="باقی‌مانده" fill="hsl(38 92% 55%)" opacity={0.65} radius={[7, 7, 0, 0]} maxBarSize={36} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function MiniStat({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between"><span className="text-xs text-muted-foreground">{label}</span><div className="grid h-8 w-8 place-items-center rounded-xl bg-muted/40">{icon}</div></div>
      <div className="num-fa text-2xl font-extrabold text-foreground">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card-elegant rounded-2xl border border-border/70 bg-card/80 p-5">
      <h3 className="mb-5 flex items-center gap-2 text-sm font-bold text-foreground"><span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_16px_hsl(var(--primary))]" />{title}</h3>
      {children}
    </div>
  );
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border/80 bg-background/95 p-3 text-xs shadow-xl backdrop-blur">
      <div className="mb-2 font-bold text-foreground">{label}</div>
      <div className="space-y-1.5">
        {payload.map((item: any) => (
          <div key={item.dataKey} className="flex min-w-[150px] items-center justify-between gap-4 text-muted-foreground">
            <span>{item.name}</span>
            <span className="num-fa font-bold text-foreground">{formatNumber(Number(item.value || 0))}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
