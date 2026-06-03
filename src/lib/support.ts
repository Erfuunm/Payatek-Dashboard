export type TaskType = "technical" | "qc" | "shipment" | "internal";

export const TASK_TYPES: { value: TaskType; label: string }[] = [
  { value: "technical", label: "پشتیبانی فنی" },
  { value: "qc",        label: "کیوسی دستگاه" },
  { value: "shipment",  label: "ارسال دستگاه" },
  { value: "internal",  label: "کارهای داخلی" },
];

export const DEVICE_CHOICES = [
  { value: "printer",  label: "پرینتر" },
  { value: "gate",     label: "گیت" },
  { value: "posture",  label: "پاسچر" },
  { value: "pressure", label: "فشار" },
  { value: "body_3d",  label: "سه‌بعدی بدن" },
  { value: "scanner",  label: "اسکنر" },
] as const;

export const SUPPORT_LEVELS = [
  { value: 1, label: "سطح ۱ — تا ۱۵ دقیقه" },
  { value: 2, label: "سطح ۲ — تا ۳۰ دقیقه" },
  { value: 3, label: "سطح ۳ — تا ۶۰ دقیقه" },
] as const;

export const SHIPPING_METHODS = [
  { value: "freight", label: "باربری" },
  { value: "tipax",   label: "تیپاکس" },
] as const;

// زمان استاندارد QC هر دستگاه (دقیقه)
export const QC_DURATIONS: Record<string, number> = {
  posture:  30,
  pressure: 60,
  gate:     60,
  body_3d:  60,
  scanner:  30,
  printer:  0,   // پرینتر QC ندارد
};

export const DEPARTMENT_CHOICES = [
  { value: "financial", label: "مالی" },
  { value: "sales", label: "فروش" },
  { value: "support", label: "پشتیبانی" },
  { value: "rnd", label: "تحقیق و توسعه" },
  { value: "production", label: "تولید" },
] as const;

export type DepartmentChoice = typeof DEPARTMENT_CHOICES[number]["value"];

export const TASK_ENDPOINTS: Record<TaskType, string> = {
  technical: "/api/support/technical/",
  qc:        "/api/support/qc/",
  shipment:  "/api/support/shipment/",
  internal:  "/api/support/internal/",
};
