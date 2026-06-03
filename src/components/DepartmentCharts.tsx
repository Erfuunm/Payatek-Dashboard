import { useEffect, useMemo, useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell,
  ResponsiveContainer, Tooltip, XAxis, YAxis, Legend,
} from "recharts";
import { type DepartmentCode, formatNumber, formatToman } from "@/lib/departments";
import { TrendingDown, TrendingUp, Wallet, PiggyBank, ChevronUp, ChevronDown } from "lucide-react";
import { useApi } from "@/context/ApiProvider";
import { toast } from "sonner";




type Entry = {
  id: number;
  department: string;
  transaction_type: "deposit" | "payment";
  entry_type: "real" | "forecast";
  category: string;
  amount: number | string;
  year: number;
  month: number;
  period: number;
  note: string | null;
};

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-6))"
];



const ganttData = [
  { name: "تهیه بودجه", start: 1, end: 5, owner: "مالی", color: "bg-blue-500" },
  { name: "مذاکره قرارداد", start: 4, end: 10, owner: "حقوقی", color: "bg-emerald-500" },
  { name: "خرید تجهیزات", start: 9, end: 15, owner: "تدارکات", color: "bg-amber-500" },
  { name: "تحویل پروژه", start: 14, end: 20, owner: "عملیات", color: "bg-rose-500" },
];



function StatCard({ icon: Icon, label, value, tone }: any) {

  const toneMap = {
    primary: "from-primary/15 to-primary/5 text-primary",
    success: "from-success/15 to-success/5 text-success",
    destructive: "from-destructive/15 to-destructive/5 text-destructive",
    accent: "from-accent/15 to-accent/5 text-accent",
  };

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

interface DepartmentChartsProps {
  department: DepartmentCode;
  isAdmin?: boolean;  // <-- اضافه شد
}

export function DepartmentCharts({ department, isAdmin }: DepartmentChartsProps) {

  const api = useApi();

  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  const [year, setYear] = useState("1405");
  const [month, setMonth] = useState("1");
  const [period, setPeriod] = useState("1");

  const [openingBalance, setOpeningBalance] = useState(0);

  const [showDetailCharts, setShowDetailCharts] = useState(false);

  useEffect(() => {

    let alive = true;
    setLoading(true);

        const params = new URLSearchParams({
      department,
      ...(year && { year }),
      ...(month && { month }),
      ...(period && { period }),
      no_paginate: "true", // این خط را اضافه کنید تا صفحه‌بندی غیرفعال شود
    });

    
    api.get(`/api/entries/?${params.toString()}`)
      .then(res => {

        if (!alive) return;

        debugger
        if (res.ok) {
          setEntries(res?.body || []);
        }

        setLoading(false);
      })
      .catch(() => alive && setLoading(false));

    return () => { alive = false };

  }, [department, year, month, period]);



  useEffect(() => {

    if (!year || !month || !period) return;

    const params = new URLSearchParams({
      department,
      year,
      month,
      period
    });

    api.get(`/api/opening-balances/?${params}`)
      .then(res => {

        const data = res.body?.results || [];

        if (data.length > 0) {
          setOpeningBalance(Number(data[0].opening_balance));
        } else {
          setOpeningBalance(0);
        }

      });

  }, [department, year, month, period]);


const saveOpeningBalance = async () => {
  try {
    const params = new URLSearchParams({
      department,
      year,
      month,
      period
    });

    const r = await api.get(`/api/opening-balances/?${params}`);
    const data = r.body?.results || [];

    if (data.length) {
      await api.patch(`/api/opening-balances/${data[0].id}/`, {
        opening_balance: openingBalance
      });
    } else {
      await api.post("/api/opening-balances/", {
        department,
        year,
        month,
        period,
        opening_balance: openingBalance
      });
    }

    toast.success("مانده ابتدای دوره با موفقیت ذخیره شد");

    const refreshed = await api.get(`/api/opening-balances/?${params}`);
    const list = refreshed.body?.results || [];

    setOpeningBalance(list.length ? Number(list[0].opening_balance) : 0);

  } catch (err) {
    console.error(err);
    toast.error("خطا در ذخیره مانده ابتدای دوره");
  }
};




  const real = useMemo(() =>
    entries.filter(e => e.entry_type === "real"), [entries]);

  const forecast = useMemo(() =>
    entries.filter(e => e.entry_type === "forecast"), [entries]);


  const realDeposits =
    real.filter(e => e.transaction_type === "deposit")
      .reduce((s, e) => s + Number(e.amount), 0);

  const realPayments =
    real.filter(e => e.transaction_type === "payment")
      .reduce((s, e) => s + Number(e.amount), 0);


  const forecastDeposits =
    forecast.filter(e => e.transaction_type === "deposit")
      .reduce((s, e) => s + Number(e.amount), 0);

  const forecastPayments =
    forecast.filter(e => e.transaction_type === "payment")
      .reduce((s, e) => s + Number(e.amount), 0);


  const endingBalance =
    openingBalance + realDeposits - realPayments;


  const depositProgress =
    forecastDeposits ? Math.round((realDeposits / forecastDeposits) * 100) : 0;

  const paymentProgress =
    forecastPayments ? Math.round((realPayments / forecastPayments) * 100) : 0;


  const groupBy = (type: "deposit" | "payment") => {

    const map = new Map<string, number>();

    real.filter(e => e.transaction_type === type)
      .forEach(e => {
        map.set(e.category, (map.get(e.category) ?? 0) + Number(e.amount));
      });

    return Array.from(map, ([name, value]) => ({ name, value }));

  };


  const depositData = groupBy("deposit");
  const paymentData = groupBy("payment");


  const depositCompareData = [
    { name: "پیش‌بینی", value: forecastDeposits },
    { name: "واقعی", value: realDeposits }
  ];

  const paymentCompareData = [
    { name: "پیش‌بینی", value: forecastPayments },
    { name: "واقعی", value: realPayments }
  ];


  if (loading) {
    return <div className="grid place-items-center py-20 text-muted-foreground animate-pulse">در حال بارگذاری تحلیل‌ها...</div>;
  }


  return (

    <div className="space-y-6">

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={TrendingUp} tone="success" label="مجموع دریافت‌ها" value={formatToman(realDeposits)} />
        <StatCard icon={TrendingDown} tone="destructive" label="مجموع پرداخت‌ها" value={formatToman(realPayments)} />
        <StatCard icon={Wallet} tone="primary" label="مانده شروع دوره" value={formatToman(openingBalance)} />
        <StatCard icon={PiggyBank} tone="accent" label="مانده پایان دوره" value={formatToman(endingBalance)} />
      </div>

      <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-4">

  <div className="flex items-center gap-3">
    
    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-5 h-5 text-primary"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-3.314 0-6 1.343-6 3s2.686 3 6 3 6-1.343 6-3-2.686-3-6-3z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12v4c0 1.657 2.686 3 6 3s6-1.343 6-3v-4" />
      </svg>
    </div>

    <div>
      <div className="text-sm text-muted-foreground">
        مانده ابتدای دوره
      </div>
      <div className="text-xs text-muted-foreground">
        موجودی شروع بازه انتخاب شده
      </div>
    </div>

  </div>

  <div className="flex items-center gap-2">

    <input
      type="number"
      value={openingBalance}
      onChange={(e) => setOpeningBalance(Number(e.target.value))}
      className="
        w-40
        rounded-lg
        border border-border
        bg-background
        text-foreground
        px-3 py-2
        text-sm
        focus:outline-none
        focus:ring-2
        focus:ring-primary/40
      "
      placeholder="0"
    />

    <button
      onClick={saveOpeningBalance}
      className="
        px-4 py-2
        rounded-lg
        bg-primary
        text-primary-foreground
        text-sm
        font-medium
        hover:opacity-90
        transition
      "
    >
      ذخیره
    </button>

  </div>

</div>


      <div className="flex gap-3 mb-4 items-end flex-wrap">

        <div className="flex flex-col">
          <label className="text-xs text-muted-foreground mb-1">سال</label>
          <input type="number" value={year} onChange={e => setYear(e.target.value)}
            className="border rounded-md px-3 py-2 bg-background text-foreground" />
        </div>

        <div className="flex flex-col">
          <label className="text-xs text-muted-foreground mb-1">ماه</label>
          <input type="number" min="1" max="12"
            value={month} onChange={e => setMonth(e.target.value)}
            className="border rounded-md px-3 py-2 bg-background text-foreground" />
        </div>

<div className="flex flex-col w-[180px]">
  <label className="text-xs text-muted-foreground mb-1">بازه</label>

  <select
    value={period}
    onChange={(e) => setPeriod(e.target.value)}
    className="
      h-10
      w-full
      rounded-md
      border border-input
      bg-background
      px-3
      text-sm
      text-foreground
      shadow-sm
      outline-none
      transition
      focus:ring-2
      focus:ring-primary/40
      focus:border-primary
     
      cursor-pointer
    "
  >
    
    <option value="1">۱ تا ۱۰</option>
    <option value="2">۱۱ تا ۲۰</option>
    <option value="3">۲۱ تا پایان ماه</option>
  </select>
</div>



      </div>







      {entries.length !== 0 ?

<>
 {/* اگه ادمین بود، نمودارهای جزئی رو داخل collapse بذار */}
          {isAdmin && (
            <button
              onClick={() => setShowDetailCharts(v => !v)}
              className="flex w-full items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm font-medium hover:bg-muted/50 transition"
            >
              <span>نمودارهای تفصیلی واحد</span>
              {showDetailCharts
                ? <ChevronUp className="h-4 w-4" />
                : <ChevronDown className="h-4 w-4" />
              }
            </button>
          )}

          {/* نمودارهای قبلی - برای ادمین فقط وقتی باز باشه نشون بده */}
          {(!isAdmin || showDetailCharts) && (
       
                    <div className="grid gap-6 lg:grid-cols-2">

<ChartCard title="توزیع دسته‌بندی دریافت‌ها">
  <ResponsiveContainer width="100%" height={280}>
    <BarChart
      data={depositData}
      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
    >
      <CartesianGrid
        strokeDasharray="3 3"
        stroke="hsl(var(--border))"
        vertical={false}
      />

      <XAxis
        dataKey="name"
        stroke="hsl(var(--muted-foreground))"
        fontSize={11}
        tickLine={false}
        axisLine={false}
      />

      <YAxis
        stroke="hsl(var(--muted-foreground))"
        fontSize={11}
        tickLine={false}
        axisLine={false}
        tickFormatter={(v) => formatNumber(v)}
      />

      <Tooltip
        cursor={{ fill: "hsl(var(--muted)/0.35)" }}
        contentStyle={tooltipStyle()}
        formatter={(v: number) => formatToman(v)}
      />

      <Bar
        dataKey="value"
        radius={[8, 8, 0, 0]}
        barSize={36}
      >
        {depositData.map((_, i) => (
          <Cell
            key={i}
            fill={CHART_COLORS[i % CHART_COLORS.length]}
          />
        ))}
      </Bar>
    </BarChart>
  </ResponsiveContainer>
</ChartCard>



<ChartCard title="توزیع دسته‌بندی پرداخت‌ها">
  <ResponsiveContainer width="100%" height={280}>
    <BarChart
      data={paymentData}
      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
    >
      <CartesianGrid
        strokeDasharray="3 3"
        stroke="hsl(var(--border))"
        vertical={false}
      />

      <XAxis
        dataKey="name"
        stroke="hsl(var(--muted-foreground))"
        fontSize={11}
        tickLine={false}
        axisLine={false}
      />

      <YAxis
        stroke="hsl(var(--muted-foreground))"
        fontSize={11}
        tickLine={false}
        axisLine={false}
        tickFormatter={(v) => formatNumber(v)}
      />

      <Tooltip
        cursor={{ fill: "hsl(var(--muted)/0.35)" }}
        contentStyle={tooltipStyle()}
        formatter={(v: number) => formatToman(v)}
      />

      <Bar
        dataKey="value"
        radius={[8, 8, 0, 0]}
        barSize={36}
        animationDuration={700}
      >
        {paymentData.map((_, i) => (
          <Cell
            key={i}
            fill={CHART_COLORS[(i + 2) % CHART_COLORS.length]}
          />
        ))}
      </Bar>
    </BarChart>
  </ResponsiveContainer>
</ChartCard>



<ChartCard title={`مقایسه دریافت واقعی و پیش‌بینی (${depositProgress}٪ تحقق)`}>
  <ResponsiveContainer width="100%" height={280}>
    <BarChart
      data={depositCompareData}
      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
    >
      <CartesianGrid
        strokeDasharray="3 3"
        stroke="hsl(var(--border))"
        vertical={false}
      />

      <XAxis
        dataKey="name"
        stroke="hsl(var(--muted-foreground))"
        fontSize={11}
        tickLine={false}
        axisLine={false}
      />

      <YAxis
        stroke="hsl(var(--muted-foreground))"
        fontSize={11}
        tickLine={false}
        axisLine={false}
        tickFormatter={(v) => formatNumber(v)}
      />

      <Tooltip
        cursor={{ fill: "hsl(var(--muted)/0.35)" }}
        contentStyle={tooltipStyle()}
        formatter={(v: number) => formatToman(v)}
      />

      <Legend />

      <Bar
        dataKey="value"
        fill="hsl(var(--primary))"
        radius={[8, 8, 0, 0]}
        barSize={80}
        animationDuration={700}
      />
    </BarChart>
  </ResponsiveContainer>
</ChartCard>



<ChartCard title={`مقایسه پرداخت واقعی و پیش‌بینی (${paymentProgress}٪ تحقق)`}>
  <ResponsiveContainer width="100%" height={280}>
    <BarChart
      data={paymentCompareData}
      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
    >
      <CartesianGrid
        strokeDasharray="3 3"
        stroke="hsl(var(--border))"
        vertical={false}
      />

      <XAxis
        dataKey="name"
        stroke="hsl(var(--muted-foreground))"
        fontSize={11}
        tickLine={false}
        axisLine={false}
      />

      <YAxis
        stroke="hsl(var(--muted-foreground))"
        fontSize={11}
        tickLine={false}
        axisLine={false}
        tickFormatter={(v) => formatNumber(v)}
      />

      <Tooltip
        cursor={{ fill: "hsl(var(--muted)/0.35)" }}
        contentStyle={tooltipStyle()}
        formatter={(v: number) => formatToman(v)}
      />

      <Legend />

      <Bar
        dataKey="value"
        fill="hsl(var(--destructive))"
        radius={[8, 8, 0, 0]}
        barSize={80}
        animationDuration={700}
      />
    </BarChart>
  </ResponsiveContainer>
</ChartCard>







        </div>
   
          )}


        <ChartCard title="گانت چارت برنامه واحد (نمونه تستی)">
  <div className="w-full overflow-x-auto">
    <div className="min-w-[900px] w-full">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>تسک‌ها</span>
        <div className="flex-1 px-6">
          <div className="flex justify-between">
            <span>روز 1</span>
            <span>روز 10</span>
            <span>روز 20</span>
            <span>روز 30</span>
          </div>
        </div>
      </div>

      {/* Timeline grid */}
      <div className="relative rounded-xl border border-border bg-muted/20 p-4">
        {/* vertical day lines */}
        <div className="pointer-events-none absolute inset-0 grid grid-cols-[180px_1fr]">
          <div />
          <div className="relative">
            <div className="absolute inset-0 grid grid-cols-30">
              {Array.from({ length: 30 }).map((_, i) => (
                <div
                  key={i}
                  className={`border-l ${i % 5 === 0 ? "border-border/80" : "border-border/30"}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Rows */}
        <div className="relative space-y-3">
          {ganttData.map((task) => {
            const left = ((task.start - 1) / 30) * 100;
            const width = ((task.end - task.start + 1) / 30) * 100;

            return (
              <div key={task.name} className="grid grid-cols-[180px_1fr] items-center gap-4">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-foreground">
                    {task.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {task.owner} · روز {task.start} تا {task.end}
                  </div>
                </div>

                <div className="relative h-10 rounded-lg bg-background/50">
                  {/* empty track */}
                  <div className="absolute inset-y-2 left-0 right-0 rounded-md bg-muted/50" />

                  {/* task bar */}
                  <div
                    className={`absolute top-2 h-6 rounded-md ${task.color} shadow-sm`}
                    style={{
                      left: `calc(${left}% + 2px)`,
                      width: `calc(${width}% - 4px)`,
                    }}
                  />

                  {/* labels */}
                  <div
                    className="absolute top-0 flex h-10 items-center"
                    style={{
                      left: `calc(${left}% + 8px)`,
                      width: `calc(${width}% - 16px)`,
                    }}
                  >
                    <span className="truncate text-xs font-medium text-white drop-shadow">
                      {task.name}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* footer */}
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span>شروع: روز 1</span>
        <span>پایان: روز 30</span>
        <span>واحد: روز</span>
      </div>
    </div>
  </div>
</ChartCard>
</>


        :

        <div className="card-elegant grid place-items-center px-6 py-16 text-center">
          <PiggyBank className="mb-3 h-12 w-12 text-muted-foreground/50" />
          <p className="text-muted-foreground">
            هنوز هیچ تراکنشی برای واحد {department} ثبت نشده است.
          </p>
        </div>

      }

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
    textAlign: "right" as const,
    direction: "rtl" as const,
    boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
  };
}


function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card-elegant p-5 animate-in fade-in slide-in-from-bottom-3 duration-500">
      <h3 className="mb-6 text-sm font-bold text-muted-foreground flex items-center gap-2">
        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
        {title}
      </h3>
      {children}
    </div>
  );
}
