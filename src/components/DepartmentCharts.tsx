import { useEffect, useMemo, useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis, Legend,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { type DepartmentCode, formatNumber, formatToman } from "@/lib/departments";
import { TrendingDown, TrendingUp, Wallet, PiggyBank } from "lucide-react";

type Entry = {
  id: string; department: DepartmentCode; kind: "deposit" | "payment";
  category: string; amount: number; start_date: string; end_date: string;
  is_forecast: boolean;
};

const CHART_COLORS = ["hsl(var(--chart-1))","hsl(var(--chart-2))","hsl(var(--chart-3))","hsl(var(--chart-4))","hsl(var(--chart-5))","hsl(var(--chart-6))"];

function StatCard({ icon: Icon, label, value, tone }: { icon: any; label: string; value: string; tone: "primary" | "success" | "destructive" | "accent" }) {
  const toneMap = {
    primary: "from-primary/15 to-primary/5 text-primary",
    success: "from-success/15 to-success/5 text-success",
    destructive: "from-destructive/15 to-destructive/5 text-destructive",
    accent: "from-accent/15 to-accent/5 text-accent",
  } as const;
  return (
    <div className="card-elegant relative overflow-hidden p-5">
      <div className={`absolute inset-0 bg-gradient-to-bl ${toneMap[tone]} opacity-60`} />
      <div className="relative">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{label}</span>
          <Icon className="h-5 w-5 opacity-80" />
        </div>
        <div className="mt-3 num-fa text-2xl font-extrabold">{value}</div>
      </div>
    </div>
  );
}

export function DepartmentCharts({ department }: { department: DepartmentCode }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    supabase.from("financial_entries").select("*")
      .eq("department", department).order("start_date", { ascending: true })
      .then(({ data, error }) => {
        if (!alive) return;
        if (!error) setEntries((data ?? []) as Entry[]);
        setLoading(false);
      });
    return () => { alive = false; };
  }, [department]);

  const real = useMemo(() => entries.filter((e) => !e.is_forecast), [entries]);
  const forecast = useMemo(() => entries.filter((e) => e.is_forecast), [entries]);

  const totalDeposits = real.filter((e) => e.kind === "deposit").reduce((s, e) => s + Number(e.amount), 0);
  const totalPayments = real.filter((e) => e.kind === "payment").reduce((s, e) => s + Number(e.amount), 0);

  // مرتب‌سازی بر اساس تاریخ شروع — مانده ابتدا/انتها
  const sortedReal = [...real].sort((a, b) => a.start_date.localeCompare(b.start_date));
  let running = 0;
  const balanceSeries: { date: string; balance: number }[] = [];
  for (const e of sortedReal) {
    running += e.kind === "deposit" ? Number(e.amount) : -Number(e.amount);
    balanceSeries.push({ date: e.start_date, balance: running });
  }
  const beginningBalance = balanceSeries[0]?.balance ?? 0;
  const endingBalance = running;

  // داده‌های نمودار دسته‌ای
  const groupBy = (kind: "deposit" | "payment", forecastFlag = false) => {
    const list = forecastFlag ? forecast : real;
    const map = new Map<string, number>();
    list.filter((e) => e.kind === kind).forEach((e) => {
      map.set(e.category, (map.get(e.category) ?? 0) + Number(e.amount));
    });
    return Array.from(map, ([name, value]) => ({ name, value }));
  };

  const depositData = groupBy("deposit");
  const paymentData = groupBy("payment");
  const forecastDepData = groupBy("deposit", true);
  const forecastPayData = groupBy("payment", true);

  if (loading) {
    return <div className="grid place-items-center py-20 text-muted-foreground">در حال بارگذاری…</div>;
  }

  if (entries.length === 0) {
    return (
      <div className="card-elegant grid place-items-center px-6 py-16 text-center">
        <PiggyBank className="mb-3 h-10 w-10 text-muted-foreground" />
        <p className="text-muted-foreground">هنوز رکوردی برای این واحد ثبت نشده است.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={TrendingUp} tone="success" label="مجموع دریافت‌ها" value={formatToman(totalDeposits)} />
        <StatCard icon={TrendingDown} tone="destructive" label="مجموع پرداخت‌ها" value={formatToman(totalPayments)} />
        <StatCard icon={Wallet} tone="primary" label="مانده ابتدای دوره" value={formatToman(beginningBalance)} />
        <StatCard icon={PiggyBank} tone="accent" label="مانده پایان دوره" value={formatToman(endingBalance)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="نمودار دریافت‌ها (به تفکیک دسته)">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={depositData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => formatNumber(v)} />
              <Tooltip cursor={false} contentStyle={tooltipStyle()} formatter={(v: number) => formatToman(v)} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {depositData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="نمودار پرداخت‌ها (به تفکیک دسته)">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={paymentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => formatNumber(v)} />
              <Tooltip contentStyle={tooltipStyle()} formatter={(v: number) => formatToman(v)} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {paymentData.map((_, i) => <Cell key={i} fill={CHART_COLORS[(i + 2) % CHART_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="روند مانده در طول زمان">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={balanceSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => formatNumber(v)} />
              <Tooltip contentStyle={tooltipStyle()} formatter={(v: number) => formatToman(v)} />
              <Line type="monotone" dataKey="balance" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="ترکیب پیش‌بینی (دریافت / پرداخت)">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={[
                  { name: "پیش‌بینی دریافت‌ها", value: forecastDepData.reduce((s, x) => s + x.value, 0) },
                  { name: "پیش‌بینی پرداخت‌ها", value: forecastPayData.reduce((s, x) => s + x.value, 0) },
                ]}
                dataKey="value" nameKey="name" outerRadius={100} innerRadius={55}
              >
                <Cell fill="hsl(var(--chart-3))" />
                <Cell fill="hsl(var(--chart-6))" />
              </Pie>
              <Tooltip contentStyle={tooltipStyle()} formatter={(v: number) => formatToman(v)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function tooltipStyle() {
  return {
    background: "hsl(var(--popover))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "var(--radius)",
    color: "hsl(var(--popover-foreground))",
    fontSize: 12,
  };
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card-elegant p-5 animate-fade-in">
      <h3 className="mb-4 font-bold">{title}</h3>
      {children}
    </div>
  );
}
