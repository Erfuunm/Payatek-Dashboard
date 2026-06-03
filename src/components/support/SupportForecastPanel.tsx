import { useEffect, useState } from "react";
import { Target } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApi } from "@/context/ApiProvider";
import { TASK_TYPES, type TaskType } from "@/lib/support";

type ForecastItem = {
  id: number;
  task_type: TaskType;
  year: number;
  month: number;
  period: number;
  forecast_count: number;
};

type Props = {
  year: string;
  month: string;
  period: string;
  onSaved?: () => void;
};

const EMPTY_VALUES: Record<TaskType, string> = {
  technical: "0",
  qc: "0",
  shipment: "0",
  internal: "0",
};

export function SupportForecastPanel({ year, month, period, onSaved }: Props) {
  const api = useApi();

  const [items, setItems] = useState<ForecastItem[]>([]);
  const [values, setValues] = useState<Record<TaskType, string>>(EMPTY_VALUES);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const loadForecasts = async () => {
    setLoading(true);

    const params = new URLSearchParams({
      year,
      month,
      period,
      no_paginate: "true",
    });

    try {
      const res = await api.get(`/api/support/forecast/?${params.toString()}`);

      const list: ForecastItem[] = Array.isArray(res.body)
        ? res.body
        : res.body?.results || [];

      setItems(list);

      const nextValues: Record<TaskType, string> = {
        technical: "0",
        qc: "0",
        shipment: "0",
        internal: "0",
      };

      for (const item of list) {
        nextValues[item.task_type] = String(item.forecast_count ?? 0);
      }

      setValues(nextValues);
    } catch (err) {
      console.error(err);
      toast.error("خطا در دریافت هدف‌های پشتیبانی");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadForecasts();
  }, [year, month, period]);

  const save = async () => {
    setBusy(true);

    try {
      for (const task of TASK_TYPES) {
        const existing = items.find((item) => item.task_type === task.value);

        const payload = {
          task_type: task.value,
          year: Number(year),
          month: Number(month),
          period: Number(period),
          forecast_count: Number(values[task.value] || 0),
        };

        const res = existing
          ? await api.patch(`/api/support/forecast/${existing.id}/`, payload)
          : await api.post("/api/support/forecast/", payload);

        if (!res.ok) {
          console.error(res.body);
          throw new Error("forecast save failed");
        }
      }

      toast.success("هدف‌های پشتیبانی ذخیره شد");
      await loadForecasts();
      onSaved?.();
    } catch (err) {
      console.error(err);
      toast.error("خطا در ذخیره هدف‌ها");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="card-elegant grid place-items-center py-10 text-muted-foreground animate-pulse">
        در حال بارگذاری هدف‌ها...
      </div>
    );
  }

  return (
    <div className="card-elegant space-y-4 p-5">
      <div className="flex items-center gap-2">
        <Target className="h-5 w-5 text-primary" />
        <div>
          <h3 className="text-sm font-bold">هدف‌های پشتیبانی</h3>
          <p className="text-xs text-muted-foreground">
            تعداد هدف برای هر نوع تسک در دوره انتخاب‌شده
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {TASK_TYPES.map((task) => (
          <div key={task.value} className="space-y-2 rounded-xl border border-border bg-muted/20 p-3">
            <label className="text-xs text-muted-foreground">{task.label}</label>
            <Input
              type="number"
              min={0}
              value={values[task.value]}
              onChange={(e) =>
                setValues((prev) => ({
                  ...prev,
                  [task.value]: e.target.value,
                }))
              }
            />
          </div>
        ))}
      </div>

      <Button onClick={save} disabled={busy} className="gradient-primary">
        {busy ? "در حال ذخیره..." : "ذخیره هدف‌ها"}
      </Button>
    </div>
  );
}
