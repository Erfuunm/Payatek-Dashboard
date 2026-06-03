import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { useApi } from "@/context/ApiProvider";
import { formatNumber, formatToman, type DepartmentCode } from "@/lib/departments";
import { TrendingUp, TrendingDown, Eye, EyeOff } from "lucide-react";

type MonthlySummary = {
  month: number;
  month_name: string;
  period: number;
  period_name: string;
  label: string;           // مثلاً "فرو-1"
  real_deposit: number;
  real_payment: number;
  forecast_deposit: number;
  forecast_payment: number;
};

type LineKey = "real_deposit" | "real_payment" | "forecast_deposit" | "forecast_payment";

const LINE_CONFIG: Record<LineKey, { label: string; color: string; dash?: string }> = {
  real_deposit:     { label: "دریافت واقعی",      color: "hsl(var(--chart-1))" },
  real_payment:     { label: "پرداخت واقعی",      color: "hsl(var(--chart-2))" },
  forecast_deposit: { label: "دریافت پیش‌بینی",   color: "hsl(var(--chart-3))", dash: "6 3" },
  forecast_payment: { label: "پرداخت پیش‌بینی",   color: "hsl(var(--chart-4))", dash: "6 3" },
};

interface Props {
  department?: DepartmentCode;
  year?: string;
}

export function AdminOverviewChart({ department, year = "1405" }: Props) {
  const api = useApi();

  const [half, setHalf] = useState<"1" | "2">("1");
  const [data, setData] = useState<MonthlySummary[]>([]);
  const [loading, setLoading] = useState(true);

  const [visible, setVisible] = useState<Record<LineKey, boolean>>({
    real_deposit: true,
    real_payment: true,
    forecast_deposit: true,
    forecast_payment: true,
  });

  useEffect(() => {
    let alive = true;
    setLoading(true);

    const params = new URLSearchParams({ year, half });
    if (department) params.set("department", department);

    api.get(`/api/admin/monthly-summary/?${params}`)
      .then(res => {
        if (!alive) return;
        setData(res.body || []);
        setLoading(false);
      })
      .catch(() => alive && setLoading(false));

    return () => { alive = false };
  }, [year, half, department]);

  const toggleLine = (key: LineKey) => {
    setVisible(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return (
      <div className="card-elegant grid place-items-center py-20 text-muted-foreground animate-pulse">
        در حال بارگذاری نمودار کلی...
      </div>
    );
  }

  return (
    <div className="card-elegant p-5 space-y-5">

      {/* هدر */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
          <h3 className="text-sm font-bold text-muted-foreground">
            نمودار کلی سازمان — {half === "1" ? "نیمه اول سال" : "نیمه دوم سال"} {year}
          </h3>
        </div>

        {/* انتخاب نیمه سال */}
        <div className="flex gap-2">
          <button
            onClick={() => setHalf("1")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
              half === "1"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            نیمه اول (فروردین–شهریور)
          </button>
          <button
            onClick={() => setHalf("2")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
              half === "2"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            نیمه دوم (مهر–اسفند)
          </button>
        </div>
      </div>

      {/* کنترل نمایش خطوط */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(LINE_CONFIG) as LineKey[]).map(key => {
          const cfg = LINE_CONFIG[key];
          const isVisible = visible[key];
          return (
            <button
              key={key}
              onClick={() => toggleLine(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                isVisible
                  ? "border-transparent text-white"
                  : "border-border bg-background text-muted-foreground"
              }`}
              style={isVisible ? { backgroundColor: cfg.color } : {}}
            >
              {isVisible
                ? <Eye className="h-3 w-3" />
                : <EyeOff className="h-3 w-3" />
              }
              {cfg.label}
            </button>
          );
        })}
      </div>

      {/* نمودار */}
      <ResponsiveContainer width="100%" height={360}>
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            // هر 3 تیک = یک ماه — خط جداکننده بین ماه‌ها
            tick={<CustomXTick data={data} />}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={v => formatNumber(v)}
            width={80}
          />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "var(--radius)",
              color: "hsl(var(--popover-foreground))",
              fontSize: 12,
              textAlign: "right",
              direction: "rtl",
              boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
            }}
            labelFormatter={(label, payload) => {
              // نمایش "فروردین — دهه اول" در عنوان tooltip
              const item = payload?.[0]?.payload as MonthlySummary | undefined;
              if (item) return `${item.month_name} — ${item.period_name}`;
              return label;
            }}
            formatter={(value: number, name: string) => {
              const entry = Object.values(LINE_CONFIG).find(c => c.label === name);
              return [formatToman(value), entry?.label ?? name];
            }}
          />

          {(Object.keys(LINE_CONFIG) as LineKey[]).map(key => {
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
                activeDot={{ r: 6 }}
                animationDuration={600}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>

      {/* خلاصه اعداد */}
      <SummaryRow data={data} />
    </div>
  );
}

// تیک سفارشی محور X — فقط اسم ماه رو برای دهه اول نشون میده، بقیه خالی
function CustomXTick({
  x, y, payload, data,
}: {
  x?: number;
  y?: number;
  payload?: { value: string; index: number };
  data: MonthlySummary[];
}) {
  if (!payload) return null;
  const item = data[payload.index];
  if (!item) return null;

  // فقط دهه اول هر ماه label ماه رو نشون میده
  const showMonthName = item.period === 1;
  // دهه دوم و سوم فقط شماره دهه
  const tickLabel = showMonthName ? item.month_name : `د${item.period}`;

  return (
    <g transform={`translate(${x},${y})`}>
      {/* خط جداکننده ماه‌ها */}
      {item.period === 1 && payload.index !== 0 && (
        <line
          x1={0} y1={-5}
          x2={0} y2={-350}
          stroke="hsl(var(--border))"
          strokeDasharray="4 3"
          strokeWidth={1}
        />
      )}
      <text
        x={0}
        y={0}
        dy={16}
        textAnchor="middle"
        fill="hsl(var(--muted-foreground))"
        fontSize={showMonthName ? 12 : 10}
        fontWeight={showMonthName ? 600 : 400}
      >
        {tickLabel}
      </text>
    </g>
  );
}

function SummaryRow({ data }: { data: MonthlySummary[] }) {
  const safeData = Array.isArray(data) ? data : [];

  const totalRealDeposit     = safeData.reduce((s, d) => s + d.real_deposit, 0);
  const totalRealPayment     = safeData.reduce((s, d) => s + d.real_payment, 0);
  const totalForecastDeposit = safeData.reduce((s, d) => s + d.forecast_deposit, 0);
  const totalForecastPayment = safeData.reduce((s, d) => s + d.forecast_payment, 0);

  const depositAchieve = totalForecastDeposit
    ? Math.round((totalRealDeposit / totalForecastDeposit) * 100)
    : 0;
  const paymentAchieve = totalForecastPayment
    ? Math.round((totalRealPayment / totalForecastPayment) * 100)
    : 0;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 pt-2 border-t border-border">
      <MiniStat label="جمع دریافت واقعی"    value={formatToman(totalRealDeposit)}     sub={`${depositAchieve}٪ تحقق`} positive />
      <MiniStat label="جمع پرداخت واقعی"    value={formatToman(totalRealPayment)}     sub={`${paymentAchieve}٪ تحقق`} />
      <MiniStat label="پیش‌بینی دریافت"     value={formatToman(totalForecastDeposit)} sub="هدف‌گذاری" positive />
      <MiniStat label="پیش‌بینی پرداخت"     value={formatToman(totalForecastPayment)} sub="هدف‌گذاری" />
    </div>
  );
}

function MiniStat({ label, value, sub, positive }: {
  label: string; value: string; sub: string; positive?: boolean;
}) {
  return (
    <div className="rounded-lg bg-muted/40 p-3">
      <div className="flex items-center gap-1 mb-1">
        {positive
          ? <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
          : <TrendingDown className="h-3.5 w-3.5 text-rose-500" />
        }
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="num-fa text-sm font-bold">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
    </div>
  );
}
