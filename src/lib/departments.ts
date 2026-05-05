export type DepartmentCode = "financial" | "sales" | "support" | "rnd" | "production";

export const DEPARTMENTS: { code: DepartmentCode; label: string; description: string }[] = [
  { code: "financial", label: "واحد مالی", description: "دریافت‌ها، پرداخت‌ها و موجودی" },
  { code: "sales", label: "واحد فروش", description: "فروش، سفارشات و مشتریان" },
  { code: "support", label: "واحد پشتیبانی", description: "تیکت‌ها و خدمات پس از فروش" },
  { code: "rnd", label: "تحقیق و توسعه", description: "پروژه‌ها و نوآوری" },
  { code: "production", label: "خط تولید", description: "تولید و موجودی انبار" },
];

export const departmentLabel = (code: DepartmentCode | null | undefined) =>
  DEPARTMENTS.find((d) => d.code === code)?.label ?? "—";

// دسته‌بندی‌های واحد مالی
export const FINANCE_DEPOSIT_CATEGORIES = [
  "گوشواره، پروتزها، چاپگرها",
  "تسهیلات",
  "پشتیبانی",
  "تأسیسات / وام",
];

export const FINANCE_PAYMENT_CATEGORIES = [
  "پروتز اورتز",
  "پرینتر",
  "تیسولز",
  "اداری",
  "عمومی",
  "دفاتر خارجی",
];

// دسته‌های پیش‌فرض برای سایر واحدها
export const DEFAULT_DEPOSIT_CATEGORIES = ["دریافت اصلی", "متفرقه"];
export const DEFAULT_PAYMENT_CATEGORIES = ["پرداخت اصلی", "متفرقه"];

export function getCategories(dep: DepartmentCode, kind: "deposit" | "payment") {
  if (dep === "financial") {
    return kind === "deposit" ? FINANCE_DEPOSIT_CATEGORIES : FINANCE_PAYMENT_CATEGORIES;
  }
  return kind === "deposit" ? DEFAULT_DEPOSIT_CATEGORIES : DEFAULT_PAYMENT_CATEGORIES;
}

export const formatToman = (n: number) =>
  new Intl.NumberFormat("fa-IR").format(Math.round(n)) + " تومان";

export const formatNumber = (n: number) =>
  new Intl.NumberFormat("fa-IR").format(Math.round(n));
