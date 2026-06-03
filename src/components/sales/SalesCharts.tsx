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
import { Activity, Percent, ShoppingCart, Target, Users } from "lucide-react";

import { useApi } from "@/context/ApiProvider";
import { formatNumber, formatToman } from "@/lib/departments";
import { SALES_DEVICES, SALES_SOURCES, CUSTOMER_GROUPS, SALES_ENDPOINTS } from "@/lib/sales";

type SalesSummary = {
  year: number;
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
  sources: Record<string, any>;
  customer_groups: Record<string, any>;
};

interface Props {
  year: string;
  month: string;
  period: string;
}

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(174 72% 45%)",
  "hsl(38 92% 55%)",
  "hsl(262 83% 70%)",
  "hsl(199 89% 60%)",
  "hsl(346 87% 65%)",
];

const axisProps = {
  stroke: "hsl(var(--muted-foreground))",
  tickLine: false,
  axisLine: false,
};

const chartCursor = { fill: "hsl(var(--muted) / 0.18)" };
const legendStyle = { color: "hsl(var(--foreground))", fontSize: 12 };

export function SalesCharts({ year, month, period }: Props) {
  const api = useApi();
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);

    const params = new URLSearchParams({ year, month, period });

    api
      .get(`${SALES_ENDPOINTS.summary}?${params.toString()}`)
      .then((res) => {
        if (!alive) return;
        const list = Array.isArray(res.body) ? res.body : [];
        setSummary(list[0] ?? null);
        setLoading(false);
      })
      .catch(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [api, year, month, period]);

  const deviceData = useMemo(() => {
    return SALES_DEVICES.map((device) => {
      const item = summary?.devices?.[device.value];
      const sales = Number(item?.sales_count || 0);
      const leads = Number(item?.lead_count || 0);
      const totalSales = Number(summary?.total_sales_count || 0);
      const totalLeads = Number(summary?.total_leads || 0);

      return {
        name: device.label,
        فروش: sales,
        هدف: Number(item?.target_sales_count || 0),
        لید: leads,
        سهم_فروش: totalSales ? Math.round((sales / totalSales) * 100) : 0,
        سهم_لید: totalLeads ? Math.round((leads / totalLeads) * 100) : 0,
        تبدیل: Number(item?.conversion_percent || 0),
      };
    });
  }, [summary]);

  const sourceData = useMemo(() => {
    return SALES_SOURCES.map((source) => {
      const item = summary?.sources?.[source.value];
      return {
        name: source.label,
        فروش: Number(item?.sales_count || 0),
        لید: Number(item?.lead_count || 0),
        تبدیل: Number(item?.conversion_percent || 0),
      };
    });
  }, [summary]);

  const groupData = useMemo(() => {
    return CUSTOMER_GROUPS.map((group) => {
      const item = summary?.customer_groups?.[group.value];
      return {
        name: group.label,
        فروش: Number(item?.sales_count || 0),
        مبلغ: Number(item?.sales_amount || 0),
      };
    }).filter((item) => item.فروش > 0 || item.مبلغ > 0);
  }, [summary]);

  if (loading) {
    return (
      <div className="card-elegant grid place-items-center rounded-2xl py-16 text-muted-foreground animate-pulse">
        در حال بارگذاری گزارش فروش...
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="card-elegant grid place-items-center rounded-2xl py-16 text-center">
        <p className="text-muted-foreground">برای این دوره هنوز گزارشی ثبت نشده است.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MiniStat icon={<ShoppingCart className="h-4 w-4 text-primary" />} label="تعداد فروش" value={formatNumber(summary.total_sales_count)} sub={`هدف: ${formatNumber(summary.target_sales_count)} — ${summary.sales_achievement_percent}٪`} />
        <MiniStat icon={<Users className="h-4 w-4 text-cyan-400" />} label="تعداد لید" value={formatNumber(summary.total_leads)} sub={`هدف: ${formatNumber(summary.target_lead_count)} — ${summary.lead_achievement_percent}٪`} />
        <MiniStat icon={<Percent className="h-4 w-4 text-amber-400" />} label="نرخ تبدیل" value={`${summary.conversion_percent}٪`} sub="فروش نسبت به لید" />
        <MiniStat icon={<Target className="h-4 w-4 text-violet-400" />} label="مبلغ فروش" value={formatToman(Number(summary.total_sales_amount || 0))} sub={`${summary.amount_achievement_percent}٪ تحقق مبلغ`} />
        <MiniStat icon={<Activity className="h-4 w-4 text-rose-400" />} label="هدف مبلغ" value={formatToman(Number(summary.target_amount || 0))} sub={`${summary.month_name} — ${summary.period_name}`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <ChartCard title="فروش، هدف و لید به تفکیک دستگاه">
          <ResponsiveContainer width="100%" height={330}>
            <BarChart data={deviceData} margin={{ top: 10, right: 6, left: 0, bottom: 0 }} barGap={6}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.55)" vertical={false} />
              <XAxis dataKey="name" fontSize={11} interval={0} {...axisProps} />
              <YAxis fontSize={11} allowDecimals={false} width={42} {...axisProps} />
              <Tooltip content={<ChartTooltip />} cursor={chartCursor} />
              <Legend wrapperStyle={legendStyle} />
              <Bar dataKey="فروش" fill="hsl(var(--primary))" radius={[7, 7, 0, 0]} maxBarSize={36} />
              <Bar dataKey="هدف" fill="hsl(262 83% 70%)" opacity={0.58} radius={[7, 7, 0, 0]} maxBarSize={36} />
              <Bar dataKey="لید" fill="hsl(199 89% 60%)" opacity={0.68} radius={[7, 7, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="فروش و لید به تفکیک منبع">
          <ResponsiveContainer width="100%" height={330}>
            <BarChart data={sourceData} margin={{ top: 10, right: 6, left: 0, bottom: 0 }} barGap={6}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.55)" vertical={false} />
              <XAxis dataKey="name" fontSize={11} interval={0} {...axisProps} />
              <YAxis fontSize={11} allowDecimals={false} width={36} {...axisProps} />
              <Tooltip content={<ChartTooltip />} cursor={chartCursor} />
              <Legend wrapperStyle={legendStyle} />
              <Bar dataKey="لید" fill="hsl(199 89% 60%)" radius={[7, 7, 0, 0]} opacity={0.68} maxBarSize={34} />
              <Bar dataKey="فروش" fill="hsl(var(--primary))" radius={[7, 7, 0, 0]} maxBarSize={34} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <ChartCard title="فروش به تفکیک گروه مشتری">
          {groupData.length ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={groupData} margin={{ top: 10, right: 6, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.55)" vertical={false} />
                <XAxis dataKey="name" fontSize={10} interval={0} {...axisProps} />
                <YAxis fontSize={11} allowDecimals={false} width={42} {...axisProps} />
                <Tooltip content={<ChartTooltip moneyKeys={["مبلغ"]} />} cursor={chartCursor} />
                <Bar dataKey="فروش" radius={[7, 7, 0, 0]} maxBarSize={42}>
                  {groupData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyBlock text="برای گروه‌های مشتری در این دوره فروش ثبت نشده است." />
          )}
        </ChartCard>

        <ChartCard title="جزئیات سهم و تبدیل به تفکیک دستگاه">
          <SalesDeviceTable data={deviceData} />
        </ChartCard>
      </div>
    </div>
  );
}

function SalesDeviceTable({ data }: { data: any[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border/70">
      <table className="w-full  text-right text-sm">
        <thead className="bg-muted/35">
          <tr className="text-xs text-muted-foreground">
            <th className="px-4 py-3 font-medium">دستگاه</th>
            <th className="px-4 py-3 font-medium">تعداد فروش</th>
            <th className="px-4 py-3 font-medium">سهم فروش</th>
            <th className="px-4 py-3 font-medium">تعداد لید</th>
            <th className="px-4 py-3 font-medium">سهم لید</th>
            <th className="px-4 py-3 font-medium">نرخ تبدیل</th>
          </tr>
        </thead>
        <tbody>
          {data.map((device) => (
            <tr key={device.name} className="border-t border-border/60 transition hover:bg-muted/25">
              <td className="px-4 py-3 font-semibold text-foreground">{device.name}</td>
              <td className="num-fa px-4 py-3">{formatNumber(device.فروش)}</td>
              <td className="num-fa px-4 py-3">{device.سهم_فروش}٪</td>
              <td className="num-fa px-4 py-3">{formatNumber(device.لید)}</td>
              <td className="num-fa px-4 py-3">{device.سهم_لید}٪</td>
              <td className="num-fa px-4 py-3 font-medium text-primary">{device.تبدیل}٪</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MiniStat({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string | number; sub: string }) {
  return (
    <div className="card-elegant rounded-2xl border border-border/70 bg-card/80 p-4 transition hover:-translate-y-0.5 hover:bg-muted/20">
      <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-muted/45">{icon}</span>
        {label}
      </div>
      <div className="num-fa text-xl font-extrabold text-foreground">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card-elegant rounded-2xl border border-border/70 bg-card/80 p-5">
      <h3 className="mb-5 flex items-center gap-2 text-sm font-bold text-foreground">
        <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_16px_hsl(var(--primary))]" />
        {title}
      </h3>
      {children}
    </div>
  );
}

function EmptyBlock({ text }: { text: string }) {
  return <div className="grid h-[320px] place-items-center rounded-xl border border-dashed border-border/80 bg-muted/15 text-sm text-muted-foreground">{text}</div>;
}

function ChartTooltip({ active, payload, label, moneyKeys = [] }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div dir="rtl" className="min-w-40 rounded-xl border border-border bg-popover/95 px-3 py-2 text-right text-xs text-popover-foreground shadow-xl backdrop-blur">
      <div className="mb-2 border-b border-border/70 pb-1 font-bold text-foreground">{label}</div>
      <div className="space-y-1.5">
        {payload.map((entry: any, index: number) => {
          const name = String(entry.name ?? entry.dataKey ?? "");
          const value = moneyKeys.includes(name) ? formatToman(Number(entry.value || 0)) : formatNumber(Number(entry.value || 0));
          return (
            <div key={`${name}-${index}`} className="flex items-center justify-between gap-6">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
                {name}
              </span>
              <span className="num-fa font-semibold text-foreground">{value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
