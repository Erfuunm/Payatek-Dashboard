import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { ShoppingCart } from "lucide-react";
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
  CUSTOMER_GROUPS,
  SALES_DEVICES,
  SALES_ENDPOINTS,
  SALES_SOURCES,
  type CustomerGroup,
  type SalesDevice,
  type SalesSource,
} from "@/lib/sales";

const schema = z.object({
  year: z.coerce.number().min(1300).max(1500),
  month: z.coerce.number().min(1).max(12),
  period: z.coerce.number().min(1).max(3),
  device: z.string().min(1, "دستگاه را انتخاب کنید"),
  source: z.string().min(1, "منبع فروش را انتخاب کنید"),
  customer_group: z.string().min(1, "گروه مشتری را انتخاب کنید"),
  quantity: z.coerce.number().min(1, "تعداد فروش باید حداقل ۱ باشد"),
  amount: z.coerce.number().min(0, "مبلغ نامعتبر است"),
  sale_date: z.string().optional(),
  note: z.string().max(500).optional(),
});

export type SalesEntryRecord = {
  id: number;
  year: number;
  month: number;
  period: number;
  device: SalesDevice;
  source: SalesSource;
  customer_group: CustomerGroup;
  quantity: number;
  amount: number | string;
  sale_date?: string | null;
  note?: string | null;

  device_label?: string;
  source_label?: string;
  customer_group_label?: string;
};

type Props = {
  open: boolean;
  item?: SalesEntryRecord | null;
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
    customer_group: "",
    quantity: "1",
    amount: "0",
    sale_date: "",
    note: "",
  };
}

export function SalesEntryPanel({
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
        customer_group: item.customer_group,
        quantity: String(item.quantity),
        amount: String(item.amount ?? 0),
        sale_date: item.sale_date ?? "",
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
        sale_date: result.data.sale_date || null,
        note: result.data.note || null,
      };

      const res = item
        ? await api.patch(`${SALES_ENDPOINTS.entries}${item.id}/`, payload)
        : await api.post(SALES_ENDPOINTS.entries, payload);

      if (!res.ok) {
        console.error(res.body);
        toast.error(item ? "ویرایش فروش ناموفق بود" : "ثبت فروش ناموفق بود");
        return;
      }

      toast.success(item ? "فروش با موفقیت ویرایش شد" : "فروش با موفقیت ثبت شد");
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
      <DialogContent dir="rtl" className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            {item ? "ویرایش فروش" : "ثبت فروش جدید"}
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

            <Field label="منبع فروش" error={errors.source}>
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

          <Field label="گروه مشتری / محل فروش" error={errors.customer_group}>
            <Select value={form.customer_group} onValueChange={(v) => set("customer_group", v)}>
              <SelectTrigger><SelectValue placeholder="انتخاب گروه مشتری" /></SelectTrigger>
              <SelectContent>
                {CUSTOMER_GROUPS.map((group) => (
                  <SelectItem key={group.value} value={group.value}>
                    {group.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="تعداد فروش" error={errors.quantity}>
              <Input
                type="number"
                min={1}
                value={form.quantity}
                onChange={(e) => set("quantity", e.target.value)}
              />
            </Field>

            <Field label="مبلغ فروش" error={errors.amount}>
              <Input
                type="number"
                min={0}
                value={form.amount}
                onChange={(e) => set("amount", e.target.value)}
              />
            </Field>

            <Field label="تاریخ فروش" error={errors.sale_date}>
              <Input
                value={form.sale_date}
                onChange={(e) => set("sale_date", e.target.value)}
                placeholder="۱۴۰۵/۰۱/۰۱"
              />
            </Field>
          </div>

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
              {busy ? "در حال ذخیره..." : item ? "ذخیره تغییرات" : "ثبت فروش"}
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