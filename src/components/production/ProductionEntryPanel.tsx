import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { Factory } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useApi } from "@/context/ApiProvider";
import { PRODUCTION_DEVICES, PRODUCTION_ENDPOINTS, type ProductionDevice } from "@/lib/production";

const schema = z.object({ year: z.coerce.number().min(1300).max(1500), month: z.coerce.number().min(1).max(12), period: z.coerce.number().min(1).max(3), device: z.string().min(1, "دستگاه را انتخاب کنید"), quantity: z.coerce.number().min(1, "تعداد تولید باید حداقل ۱ باشد"), production_date: z.string().optional(), note: z.string().max(500).optional() });
export type ProductionEntryRecord = { id: number; year: number; month: number; period: number; device: ProductionDevice; quantity: number; production_date?: string | null; note?: string | null; device_label?: string };
type Props = { open: boolean; item?: ProductionEntryRecord | null; year: string; month: string; period: string; onOpenChange: (open: boolean) => void; onSaved: () => void };
function makeInitialForm(year: string, month: string, period: string) { return { year, month, period, device: "", quantity: "1", production_date: "", note: "" }; }

export function ProductionEntryPanel({ open, item, year, month, period, onOpenChange, onSaved }: Props) {
  const api = useApi();
  const emptyForm = useMemo(() => makeInitialForm(year, month, period), [year, month, period]);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (!open) return; item ? setForm({ year: String(item.year), month: String(item.month), period: String(item.period), device: item.device, quantity: String(item.quantity), production_date: item.production_date ?? "", note: item.note ?? "" }) : setForm(makeInitialForm(year, month, period)); setErrors({}); }, [open, item, year, month, period]);
  const set = (key: string, value: string) => { setForm((prev) => ({ ...prev, [key]: value })); setErrors((prev) => ({ ...prev, [key]: "" })); };
  const reset = () => { setForm(emptyForm); setErrors({}); };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = schema.safeParse(form);
    if (!result.success) { const next: Record<string, string> = {}; result.error.errors.forEach((err) => { next[err.path[0] as string] = err.message; }); setErrors(next); return; }
    setBusy(true);
    try {
      const payload = { ...result.data, production_date: result.data.production_date || null, note: result.data.note || null };
      const res = item ? await api.patch(`${PRODUCTION_ENDPOINTS.entries}${item.id}/`, payload) : await api.post(PRODUCTION_ENDPOINTS.entries, payload);
      if (!res.ok) { toast.error(item ? "ویرایش تولید ناموفق بود" : "ثبت تولید ناموفق بود"); return; }
      toast.success(item ? "تولید ویرایش شد" : "تولید ثبت شد"); reset(); onOpenChange(false); onSaved();
    } catch (err) { console.error(err); toast.error("خطا در ارتباط با سرور"); } finally { setBusy(false); }
  };
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent dir="rtl" className="max-w-xl max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle className="flex items-center gap-2"><Factory className="h-5 w-5 text-primary" />{item ? "ویرایش تولید" : "ثبت تولید جدید"}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-5">
          <div className="grid grid-cols-3 gap-3"><Field label="سال" error={errors.year}><Input value={form.year} onChange={(e) => set("year", e.target.value)} /></Field><Field label="ماه" error={errors.month}><Select value={form.month} onValueChange={(v) => set("month", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Array.from({ length: 12 }, (_, i) => <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}</SelectItem>)}</SelectContent></Select></Field><Field label="دوره" error={errors.period}><Select value={form.period} onValueChange={(v) => set("period", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1">دهه اول</SelectItem><SelectItem value="2">دهه دوم</SelectItem><SelectItem value="3">دهه سوم</SelectItem></SelectContent></Select></Field></div>
          <div className="grid gap-3 sm:grid-cols-2"><Field label="دستگاه" error={errors.device}><Select value={form.device} onValueChange={(v) => set("device", v)}><SelectTrigger><SelectValue placeholder="انتخاب دستگاه" /></SelectTrigger><SelectContent>{PRODUCTION_DEVICES.map((device) => <SelectItem key={device.value} value={device.value}>{device.label}</SelectItem>)}</SelectContent></Select></Field><Field label="تعداد تولید" error={errors.quantity}><Input type="number" min={1} value={form.quantity} onChange={(e) => set("quantity", e.target.value)} /></Field></div>
          <Field label="تاریخ تولید" error={errors.production_date}><Input placeholder="مثلا 1405/10/03" value={form.production_date} onChange={(e) => set("production_date", e.target.value)} /></Field>
          <Field label="یادداشت" error={errors.note}><Textarea rows={3} value={form.note} onChange={(e) => set("note", e.target.value)} /></Field>
          <DialogFooter className="gap-2 sm:justify-start"><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>انصراف</Button><Button type="submit" disabled={busy} className="gradient-primary">{busy ? "در حال ذخیره..." : item ? "ذخیره تغییرات" : "ثبت تولید"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) { return <div className="space-y-1.5"><Label>{label}</Label>{children}{error ? <p className="text-xs text-destructive">{error}</p> : null}</div>; }
