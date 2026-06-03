import { useEffect, useState } from "react";
import { Target } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApi } from "@/context/ApiProvider";
import { PRODUCTION_DEVICES, PRODUCTION_ENDPOINTS, type ProductionDevice } from "@/lib/production";

type ForecastItem = { id: number; year: number; month: number; period: number; device: ProductionDevice; predicted_quantity: number };
type ForecastValues = Record<ProductionDevice, string>;
type Props = { open: boolean; onOpenChange: (open: boolean) => void; year: string; month: string; period: string; onSaved: () => void };

function makeEmptyValues(): ForecastValues {
  return Object.fromEntries(PRODUCTION_DEVICES.map((device) => [device.value, "0"])) as ForecastValues;
}

export function ProductionForecastDialog({ open, onOpenChange, year, month, period, onSaved }: Props) {
  const api = useApi();
  const [items, setItems] = useState<ForecastItem[]>([]);
  const [values, setValues] = useState<ForecastValues>(makeEmptyValues());
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams({ year, month, period, no_paginate: "true" });
    try {
      const res = await api.get(`${PRODUCTION_ENDPOINTS.forecasts}?${params.toString()}`);
      const list: ForecastItem[] = Array.isArray(res.body) ? res.body : res.body?.results || [];
      setItems(list);
      const next = makeEmptyValues();
      for (const item of list) next[item.device] = String(item.predicted_quantity ?? 0);
      setValues(next);
    } catch (err) {
      console.error(err);
      toast.error("خطا در دریافت پیش‌بینی تولید");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (open) load(); }, [open, year, month, period]);

  const save = async () => {
    setBusy(true);
    try {
      for (const device of PRODUCTION_DEVICES) {
        const existing = items.find((item) => item.device === device.value);
        const payload = { year: Number(year), month: Number(month), period: Number(period), device: device.value, predicted_quantity: Number(values[device.value] || 0) };
        const res = existing ? await api.patch(`${PRODUCTION_ENDPOINTS.forecasts}${existing.id}/`, payload) : await api.post(PRODUCTION_ENDPOINTS.forecasts, payload);
        if (!res.ok) throw new Error("forecast save failed");
      }
      toast.success("پیش‌بینی تولید ذخیره شد");
      onOpenChange(false);
      onSaved();
    } catch (err) {
      console.error(err);
      toast.error("خطا در ذخیره پیش‌بینی تولید");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Target className="h-5 w-5 text-primary" />تنظیم پیش‌بینی تولید</DialogTitle>
          <DialogDescription>تعداد پیش‌بینی تولید را برای هر دستگاه در دوره انتخاب‌شده وارد کنید.</DialogDescription>
        </DialogHeader>
        <div className="rounded-lg bg-muted/40 px-4 py-3 text-sm text-muted-foreground">سال {year} — ماه {month} — دهه {period}</div>
        {loading ? <div className="grid place-items-center py-12 text-muted-foreground animate-pulse">در حال بارگذاری...</div> : (
          <div className="space-y-3">
            {PRODUCTION_DEVICES.map((device) => (
              <div key={device.value} className="grid gap-3 rounded-xl border border-border/70 bg-background/45 p-3 sm:grid-cols-[1.2fr_1fr] sm:items-center">
                <div className="font-semibold text-foreground">{device.label}</div>
                <Input type="number" min={0} value={values[device.value]} onChange={(e) => setValues((prev) => ({ ...prev, [device.value]: e.target.value }))} />
              </div>
            ))}
          </div>
        )}
        <DialogFooter className="gap-2 sm:justify-start"><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>انصراف</Button><Button type="button" onClick={save} disabled={busy || loading} className="gradient-primary">{busy ? "در حال ذخیره..." : "ذخیره پیش‌بینی"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
