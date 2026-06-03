import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { Users } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { useApi } from "@/context/ApiProvider";
import {
  SALES_DEVICES,
  SALES_ENDPOINTS,
  SALES_SOURCES,
  type SalesDevice,
  type SalesSource,
} from "@/lib/sales";

const schema = z.object({
  year: z.coerce.number().min(1300).max(1500),
  month: z.coerce.number().min(1).max(12),
  period: z.coerce.number().min(1).max(3),
  device: z.string().min(1, "دستگاه را انتخاب کنید"),
  source: z.string().min(1, "منبع لید را انتخاب کنید"),
  lead_count: z.coerce.number().min(0, "تعداد لید نامعتبر است"),
  note: z.string().max(500).optional(),
});

export type SalesLeadRecord = {
  id: number;
  year: number;
  month: number;
  period: number;
  device: SalesDevice;
  source: SalesSource;
  lead_count: number;
  note?: string | null;

  device_label?: string;
  source_label?: string;
};

type Props = {
  open: boolean;
  item?: SalesLeadRecord | null;
  year: string;
  month: string;
  period: string;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
};

function makeInitialForm(year: string, month: string, period: string) {
  return {
    year,
    month,
    period,
    device: "",
    source: "",
    lead_count: "0",
    note: "",
  };
}

export function SalesLeadPanel({
  open,
  item,
  year,
  month,
  period,
  onOpenChange,
  onSaved,
}: Props) {
  const api = useApi();

  const emptyForm = useMemo(() => makeInitialForm(year, month, period), [year, month, period]);

  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (item) {
      setForm({
        year: String(item.year),
        month: String(item.month),
        period: String(item.period),
        device: item.device,
        source: item.source,
        lead_count: String(item.lead_count),
        note: item.note ?? "",
      });
    } else {
      setForm(makeInitialForm(year, month, period));
    }

    setErrors({});
  }, [open, item, year, month, period]);

  const set = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const reset = () => {
    setForm(emptyForm);
    setErrors({});
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = schema.safeParse(form);

    if (!result.success) {
      const nextErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const key = err.path[0] as string;
        nextErrors[key] = err.message;
      });
      setErrors(nextErrors);
      return;
    }

    setBusy(true);

    try {
      const payload = {
        ...result.data,
        note: result.data.note || null,
      };

      const res = item
        ? await api.patch(`${SALES_ENDPOINTS.leads}${item.id}/`, payload)
        : await api.post(SALES_ENDPOINTS.leads, payload);

      if (!res.ok) {
        console.error(res.body);
        toast.error(item ? "ویرایش لید ناموفق بود" : "ثبت لید ناموفق بود");
        return;
      }

      toast.success(item ? "لید با موفقیت ویرایش شد" : "لید با موفقیت ثبت شد");
      reset();
      onOpenChange(false);
      onSaved();
    } catch (err) {
      console.error(err);
      toast.error("خطا در ارتباط با سرور");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent dir="rtl" className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            {item ? "ویرایش لید" : "ثبت لید جدید"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-5">
          <div className="grid grid-cols-3 gap-3">
            <Field label="سال" error={errors.year}>
              <Input value={form.year} onChange={(e) => set("year", e.target.value)} />
            </Field>

            <Field label="ماه" error={errors.month}>
              <Select value={form.month} onValueChange={(v) => set("month", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="دوره" error={errors.period}>
              <Select value={form.period} onValueChange={(v) => set("period", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">دهه اول</SelectItem>
                  <SelectItem value="2">دهه دوم</SelectItem>
                  <SelectItem value="3">دهه سوم</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="دستگاه" error={errors.device}>
              <Select value={form.device} onValueChange={(v) => set("device", v)}>
                <SelectTrigger><SelectValue placeholder="انتخاب دستگاه" /></SelectTrigger>
                <SelectContent>
                  {SALES_DEVICES.map((device) => (
                    <SelectItem key={device.value} value={device.value}>
                      {device.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="منبع لید" error={errors.source}>
              <Select value={form.source} onValueChange={(v) => set("source", v)}>
                <SelectTrigger><SelectValue placeholder="انتخاب منبع" /></SelectTrigger>
                <SelectContent>
                  {SALES_SOURCES.map((source) => (
                    <SelectItem key={source.value} value={source.value}>
                      {source.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="تعداد لید" error={errors.lead_count}>
            <Input
              type="number"
              min={0}
              value={form.lead_count}
              onChange={(e) => set("lead_count", e.target.value)}
            />
          </Field>

          <Field label="یادداشت" error={errors.note}>
            <Textarea
              rows={3}
              value={form.note}
              onChange={(e) => set("note", e.target.value)}
              placeholder="توضیحات اختیاری..."
            />
          </Field>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
            >
              انصراف
            </Button>

            <Button type="submit" disabled={busy} className="gradient-primary">
              {busy ? "در حال ذخیره..." : item ? "ذخیره تغییرات" : "ثبت لید"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-sm">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}