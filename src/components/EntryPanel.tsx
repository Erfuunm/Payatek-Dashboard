import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getCategories, type DepartmentCode } from "@/lib/departments";
import { Plus, TrendingDown, TrendingUp } from "lucide-react";

const schema = z.object({
  category: z.string().trim().min(1, { message: "دسته را انتخاب کنید" }).max(120),
  amount: z.coerce.number().positive({ message: "مبلغ باید مثبت باشد" }).max(1e15),
  start_date: z.string().min(1, { message: "تاریخ شروع را وارد کنید" }),
  end_date: z.string().min(1, { message: "تاریخ پایان را وارد کنید" }),
  note: z.string().max(500).optional(),
}).refine((d) => new Date(d.end_date) >= new Date(d.start_date), { message: "تاریخ پایان باید بعد از شروع باشد", path: ["end_date"] });

type Props = {
  department: DepartmentCode;
  userId: string;
  onSaved: () => void;
};

function EntryForm({ department, userId, onSaved, kind, isForecast }: Props & { kind: "deposit" | "payment"; isForecast: boolean }) {
  const cats = getCategories(department, kind);
  const [form, setForm] = useState({ category: "", amount: "", start_date: "", end_date: "", note: "" });
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = schema.safeParse(form);
    if (!r.success) return toast.error(r.error.issues[0].message);
    setBusy(true);
    const { error } = await supabase.from("financial_entries").insert({
      user_id: userId,
      department,
      kind,
      is_forecast: isForecast,
      category: r.data.category,
      amount: r.data.amount,
      start_date: r.data.start_date,
      end_date: r.data.end_date,
      note: r.data.note || null,
    });
    setBusy(false);
    if (error) return toast.error("ثبت ناموفق: " + error.message);
    toast.success("با موفقیت ثبت شد");
    setForm({ category: "", amount: "", start_date: "", end_date: "", note: "" });
    onSaved();
  };

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2 sm:col-span-2">
        <Label>دسته</Label>
        <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
          <SelectTrigger><SelectValue placeholder="انتخاب دسته" /></SelectTrigger>
          <SelectContent>
            {cats.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>مبلغ (تومان)</Label>
        <Input type="number" inputMode="numeric" value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label>تاریخ شروع</Label>
        <Input type="date" dir="ltr" value={form.start_date}
          onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label>تاریخ پایان</Label>
        <Input type="date" dir="ltr" value={form.end_date}
          onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label>یادداشت (اختیاری)</Label>
        <Textarea rows={2} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={busy} className="w-full gradient-primary text-primary-foreground hover:opacity-95">
          <Plus className="ml-2 h-4 w-4" /> ثبت رکورد
        </Button>
      </div>
    </form>
  );
}

export function EntryPanel({ department, userId, onSaved }: Props) {
  const [forecast, setForecast] = useState(false);

  return (
    <div className="card-elegant p-6 animate-fade-in">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold">ثبت رکورد جدید</h3>
        <div className="flex items-center gap-2">
          <Label htmlFor="fc" className="text-sm text-muted-foreground">حالت پیش‌بینی</Label>
          <Switch id="fc" checked={forecast} onCheckedChange={setForecast} />
        </div>
      </div>

      <Tabs defaultValue="deposit">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="deposit"><TrendingUp className="ml-2 h-4 w-4" /> دریافت‌ها</TabsTrigger>
          <TabsTrigger value="payment"><TrendingDown className="ml-2 h-4 w-4" /> پرداخت‌ها</TabsTrigger>
        </TabsList>
        <TabsContent value="deposit" className="pt-5">
          <EntryForm department={department} userId={userId} onSaved={onSaved} kind="deposit" isForecast={forecast} />
        </TabsContent>
        <TabsContent value="payment" className="pt-5">
          <EntryForm department={department} userId={userId} onSaved={onSaved} kind="payment" isForecast={forecast} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
