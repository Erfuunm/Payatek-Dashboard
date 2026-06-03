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
import { Eye, EyeOff, Percent, ShoppingCart, Target, Users } from "lucide-react";

import { useApi } from "@/context/ApiProvider";
import { formatNumber, formatToman } from "@/lib/departments";
import { SALES_ENDPOINTS, SALES_DEVICES } from "@/lib/sales";

type SalesPeriodSummary = {
  month: number;
  month_name: string;
  period: number;
  period_name: string;
  label: string;
  total_sales_count: number;
  total_sales_amount: number | string;
  total_leads: number;
  target_sales_count: number;
  target_lead_count: number;
  target_amount: number | string;
  sales_achievement_percent: number;
  lead_achievement_percent: number;
  amount_achievement_percent: number;
  conversion_percent: number;
  devices: Record<string, any>;
};

type LineKey = "total_sales_count" | "target_sales_count" | "total_leads" | "target_lead_count";

const LINE_CONFIG: Record<LineKey, { label: string; color: string; dash?: string }> = {
  total_sales_count: { label: "فروش واقعی", color: "hsl(var(--primary))" },
  target_sales_count: { label: "هدف فروش", color: "hsl(262 83% 70%)", dash: "6 4" },
  total_leads: { label: "لید واقعی", color: "hsl(199 89% 60%)" },
  target_lead_count: { label: "هدف لید", color: "hsl(38 92% 55%)", dash: "6 4" },
};

const axisProps = {
  stroke: "hsl(var(--muted-foreground))",
  tickLine: false,
  axisLine: false,
};

const chartCursor = { stroke: "hsl(var(--primary) / 0.55)", strokeWidth: 1 };
const barCursor = { fill: "hsl(var(--muted) / 0.18)" };
const legendStyle = { color: "hsl(var(--foreground))", fontSize: 12 };

export function SalesAdminOverviewChart({ year = "1405" }: { year?: string }) {
  const api = useApi();
  const [half, setHalf] = useState<"1" | "2">("1");
  const [data, setData] = useState<SalesPeriodSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState<Record<LineKey, boolean>>({
    total_sales_count: true,
    target_sales_count: true,
    total_leads: true,
    target_lead_count: false,
  });

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const params = new URLSearchParams({ year, half });

    api
      .get(`${SALES_ENDPOINTS.summary}?${params.toString()}`)
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
    const totalSales = data.reduce((s, d) => s + Number(d.total_sales_count || 0), 0);
    const totalLeads = data.reduce((s, d) => s + Number(d.total_leads || 0), 0);
    const targetSales = data.reduce((s, d) => s + Number(d.target_sales_count || 0), 0);
    const targetLeads = data.reduce((s, d) => s + Number(d.target_lead_count || 0), 0);
    const totalAmount = data.reduce((s, d) => s + Number(d.total_sales_amount || 0), 0);
    const targetAmount = data.reduce((s, d) => s + Number(d.target_amount || 0), 0);

    return {
      totalSales,
      totalLeads,
      targetSales,
      targetLeads,
      totalAmount,
      targetAmount,
      salesAchieve: targetSales ? Math.round((totalSales / targetSales) * 100) : 0,
      leadAchieve: targetLeads ? Math.round((totalLeads / targetLeads) * 100) : 0,
      amountAchieve: targetAmount ? Math.round((totalAmount / targetAmount) * 100) : 0,
      conversion: totalLeads ? Math.round((totalSales / totalLeads) * 100) : 0,
    };
  }, [data]);

  const deviceBreakdown = useMemo(() => {
    return SALES_DEVICES.map((device) => {
      const sales = data.reduce((s, d) => s + Number(d.devices?.[device.value]?.sales_count || 0), 0);
      const target = data.reduce((s, d) => s + Number(d.devices?.[device.value]?.target_sales_count || 0), 0);
      const leads = data.reduce((s, d) => s + Number(d.devices?.[device.value]?.lead_count || 0), 0);

      return {
        name: device.label,
        فروش: sales,
        هدف: target,
        لید: leads,
        سهم_فروش: totals.totalSales ? Math.round((sales / totals.totalSales) * 100) : 0,
        سهم_لید: totals.totalLeads ? Math.round((leads / totals.totalLeads) * 100) : 0,
        تبدیل: leads ? Math.round((sales / leads) * 100) : 0,
      };
    });
  }, [data, totals.totalLeads, totals.totalSales]);

  const toggleLine = (key: LineKey) => {
    setVisible((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return <div className="card-elegant grid place-items-center rounded-2xl py-20 text-muted-foreground animate-pulse">در حال بارگذاری KPI فروش...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="card-elegant space-y-6 rounded-2xl border border-border/70 bg-card/80 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-base font-extrabold text-foreground">
              نمای کلی فروش — {half === "1" ? "نیمه اول سال" : "نیمه دوم سال"} {year}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">فروش، لید، نرخ تبدیل و میزان تحقق هدف در سطح کل واحد فروش</p>
          </div>

          <div className="grid grid-cols-2 gap-2 rounded-xl border border-border/70 bg-muted/25 p-1">
            <button onClick={() => setHalf("1")} className={`rounded-lg px-4 py-2 text-sm font-medium transition ${half === "1" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:bg-background/80 hover:text-foreground"}`}>نیمه اول</button>
            <button onClick={() => setHalf("2")} className={`rounded-lg px-4 py-2 text-sm font-medium transition ${half === "2" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:bg-background/80 hover:text-foreground"}`}>نیمه دوم</button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MiniStat icon={<ShoppingCart className="h-4 w-4 text-primary" />} label="فروش کل" value={formatNumber(totals.totalSales)} sub={`${totals.salesAchieve}٪ تحقق`} />
          <MiniStat icon={<Users className="h-4 w-4 text-cyan-400" />} label="لید کل" value={formatNumber(totals.totalLeads)} sub={`${totals.leadAchieve}٪ تحقق`} />
          <MiniStat icon={<Percent className="h-4 w-4 text-amber-400" />} label="نرخ تبدیل" value={`${totals.conversion}٪`} sub="فروش نسبت به لید" />
          <MiniStat icon={<Target className="h-4 w-4 text-violet-400" />} label="مبلغ فروش" value={formatToman(totals.totalAmount)} sub={`${totals.amountAchieve}٪ تحقق مبلغ`} />
        </div>

        <div className="flex flex-wrap gap-2">
          {(Object.keys(LINE_CONFIG) as LineKey[]).map((key) => {
            const cfg = LINE_CONFIG[key];
            const isVisible = visible[key];

            return (
              <button
                key={key}
                onClick={() => toggleLine(key)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${isVisible ? "border-transparent text-white shadow-sm" : "border-border/80 bg-muted/20 text-muted-foreground hover:bg-muted/40 hover:text-foreground"}`}
                style={isVisible ? { backgroundColor: cfg.color } : undefined}
              >
                {isVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                {cfg.label}
              </button>
            );
          })}
        </div>

        <ResponsiveContainer width="100%" height={360}>
          <LineChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.55)" vertical={false} />
            <XAxis dataKey="label" fontSize={12} {...axisProps} />
            <YAxis fontSize={11} allowDecimals={false} width={56} {...axisProps} />
            <Tooltip content={<ChartTooltip />} cursor={chartCursor} />
            <Legend wrapperStyle={legendStyle} />
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
                  strokeWidth={2.75}
                  strokeDasharray={cfg.dash}
                  dot={{ r: 4, fill: cfg.color, strokeWidth: 0 }}
                  activeDot={{ r: 7, stroke: "hsl(var(--background))", strokeWidth: 2 }}
                  animationDuration={500}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="card-elegant rounded-2xl border border-border/70 bg-card/80 p-5">
          <h3 className="mb-5 flex items-center gap-2 text-sm font-bold text-foreground">
            <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_16px_hsl(var(--primary))]" />
            عملکرد فروش به تفکیک دستگاه
          </h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={deviceBreakdown} margin={{ top: 10, right: 6, left: 0, bottom: 0 }} barGap={6}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.55)" vertical={false} />
              <XAxis dataKey="name" fontSize={11} interval={0} {...axisProps} />
              <YAxis fontSize={11} allowDecimals={false} width={42} {...axisProps} />
              <Tooltip content={<ChartTooltip />} cursor={barCursor} />
              <Legend wrapperStyle={legendStyle} />
              <Bar dataKey="فروش" fill="hsl(var(--primary))" radius={[7, 7, 0, 0]} maxBarSize={36} />
              <Bar dataKey="هدف" fill="hsl(262 83% 70%)" radius={[7, 7, 0, 0]} opacity={0.58} maxBarSize={36} />
              <Bar dataKey="لید" fill="hsl(199 89% 60%)" radius={[7, 7, 0, 0]} opacity={0.68} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card-elegant rounded-2xl border border-border/70 bg-card/80 p-5">
          <h3 className="mb-5 text-sm font-bold text-foreground">خلاصه سهم هر دستگاه</h3>
          <div className="overflow-x-auto rounded-xl border border-border/70">
            <table className="w-full min-w-[760px] text-right text-sm">
              <thead className="bg-muted/35">
                <tr className="text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-medium">دستگاه</th>
                  <th className="px-4 py-3 font-medium">فروش</th>
                  <th className="px-4 py-3 font-medium">سهم فروش</th>
                  <th className="px-4 py-3 font-medium">لید</th>
                  <th className="px-4 py-3 font-medium">سهم لید</th>
                  <th className="px-4 py-3 font-medium">تبدیل</th>
                </tr>
              </thead>
              <tbody>
                {deviceBreakdown.map((device) => (
                  <tr key={device.name} className="border-t border-border/60 transition hover:bg-muted/25">
                    <td className="px-4 py-3 font-semibold text-foreground">{device.name}</td>
                    <td className="num-fa px-4 py-3">{formatNumber(device.فروش)}</td>
                    <td className="px-4 py-3">
                      <ShareCell value={device.سهم_فروش} tone="sales" />
                    </td>
                    <td className="num-fa px-4 py-3">{formatNumber(device.لید)}</td>
                    <td className="px-4 py-3">
                      <ShareCell value={device.سهم_لید} tone="leads" />
                    </td>
                    <td className="num-fa px-4 py-3 font-medium text-primary">{device.تبدیل}٪</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function ShareCell({ value, tone }: { value: number; tone: "sales" | "leads" }) {
  const fill = tone === "sales" ? "bg-primary" : "bg-cyan-400";

  return (
    <div className="min-w-32 space-y-1">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="text-muted-foreground">سهم</span>
        <span className="num-fa font-semibold text-foreground">{value}٪</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted/60">
        <div className={`h-full rounded-full ${fill}`} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
    </div>
  );
}

function MiniStat({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string | number; sub: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 transition hover:-translate-y-0.5 hover:bg-muted/35">
      <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-background/70">{icon}</span>
        {label}
      </div>
      <div className="num-fa text-xl font-extrabold text-foreground">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const item = payload?.[0]?.payload as SalesPeriodSummary | undefined;
  const title = item?.month_name && item?.period_name ? `${item.month_name} — ${item.period_name}` : label;

  return (
    <div dir="rtl" className="min-w-44 rounded-xl border border-border bg-popover/95 px-3 py-2 text-right text-xs text-popover-foreground shadow-xl backdrop-blur">
      <div className="mb-2 border-b border-border/70 pb-1 font-bold text-foreground">{title}</div>
      <div className="space-y-1.5">
        {payload.map((entry: any, index: number) => (
          <div key={`${entry.name}-${index}`} className="flex items-center justify-between gap-6">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
              {entry.name}
            </span>
            <span className="num-fa font-semibold text-foreground">{formatNumber(Number(entry.value || 0))}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
