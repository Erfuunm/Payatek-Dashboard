import { useMemo, useState } from "react";
import { Building2, CalendarDays, Plus, ShoppingCart, Target, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { SalesCharts } from "./SalesCharts";
import { SalesEntryPanel, type SalesEntryRecord } from "./SalesEntryPanel";
import { SalesLeadPanel, type SalesLeadRecord } from "./SalesLeadPanel";
import { SalesTargetDialog } from "./SalesTargetDialog";
import { SalesRecordList } from "./SalesRecordList";

type ActiveTab = "sales" | "leads";

const MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

export function SalesDashboard() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("sales");
  const [openSale, setOpenSale] = useState(false);
  const [openLead, setOpenLead] = useState(false);
  const [openTarget, setOpenTarget] = useState(false);
  const [editingSale, setEditingSale] = useState<SalesEntryRecord | null>(null);
  const [editingLead, setEditingLead] = useState<SalesLeadRecord | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [year, setYear] = useState("1405");
  const [month, setMonth] = useState("1");
  const [period, setPeriod] = useState("1");

  const refresh = () => setRefreshKey((k) => k + 1);

  const periodTitle = useMemo(() => {
    const monthLabel = MONTHS[Number(month) - 1] ?? `ماه ${month}`;
    const periodLabel = period === "1" ? "دهه اول" : period === "2" ? "دهه دوم" : "دهه سوم";
    return `${year} — ${monthLabel} — ${periodLabel}`;
  }, [year, month, period]);

  const openNewSale = () => {
    setEditingSale(null);
    setOpenSale(true);
  };

  const openNewLead = () => {
    setEditingLead(null);
    setOpenLead(true);
  };

  return (
    <div className="space-y-6" dir="rtl">
      <section className="card-elegant overflow-hidden rounded-3xl border border-border/70 bg-card/80">
        <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl gradient-primary text-primary-foreground shadow-[var(--shadow-elegant)]">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-foreground">واحد فروش</h1>
              <p className="mt-1 text-sm text-muted-foreground">ثبت فروش، لیدها، هدف‌گذاری و تحلیل نرخ تحقق</p>
              <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/25 px-3 py-1 text-xs text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" />
                {periodTitle}
              </div>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[430px]">
            <Button size="lg" variant="outline" onClick={() => setOpenTarget(true)} className="justify-center border-border/80 bg-background/40 hover:bg-muted/40">
              <Target className="ml-2 h-5 w-5" />
              تنظیم هدف‌ها
            </Button>
            <Button size="lg" variant="outline" onClick={openNewLead} className="justify-center border-border/80 bg-background/40 hover:bg-muted/40">
              <Users className="ml-2 h-5 w-5" />
              ثبت لید
            </Button>
            <Button size="lg" className="justify-center gradient-primary shadow-[var(--shadow-elegant)]" onClick={openNewSale}>
              <Plus className="ml-2 h-5 w-5" />
              ثبت فروش
            </Button>
          </div>
        </div>
      </section>

      <section className="card-elegant rounded-2xl border border-border/70 bg-card/80 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
          <CalendarDays className="h-4 w-4 text-primary" />
          فیلتر دوره گزارش
        </div>
        <div className="grid gap-3 sm:grid-cols-3 lg:max-w-3xl">
          <Field label="سال">
            <input type="number" value={year} onChange={(e) => setYear(e.target.value)} className="h-10 w-full rounded-lg border border-input bg-background/70 px-3 text-foreground outline-none transition focus:border-primary" />
          </Field>

          <Field label="ماه">
            <select value={month} onChange={(e) => setMonth(e.target.value)} className="h-10 w-full rounded-lg border border-input bg-background/70 px-3 text-sm text-foreground outline-none transition focus:border-primary">
              {MONTHS.map((name, i) => (
                <option key={name} value={String(i + 1)}>{name}</option>
              ))}
            </select>
          </Field>

          <Field label="دوره">
            <select value={period} onChange={(e) => setPeriod(e.target.value)} className="h-10 w-full rounded-lg border border-input bg-background/70 px-3 text-sm text-foreground outline-none transition focus:border-primary">
              <option value="1">دهه اول (۱–۱۰)</option>
              <option value="2">دهه دوم (۱۱–۲۰)</option>
              <option value="3">دهه سوم (۲۱–آخر)</option>
            </select>
          </Field>
        </div>
      </section>

      <SalesCharts key={`sales-chart-${refreshKey}`} year={year} month={month} period={period} />

      <section className="card-elegant rounded-2xl border border-border/70 bg-card/80 p-4">
        <Tabs dir="rtl" value={activeTab} onValueChange={(v) => setActiveTab(v as ActiveTab)}>
          <TabsList className="mb-4 grid h-auto w-full grid-cols-2 gap-2 rounded-xl bg-muted/35 p-1">
            <TabsTrigger value="sales" className="flex items-center gap-2 rounded-lg py-2.5 text-sm data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
              <ShoppingCart className="h-4 w-4" />
              فروش‌های ثبت‌شده
            </TabsTrigger>
            <TabsTrigger value="leads" className="flex items-center gap-2 rounded-lg py-2.5 text-sm data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
              <Users className="h-4 w-4" />
              لیدهای ثبت‌شده
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sales" className="mt-0">
            <SalesRecordList type="sales" year={year} month={month} period={period} refreshKey={refreshKey} onEditSale={(item) => { setEditingSale(item); setOpenSale(true); }} onChanged={refresh} />
          </TabsContent>

          <TabsContent value="leads" className="mt-0">
            <SalesRecordList type="leads" year={year} month={month} period={period} refreshKey={refreshKey} onEditLead={(item) => { setEditingLead(item); setOpenLead(true); }} onChanged={refresh} />
          </TabsContent>
        </Tabs>
      </section>

      <SalesEntryPanel open={openSale} item={editingSale} year={year} month={month} period={period} onOpenChange={(v) => { setOpenSale(v); if (!v) setEditingSale(null); }} onSaved={refresh} />
      <SalesLeadPanel open={openLead} item={editingLead} year={year} month={month} period={period} onOpenChange={(v) => { setOpenLead(v); if (!v) setEditingLead(null); }} onSaved={refresh} />
      <SalesTargetDialog open={openTarget} onOpenChange={setOpenTarget} year={year} month={month} period={period} onSaved={refresh} />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-1.5">
      <span className="block text-xs text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
