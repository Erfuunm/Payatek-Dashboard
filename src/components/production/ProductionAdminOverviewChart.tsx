import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, CheckCircle2, Factory, Target } from "lucide-react";

import { useApi } from "@/context/ApiProvider";
import { formatNumber } from "@/lib/departments";
import { PRODUCTION_DEVICES, PRODUCTION_ENDPOINTS } from "@/lib/production";

type ProductionPeriodSummary = {
  label: string;
  total_predicted: number;
  total_produced: number;
  achievement_percent: number;
  remaining_quantity: number;
  devices: Record<string, any>;
};

const axisProps = { stroke: "hsl(var(--muted-foreground))", tickLine: false, axisLine: false };
const chartCursor = { stroke: "hsl(var(--primary) / 0.55)", strokeWidth: 1 };
const barCursor = { fill: "hsl(var(--muted) / 0.18)" };
const legendStyle = { color: "hsl(var(--foreground))", fontSize: 12 };

export function ProductionAdminOverviewChart({ year = "1405" }: { year?: string }) {
  const api = useApi();
  const [half, setHalf] = useState<"1" | "2">("1");
  const [data, setData] = useState<ProductionPeriodSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const params = new URLSearchParams({ year, half });

    api.get(`${PRODUCTION_ENDPOINTS.summary}?${params.toString()}`)
      .then((res) => {
        if (!alive) return;
        setData(Array.isArray(res.body) ? res.body : []);
        setLoading(false);
      })
      .catch(() => alive && setLoading(false));

    return () => { alive = false; };
  }, [api, year, half]);

  const totals = useMemo(() => {
    const predicted = data.reduce((s, d) => s + Number(d.total_predicted || 0), 0);
    const produced = data.reduce((s, d) => s + Number(d.total_produced || 0), 0);
    return {
      predicted,
      produced,
      remaining: Math.max(predicted - produced, 0),
      achievement: predicted ? Math.round((produced / predicted) * 100) : 0,
    };
  }, [data]);

  const deviceBreakdown = useMemo(() => {
    return PRODUCTION_DEVICES.map((device) => {
      const predicted = data.reduce((s, d) => s + Number(d.devices?.[device.value]?.predicted_quantity || 0), 0);
      const produced = data.reduce((s, d) => s + Number(d.devices?.[device.value]?.produced_quantity || 0), 0);
      return {
        name: device.label,
        پیش‌بینی: predicted,
        تولید: produced,
        تحقق: predicted ? Math.round((produced / predicted) * 100) : 0,
      };
    });
  }, [data]);

  if (loading) return <div className="card-elegant grid place-items-center rounded-2xl py-20 text-muted-foreground animate-pulse">در حال بارگذاری KPI تولید...</div>;

  return (
    <div className="space-y-6">
      <div className="card-elegant space-y-6 rounded-2xl border border-border/70 bg-card/80 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-base font-extrabold text-foreground">نمای کلی تولید — {half === "1" ? "نیمه اول سال" : "نیمه دوم سال"} {year}</h3>
            <p className="mt-1 text-xs text-muted-foreground">مقایسه پیش‌بینی تولید با تولید واقعی در سطح کل واحد تولید</p>
          </div>
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-border/70 bg-muted/25 p-1">
            <button onClick={() => setHalf("1")} className={`rounded-lg px-4 py-2 text-sm font-medium transition ${half === "1" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:bg-background/80 hover:text-foreground"}`}>نیمه اول</button>
            <button onClick={() => setHalf("2")} className={`rounded-lg px-4 py-2 text-sm font-medium transition ${half === "2" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:bg-background/80 hover:text-foreground"}`}>نیمه دوم</button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MiniStat icon={<Target className="h-4 w-4 text-violet-400" />} label="پیش‌بینی کل" value={formatNumber(totals.predicted)} sub="جمع کل دوره‌ها" />
          <MiniStat icon={<Factory className="h-4 w-4 text-primary" />} label="تولید واقعی" value={formatNumber(totals.produced)} sub={`${totals.achievement}٪ تحقق`} />
          <MiniStat icon={<Activity className="h-4 w-4 text-amber-400" />} label="باقی‌مانده" value={formatNumber(totals.remaining)} sub="نسبت به پیش‌بینی" />
          <MiniStat icon={<CheckCircle2 className="h-4 w-4 text-cyan-400" />} label="تحقق کل" value={`${totals.achievement}٪`} sub="تولید / پیش‌بینی" />
        </div>

        <ResponsiveContainer width="100%" height={340}>
          <LineChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.55)" vertical={false} />
            <XAxis dataKey="label" fontSize={12} {...axisProps} />
            <YAxis fontSize={11} allowDecimals={false} width={56} {...axisProps} />
            <Tooltip content={<ChartTooltip />} cursor={chartCursor} />
            <Legend wrapperStyle={legendStyle} />
            <Line type="monotone" dataKey="total_predicted" name="پیش‌بینی" stroke="hsl(262 83% 70%)" strokeWidth={2.75} strokeDasharray="6 4" dot={{ r: 4, fill: "hsl(262 83% 70%)", strokeWidth: 0 }} />
            <Line type="monotone" dataKey="total_produced" name="تولید واقعی" stroke="hsl(var(--primary))" strokeWidth={2.75} dot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 0 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card-elegant rounded-2xl border border-border/70 bg-card/80 p-5">
        <h3 className="mb-5 flex items-center gap-2 text-sm font-bold text-foreground"><span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_16px_hsl(var(--primary))]" />عملکرد تولید به تفکیک دستگاه</h3>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={deviceBreakdown} margin={{ top: 10, right: 6, left: 0, bottom: 0 }} barGap={6}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.55)" vertical={false} />
            <XAxis dataKey="name" fontSize={11} interval={0} {...axisProps} />
            <YAxis fontSize={11} allowDecimals={false} width={42} {...axisProps} />
            <Tooltip content={<ChartTooltip />} cursor={barCursor} />
            <Legend wrapperStyle={legendStyle} />
            <Bar dataKey="پیش‌بینی" fill="hsl(262 83% 70%)" opacity={0.58} radius={[7, 7, 0, 0]} maxBarSize={36} />
            <Bar dataKey="تولید" fill="hsl(var(--primary))" radius={[7, 7, 0, 0]} maxBarSize={36} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function MiniStat({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return <div className="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm"><div className="mb-3 flex items-center justify-between"><span className="text-xs text-muted-foreground">{label}</span><div className="grid h-8 w-8 place-items-center rounded-xl bg-muted/40">{icon}</div></div><div className="num-fa text-2xl font-extrabold text-foreground">{value}</div><div className="mt-1 text-xs text-muted-foreground">{sub}</div></div>;
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return <div className="rounded-xl border border-border/80 bg-background/95 p-3 text-xs shadow-xl backdrop-blur"><div className="mb-2 font-bold text-foreground">{label}</div><div className="space-y-1.5">{payload.map((item: any) => <div key={item.dataKey} className="flex min-w-[150px] items-center justify-between gap-4 text-muted-foreground"><span>{item.name}</span><span className="num-fa font-bold text-foreground">{formatNumber(Number(item.value || 0))}</span></div>)}</div></div>;
}
