import { useState } from "react";
import { Building2, CheckSquare, Phone, Plus, Target, Truck, Wrench } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { SupportCharts } from "./SupportCharts";
import { SupportEntryPanel } from "./SupportEntryPanel";
import { SupportForecastDialog } from "./SupportForecastDialog";
import { SupportTaskList } from "./SupportTaskList";
import { TASK_TYPES, type TaskType } from "@/lib/support";

const TAB_ICONS: Record<TaskType, React.ReactNode> = {
  technical: <Phone className="h-4 w-4" />,
  qc: <CheckSquare className="h-4 w-4" />,
  shipment: <Truck className="h-4 w-4" />,
  internal: <Wrench className="h-4 w-4" />,
};

export function SupportDashboard() {
  const [activeTab, setActiveTab] = useState<TaskType>("technical");
  const [openEntry, setOpenEntry] = useState(false);
  const [openForecast, setOpenForecast] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [year, setYear] = useState("1405");
  const [month, setMonth] = useState("1");
  const [period, setPeriod] = useState("1");

  const refresh = () => setRefreshKey((key) => key + 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="mb-2 flex items-start gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl gradient-primary text-primary-foreground shadow-[var(--shadow-elegant)]">
            <Building2 className="h-6 w-6" />
          </div>

          <div>
            <h1 className="text-2xl font-extrabold">واحد پشتیبانی</h1>
            <p className="text-sm text-muted-foreground">
              ثبت تسک‌ها، هدف‌گذاری و بررسی عملکرد دوره‌ای پشتیبانی
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setOpenForecast(true)} size="lg" variant="outline">
            <Target className="ml-2 h-5 w-5" />
            تنظیم هدف‌ها
          </Button>

          <Button onClick={() => setOpenEntry(true)} size="lg" className="gradient-primary">
            <Plus className="ml-2 h-5 w-5" />
            ثبت تسک جدید
          </Button>
        </div>
      </div>

      <div className="card-elegant p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col">
            <label className="mb-1 text-xs text-muted-foreground">سال</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-24 rounded-md border border-input bg-background px-3 py-2 text-foreground"
            />
          </div>

          <div className="flex flex-col">
            <label className="mb-1 text-xs text-muted-foreground">ماه</label>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={String(i + 1)}>
                  {i + 1}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="mb-1 text-xs text-muted-foreground">دوره</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
            >
              <option value="1">دهه اول (۱–۱۰)</option>
              <option value="2">دهه دوم (۱۱–۲۰)</option>
              <option value="3">دهه سوم (۲۱–آخر)</option>
            </select>
          </div>
        </div>
      </div>

      <SupportCharts
        year={year}
        month={month}
        period={period}
        key={`support-chart-${refreshKey}`}
      />

      <Tabs dir="rtl" value={activeTab} onValueChange={(value) => setActiveTab(value as TaskType)}>
        <TabsList className="mb-4 grid h-auto w-full grid-cols-2 gap-2 bg-muted/50 p-1 sm:grid-cols-4">
          {TASK_TYPES.map((task) => (
            <TabsTrigger
              key={task.value}
              value={task.value}
              className="flex items-center gap-2 rounded-md py-2.5 text-sm"
            >
              {TAB_ICONS[task.value]}
              <span>{task.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {TASK_TYPES.map((task) => (
          <TabsContent key={task.value} value={task.value}>
            <SupportTaskList
              taskType={task.value}
              year={year}
              month={month}
              period={period}
              refreshKey={refreshKey}
            />
          </TabsContent>
        ))}
      </Tabs>

      <SupportEntryPanel
        open={openEntry}
        defaultTaskType={activeTab}
        year={year}
        month={month}
        period={period}
        onOpenChange={setOpenEntry}
        onSaved={refresh}
      />

      <SupportForecastDialog
        open={openForecast}
        onOpenChange={setOpenForecast}
        year={year}
        month={month}
        period={period}
        onSaved={refresh}
      />
    </div>
  );
}
