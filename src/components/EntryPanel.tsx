import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getCategories, formatNumber, type DepartmentCode } from "@/lib/departments";
import { TrendingDown, TrendingUp, Sparkles, Calendar, Tag, Coins, FileText } from "lucide-react";

const schema = z.object({
  category: z.string().trim().min(1, { message: "دسته را انتخاب کنید" }).max(120),
  amount: z.coerce.number().positive({ message: "مبلغ باید مثبت باشد" }).max(1e15),
  start_date: z.string().min(1, { message: "تاریخ شروع را وارد کنید" }),
  end_date: z.string().min(1, { message: "تاریخ پایان را وارد کنید" }),
  note: z.string().max(500).optional(),
}).refine((d) => new Date(d.end_date) >= new Date(d.start_date), {
  message: "تاریخ پایان باید بعد از شروع باشد", path: ["end_date"],
});

type Props = {
  department: DepartmentCode;
  userId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
};

export function EntryPanel({ department, userId, open, onOpenChange, onSaved }: Props) {
  const [kind, setKind] = useState<"deposit" | "payment">("deposit");
  const [mode, setMode] = useState<"real" | "forecast">("real");
  const [form, setForm] = useState({ category: "", amount: "", start_date: "", end_date: "", note: "" });
  const [busy, setBusy] = useState(false);

  const cats = getCategories(department, kind);

  const reset = () => {
    setForm({ category: "", amount: "", start_date: "", end_date: "", note: "" });
    setKind("deposit");
    setMode("real");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = schema.safeParse(form);
    if (!r.success) return toast.error(r.error.issues[0].message);
    setBusy(true);
    const { error } = await supabase.from("financial_entries").insert({
      user_id: userId,
      department,
      kind,
      is_forecast: mode === "forecast",
      category: r.data.category,
      amount: r.data.amount,
      start_date: r.data.start_date,
      end_date: r.data.end_date,
      note: r.data.note || null,
    });
    setBusy(false);
    if (error) return toast.error("ثبت ناموفق: " + error.message);
    toast.success("با موفقیت ثبت شد");
    reset();
    onOpenChange(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent dir="rtl" className="max-w-2xl">
        <DialogHeader className="text-right">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-primary" /> ثبت رکورد جدید
          </DialogTitle>
          <DialogDescription>
            اطلاعات مالی واحد خود را به‌صورت واقعی یا پیش‌بینی ثبت کنید.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-5 pt-2">
          {/* نوع تراکنش */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">نوع تراکنش</Label>
              <ToggleGroup
                type="single"
                value={kind}
                onValueChange={(v) => v && setKind(v as any)}
                className="grid grid-cols-2 gap-2"
              >
                <ToggleGroupItem
                  value="deposit"
                  className="h-10 rounded-lg border data-[state=on]:bg-success/15 data-[state=on]:text-success data-[state=on]:border-success/40"
                >
                  <TrendingUp className="ml-2 h-4 w-4" /> دریافت
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="payment"
                  className="h-10 rounded-lg border data-[state=on]:bg-destructive/15 data-[state=on]:text-destructive data-[state=on]:border-destructive/40"
                >
                  <TrendingDown className="ml-2 h-4 w-4" /> پرداخت
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">حالت ثبت</Label>
              <ToggleGroup
                type="single"
                value={mode}
                onValueChange={(v) => v && setMode(v as any)}
                className="grid grid-cols-2 gap-2"
              >
                <ToggleGroupItem
                  value="real"
                  className="h-10 rounded-lg border data-[state=on]:bg-primary/15 data-[state=on]:text-primary data-[state=on]:border-primary/40"
                >
                  واقعی
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="forecast"
                  className="h-10 rounded-lg border data-[state=on]:bg-accent/15 data-[state=on]:text-accent data-[state=on]:border-accent/40"
                >
                  پیش‌بینی
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>

          {/* دسته */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-sm">
              <Tag className="h-3.5 w-3.5 text-muted-foreground" /> دسته‌بندی
            </Label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger className="h-11"><SelectValue placeholder="یک دسته انتخاب کنید" /></SelectTrigger>
              <SelectContent>
                {cats.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* مبلغ */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-sm">
              <Coins className="h-3.5 w-3.5 text-muted-foreground" /> مبلغ (تومان)
            </Label>
            <div className="relative">
              <Input
                type="number"
                inputMode="numeric"
                placeholder="مثلاً 1500000"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="h-11 pl-20"
                dir="ltr"
              />
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                تومان
              </span>
            </div>
            {form.amount && Number(form.amount) > 0 && (
              <p className="num-fa text-xs text-muted-foreground">
                ≈ {formatNumber(Number(form.amount))} تومان
              </p>
            )}
          </div>

          {/* تاریخ‌ها */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-sm">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" /> تاریخ شروع
              </Label>
              <Input type="date" dir="ltr" className="h-11" value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-sm">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" /> تاریخ پایان
              </Label>
              <Input type="date" dir="ltr" className="h-11" value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
            </div>
          </div>

          {/* یادداشت */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-sm">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" /> توضیحات (اختیاری)
            </Label>
            <Textarea
              rows={3}
              placeholder="توضیحات تکمیلی درباره این رکورد..."
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              انصراف
            </Button>
            <Button type="submit" disabled={busy} className="gradient-primary text-primary-foreground hover:opacity-95">
              {busy ? "در حال ثبت..." : "ثبت رکورد"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
