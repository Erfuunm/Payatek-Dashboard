import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { CheckSquare, Phone, Plus, Truck, Wrench } from "lucide-react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

import { useApi } from "@/context/ApiProvider";
import {
  DEPARTMENT_CHOICES,
  DEVICE_CHOICES,
  QC_DURATIONS,
  SHIPPING_METHODS,
  SUPPORT_LEVELS,
  TASK_ENDPOINTS,
  TASK_TYPES,
  type TaskType,
} from "@/lib/support";

const base = {
  year: z.coerce.number().min(1300).max(1500),
  month: z.coerce.number().min(1).max(12),
  period: z.coerce.number().min(1).max(3),
  note: z.string().max(500).optional(),
};

const schemas: Record<TaskType, z.ZodTypeAny> = {
  technical: z
    .object({
      ...base,
      customer_name: z.string().min(1, "نام مشتری الزامی است"),
      device: z.string().min(1, "دستگاه را انتخاب کنید"),
      contact_date: z.string().min(1, "تاریخ تماس الزامی است"),
      contact_reason: z.string().min(1, "علت تماس الزامی است"),
      support_level: z.coerce.number().min(1).max(3),
      status: z.enum(["resolved", "referred"]),
      referred_to: z
        .enum(["financial", "sales", "support", "rnd", "production"])
        .or(z.literal(""))
        .optional(),
    })
    .refine((data) => data.status !== "referred" || !!data.referred_to, {
      message: "واحد مقصد الزامی است",
      path: ["referred_to"],
    }),

  qc: z
    .object({
      ...base,
      device: z.string().min(1, "دستگاه را انتخاب کنید"),
      duration_minutes: z.coerce.number().positive("مدت زمان الزامی است"),
      passed: z.boolean(),
      fail_reason: z.string().optional(),
    })
    .refine((data) => data.passed || !!data.fail_reason, {
      message: "علت Fail الزامی است",
      path: ["fail_reason"],
    }),

  shipment: z.object({
    ...base,
    customer_last_name: z.string().min(1, "فامیل مشتری الزامی است"),
    shipment_date: z.string().min(1, "تاریخ ارسال الزامی است"),
    shipping_method: z.enum(["freight", "tipax"]),
    order_number: z.string().min(1, "شماره پرونده الزامی است"),
    devices: z.array(z.string()).min(1, "حداقل یک دستگاه انتخاب کنید"),
  }),

  internal: z.object({
    ...base,
    description: z.string().min(1, "شرح کار الزامی است"),
    duration_minutes: z.coerce.number().positive("مدت زمان الزامی است"),
  }),
};

type Props = {
  open: boolean;
  defaultTaskType: TaskType;
  year: string;
  month: string;
  period: string;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
};

const TASK_ICONS: Record<TaskType, React.ReactNode> = {
  technical: <Phone className="h-4 w-4" />,
  qc: <CheckSquare className="h-4 w-4" />,
  shipment: <Truck className="h-4 w-4" />,
  internal: <Wrench className="h-4 w-4" />,
};

function makeInitialForm(year: string, month: string, period: string) {
  return {
    year,
    month,
    period,
    note: "",

    customer_name: "",
    device: "",
    contact_date: "",
    contact_reason: "",
    support_level: "1",
    status: "resolved" as "resolved" | "referred",
    referred_to: "",

    duration_minutes: "",
    passed: true,
    fail_reason: "",

    customer_last_name: "",
    shipment_date: "",
    shipping_method: "freight" as "freight" | "tipax",
    order_number: "",
    devices: [] as string[],

    description: "",
  };
}

export function SupportEntryPanel({
  open,
  defaultTaskType,
  year,
  month,
  period,
  onOpenChange,
  onSaved,
}: Props) {
  const api = useApi();

  const initialForm = useMemo(() => makeInitialForm(year, month, period), [year, month, period]);

  const [taskType, setTaskType] = useState<TaskType>(defaultTaskType);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTaskType(defaultTaskType);
    setForm(makeInitialForm(year, month, period));
    setErrors({});
  }, [open, defaultTaskType, year, month, period]);

  const set = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const reset = () => {
    setForm(makeInitialForm(year, month, period));
    setErrors({});
  };

  const handleQcDevice = (value: string) => {
    set("device", value);
    const duration = QC_DURATIONS[value];
    if (duration) set("duration_minutes", String(duration));
  };

  const toggleDevice = (value: string) => {
    setForm((prev) => ({
      ...prev,
      devices: prev.devices.includes(value)
        ? prev.devices.filter((device) => device !== value)
        : [...prev.devices, value],
    }));
    setErrors((prev) => ({ ...prev, devices: "" }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    const result = schemas[taskType].safeParse(form);

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

      const res = await api.post(TASK_ENDPOINTS[taskType], payload);

      if (!res.ok) {
        console.error(res.body);
        toast.error("خطا در ثبت تسک");
        return;
      }

      toast.success("تسک با موفقیت ثبت شد");
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
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) reset();
        onOpenChange(value);
      }}
    >
      <DialogContent dir="rtl" className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            ثبت تسک جدید
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-5">
          <Tabs
            value={taskType}
            onValueChange={(value) => {
              setTaskType(value as TaskType);
              reset();
            }}
          >
            <TabsList className="grid h-auto w-full grid-cols-2 gap-2 bg-muted/50 p-1 sm:grid-cols-4">
              {TASK_TYPES.map((task) => (
                <TabsTrigger
                  key={task.value}
                  value={task.value}
                  className="flex items-center gap-1.5 rounded-md py-2 text-xs"
                >
                  {TASK_ICONS[task.value]}
                  {task.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="grid grid-cols-3 gap-3">
            <Field label="سال" error={errors.year}>
              <Input value={form.year} onChange={(e) => set("year", e.target.value)} />
            </Field>

            <Field label="ماه" error={errors.month}>
              <Select value={form.month} onValueChange={(value) => set("month", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>
                      {i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="دوره" error={errors.period}>
              <Select value={form.period} onValueChange={(value) => set("period", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">دهه اول</SelectItem>
                  <SelectItem value="2">دهه دوم</SelectItem>
                  <SelectItem value="3">دهه سوم</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          {taskType === "technical" && (
            <>
              <Field label="نام مشتری" error={errors.customer_name}>
                <Input
                  value={form.customer_name}
                  onChange={(e) => set("customer_name", e.target.value)}
                />
              </Field>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="دستگاه" error={errors.device}>
                  <Select value={form.device} onValueChange={(value) => set("device", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="انتخاب دستگاه" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEVICE_CHOICES.map((device) => (
                        <SelectItem key={device.value} value={device.value}>
                          {device.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="سطح پشتیبانی" error={errors.support_level}>
                  <Select
                    value={form.support_level}
                    onValueChange={(value) => set("support_level", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPORT_LEVELS.map((level) => (
                        <SelectItem key={level.value} value={String(level.value)}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <Field label="تاریخ تماس" error={errors.contact_date}>
                <Input
                  value={form.contact_date}
                  onChange={(e) => set("contact_date", e.target.value)}
                  placeholder="۱۴۰۵/۰۳/۰۱"
                />
              </Field>

              <Field label="علت تماس" error={errors.contact_reason}>
                <Textarea
                  value={form.contact_reason}
                  onChange={(e) => set("contact_reason", e.target.value)}
                  rows={2}
                  placeholder="علت تماس مشتری..."
                />
              </Field>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="وضعیت" error={errors.status}>
                  <Select
                    value={form.status}
                    onValueChange={(value) => set("status", value as "resolved" | "referred")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="resolved">برطرف شده</SelectItem>
                      <SelectItem value="referred">ارجاع داده شده</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                {form.status === "referred" && (
                  <Field label="ارجاع به واحد" error={errors.referred_to}>
                    <Select value={form.referred_to} onValueChange={(value) => set("referred_to", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="واحد مقصد" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEPARTMENT_CHOICES.map((department) => (
                          <SelectItem key={department.value} value={department.value}>
                            {department.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              </div>
            </>
          )}

          {taskType === "qc" && (
            <>
              <Field label="دستگاه" error={errors.device}>
                <Select value={form.device} onValueChange={handleQcDevice}>
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب دستگاه" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEVICE_CHOICES.filter((device) => device.value !== "printer").map((device) => (
                      <SelectItem key={device.value} value={device.value}>
                        {device.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="مدت زمان (دقیقه)" error={errors.duration_minutes}>
                  <Input
                    type="number"
                    value={form.duration_minutes}
                    onChange={(e) => set("duration_minutes", e.target.value)}
                  />
                </Field>

                <Field label="نتیجه" error={errors.passed}>
                  <Select
                    value={form.passed ? "pass" : "fail"}
                    onValueChange={(value) => set("passed", value === "pass")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pass">Pass ✓</SelectItem>
                      <SelectItem value="fail">Fail ✗</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              {!form.passed && (
                <Field label="علت Fail" error={errors.fail_reason}>
                  <Textarea
                    value={form.fail_reason}
                    onChange={(e) => set("fail_reason", e.target.value)}
                    rows={2}
                  />
                </Field>
              )}
            </>
          )}

          {taskType === "shipment" && (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="فامیل مشتری" error={errors.customer_last_name}>
                  <Input
                    value={form.customer_last_name}
                    onChange={(e) => set("customer_last_name", e.target.value)}
                  />
                </Field>

                <Field label="شماره پرونده" error={errors.order_number}>
                  <Input
                    value={form.order_number}
                    onChange={(e) => set("order_number", e.target.value)}
                  />
                </Field>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="تاریخ ارسال" error={errors.shipment_date}>
                  <Input
                    value={form.shipment_date}
                    onChange={(e) => set("shipment_date", e.target.value)}
                    placeholder="۱۴۰۵/۰۳/۰۱"
                  />
                </Field>

                <Field label="روش ارسال" error={errors.shipping_method}>
                  <Select
                    value={form.shipping_method}
                    onValueChange={(value) => set("shipping_method", value as "freight" | "tipax")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SHIPPING_METHODS.map((method) => (
                        <SelectItem key={method.value} value={method.value}>
                          {method.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <Field label="دستگاه‌های ارسالی" error={errors.devices}>
                <div className="mt-1 flex flex-wrap gap-2">
                  {DEVICE_CHOICES.map((device) => (
                    <button
                      key={device.value}
                      type="button"
                      onClick={() => toggleDevice(device.value)}
                      className={`rounded-full border px-3 py-1.5 text-xs transition ${
                        form.devices.includes(device.value)
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-muted-foreground hover:border-primary/60 hover:text-foreground"
                      }`}
                    >
                      {device.label}
                    </button>
                  ))}
                </div>
              </Field>
            </>
          )}

          {taskType === "internal" && (
            <>
              <Field label="شرح کار" error={errors.description}>
                <Textarea
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  rows={3}
                />
              </Field>

              <Field label="مدت زمان (دقیقه)" error={errors.duration_minutes}>
                <Input
                  type="number"
                  value={form.duration_minutes}
                  onChange={(e) => set("duration_minutes", e.target.value)}
                />
              </Field>
            </>
          )}

          <Field label="یادداشت (اختیاری)" error={errors.note}>
            <Textarea
              value={form.note}
              onChange={(e) => set("note", e.target.value)}
              rows={2}
              placeholder="توضیحات اضافی..."
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
              {busy ? "در حال ثبت..." : "ثبت تسک"}
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
