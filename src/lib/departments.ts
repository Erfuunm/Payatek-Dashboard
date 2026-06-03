export type DepartmentCode =
  | "financial"
  | "sales"
  | "support"
  | "rnd"
  | "production";

export const DEPARTMENTS: {
  code: DepartmentCode;
  label: string;
  description: string;
}[] = [
  { code: "financial", label: "واحد مالی", description: "دریافت‌ها، پرداخت‌ها و موجودی" },
  { code: "sales", label: "واحد فروش", description: "فروش، سفارشات و مشتریان" },
  { code: "support", label: "واحد پشتیبانی", description: "تیکت‌ها و خدمات پس از فروش" },
  { code: "rnd", label: "تحقیق و توسعه", description: "پروژه‌ها و نوآوری" },
  { code: "production", label: "خط تولید", description: "تولید و موجودی انبار" },
];

export const departmentLabel = (code: DepartmentCode | null | undefined) =>
  DEPARTMENTS.find((d) => d.code === code)?.label ?? "—";


/* -------------------------------- */
/* دسته‌بندی‌های هر دپارتمان */
/* -------------------------------- */

export const DEPARTMENT_CATEGORIES: Record<
  DepartmentCode,
  {
    deposit: string[];
    payment: string[];
  }
> = {

  financial: {
    deposit: [
      "ارتز پروتز",
      "پرینتر",
      "تسهیلات",
      "تیسولز",
      "پشتیبانی",
      "وام",
    ],
    payment: [
      "ارتز پروتز",
      "پرینتر",
      "تیسولز",
      "عمومی",
      "دفاتر خارجی",
    ],
  },

  sales: {
    deposit: [
      "فروش نقدی",
      "فروش آنلاین",
      "قراردادها",
      "متفرقه",
    ],
    payment: [
      "پورسانت فروش",
      "تبلیغات",
      "بازاریابی",
      "متفرقه",
    ],
  },

  support: {
    deposit: [
      "قرارداد پشتیبانی",
      "تمدید خدمات",
      "متفرقه",
    ],
    payment: [
      "هزینه نیرو پشتیبانی",
      "ابزار پشتیبانی",
      "سرور و زیرساخت",
      "متفرقه",
    ],
  },

  rnd: {
    deposit: [
      "بودجه تحقیقاتی",
      "سرمایه گذاری",
      "متفرقه",
    ],
    payment: [
      "حقوق تیم تحقیق",
      "خرید تجهیزات",
      "نمونه سازی",
      "متفرقه",
    ],
  },

  production: {
    deposit: [
      "فروش محصول",
      "سفارش کارخانه",
      "متفرقه",
    ],
    payment: [
      "مواد اولیه",
      "حقوق کارگران",
      "نگهداری دستگاه",
      "متفرقه",
    ],
  },

};


/* -------------------------------- */
/* گرفتن دسته‌بندی بر اساس دپارتمان */
/* -------------------------------- */

export function getCategories(
  dep: DepartmentCode,
  kind: "deposit" | "payment"
) {
  return DEPARTMENT_CATEGORIES[dep]?.[kind] ?? [];
}


/* -------------------------------- */
/* فرمت اعداد */
/* -------------------------------- */

export const formatToman = (n: number) =>
  new Intl.NumberFormat("fa-IR").format(Math.round(n)) + " تومان";

export const formatNumber = (n: number) =>
  new Intl.NumberFormat("fa-IR").format(Math.round(n));
