import { useEffect, useState } from "react";
import { Target } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApi } from "@/context/ApiProvider";
import { SALES_DEVICES, SALES_ENDPOINTS, type SalesDevice } from "@/lib/sales";

type SalesTargetItem = {
  id: number;
  year: number;
  month: number;
  period: number;
  device: SalesDevice;
  target_sales_count: number;
  target_lead_count: number;
  target_amount: number | string;
};

type TargetValues = Record<
  SalesDevice,
  {
    target_sales_count: string;
    target_lead_count: string;
    target_amount: string;
  }
>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  year: string;
  month: string;
  period: string;
  onSaved: () => void;
};

function makeEmptyValues(): TargetValues {
  return Object.fromEntries(
    SALES_DEVICES.map((device) => [
      device.value,
      {
        target_sales_count: "0",
        target_lead_count: "0",
        target_amount: "0",
      },
    ])
  ) as TargetValues;
}

export function SalesTargetDialog({
  open,
  onOpenChange,
  year,
  month,
  period,
  onSaved,
}: Props) {
  const api = useApi();

  const [items, setItems] = useState<SalesTargetItem[]>([]);
  const [values, setValues] = useState<TargetValues>(makeEmptyValues());
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const loadTargets = async () => {
    setLoading(true);

    const params = new URLSearchParams({
      year,
      month,
      period,
      no_paginate: "true",
    });

    try {
      const res = await api.get(`${SALES_ENDPOINTS.targets}?${params.toString()}`);

      const list: SalesTargetItem[] = Array.isArray(res.body)
        ? res.body
        : res.body?.results || [];

      setItems(list);

      const next = makeEmptyValues();

      for (const item of list) {
        next[item.device] = {
          target_sales_count: String(item.target_sales_count ?? 0),
          target_lead_count: String(item.target_lead_count ?? 0),
          target_amount: String(item.target_amount ?? 0),
        };
      }

      setValues(next);
    } catch (err) {
      console.error(err);
      toast.error("خطا در دریافت هدف‌های فروش");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) loadTargets();
  }, [open, year, month, period]);

  const setValue = (
    device: SalesDevice,
    key: keyof TargetValues[SalesDevice],
    value: string
  ) => {
    setValues((prev) => ({
      ...prev,
      [device]: {
        ...prev[device],
        [key]: value,
      },
    }));
  };

  const save = async () => {
    setBusy(true);

    try {
      for (const device of SALES_DEVICES) {
        const existing = items.find((item) => item.device === device.value);

        const payload = {
          year: Number(year),
          month: Number(month),
          period: Number(period),
          device: device.value,
          target_sales_count: Number(values[device.value].target_sales_count || 0),
          target_lead_count: Number(values[device.value].target_lead_count || 0),
          target_amount: Number(values[device.value].target_amount || 0),
        };

        const res = existing
          ? await api.patch(`${SALES_ENDPOINTS.targets}${existing.id}/`, payload)
          : await api.post(SALES_ENDPOINTS.targets, payload);

        if (!res.ok) {
          console.error(res.body);
          throw new Error("target save failed");
        }
      }

      toast.success("هدف‌های فروش ذخیره شد");
      onOpenChange(false);
      onSaved();
    } catch (err) {
      console.error(err);
      toast.error("خطا در ذخیره هدف‌های فروش");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            تنظیم هدف‌های فروش
          </DialogTitle>

          <DialogDescription>
            هدف فروش، لید و مبلغ را برای هر دستگاه در دوره انتخاب‌شده مشخص کنید.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          سال {year} — ماه {month} — دهه {period}
        </div>

        {loading ? (
          <div className="grid place-items-center py-12 text-muted-foreground animate-pulse">
            در حال بارگذاری هدف‌ها...
          </div>
        ) : (
          <div className="space-y-3">
            <div className="hidden grid-cols-[1.2fr_1fr_1fr_1fr] gap-3 px-2 text-xs text-muted-foreground sm:grid">
              <span>دستگاه</span>
              <span>هدف فروش</span>
              <span>هدف لید</span>
              <span>هدف مبلغ</span>
            </div>

            {SALES_DEVICES.map((device) => (
              <div
                key={device.value}
                className="grid gap-3 rounded-xl border border-border bg-muted/20 p-3 sm:grid-cols-[1.2fr_1fr_1fr_1fr] sm:items-center"
              >
                <div className="font-medium">{device.label}</div>

                <Input
                  type="number"
                  min={0}
                  value={values[device.value].target_sales_count}
                  onChange={(e) =>
                    setValue(device.value, "target_sales_count", e.target.value)
                  }
                  placeholder="هدف فروش"
                />

                <Input
                  type="number"
                  min={0}
                  value={values[device.value].target_lead_count}
                  onChange={(e) =>
                    setValue(device.value, "target_lead_count", e.target.value)
                  }
                  placeholder="هدف لید"
                />

                <Input
                  type="number"
                  min={0}
                  value={values[device.value].target_amount}
                  onChange={(e) =>
                    setValue(device.value, "target_amount", e.target.value)
                  }
                  placeholder="هدف مبلغ"
                />
              </div>
            ))}
          </div>
        )}

        <DialogFooter className="gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => onOpenChange(false)}
          >
            انصراف
          </Button>

          <Button
            type="button"
            disabled={busy || loading}
            onClick={save}
            className="gradient-primary"
          >
            {busy ? "در حال ذخیره..." : "ذخیره هدف‌ها"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}