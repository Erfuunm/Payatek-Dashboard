export type SalesDeviceCode =
  | "pressure"
  | "posture"
  | "gait"
  | "body_3d"
  | "plantar_2d"
  | "plantar_3d";

export type SalesSourceCode =
  | "site_call"
  | "instagram"
  | "exhibition"
  | "repeat_purchase"
  | "referral";

export type CustomerGroupCode =
  | "orthotics"
  | "corrective"
  | "physiotherapy"
  | "shoes"
  | "medical_equipment"
  | "governmental"
  | "occupational_medicine"
  | "orthopedist"
  | "sports";

export type SalesTab = "sales" | "leads";

export const SALES_DEVICES: { value: SalesDeviceCode; label: string }[] = [
  { value: "pressure", label: "فشار" },
  { value: "posture", label: "پاسچر" },
  { value: "gait", label: "گیت" },
  { value: "body_3d", label: "سه‌بعدی بدن" },
  { value: "plantar_2d", label: "دوبعدی کف پا" },
  { value: "plantar_3d", label: "سه‌بعدی کف پا" },
];

export const SALES_SOURCES: { value: SalesSourceCode; label: string }[] = [
  { value: "site_call", label: "سایت / تماس" },
  { value: "instagram", label: "اینستاگرام" },
  { value: "exhibition", label: "نمایشگاه" },
  { value: "repeat_purchase", label: "تکرار خرید" },
  { value: "referral", label: "معرفی" },
];

export const CUSTOMER_GROUPS: { value: CustomerGroupCode; label: string }[] = [
  { value: "orthotics", label: "ارتز و پروتز" },
  { value: "corrective", label: "اصلاحی" },
  { value: "physiotherapy", label: "فیزیوتراپی" },
  { value: "shoes", label: "کفش" },
  { value: "medical_equipment", label: "تجهیزات پزشکی" },
  { value: "governmental", label: "دولتی" },
  { value: "occupational_medicine", label: "طب کار" },
  { value: "orthopedist", label: "ارتوپد" },
  { value: "sports", label: "ورزشی" },
];

export const SALES_ENDPOINTS = {
  entries: "/api/sales/entries/",
  leads: "/api/sales/leads/",
  targets: "/api/sales/targets/",
  summary: "/api/sales/summary/",
};

export function choiceLabel<T extends string>(
  choices: { value: T; label: string }[],
  value?: string | null
) {
  return choices.find((c) => c.value === value)?.label ?? value ?? "—";
}

export function salesDeviceLabel(value?: string | null) {
  return SALES_DEVICES.find((d) => d.value === value)?.label ?? value ?? "—";
}

export function salesSourceLabel(value?: string | null) {
  return SALES_SOURCES.find((s) => s.value === value)?.label ?? value ?? "—";
}

export function customerGroupLabel(value?: string | null) {
  return CUSTOMER_GROUPS.find((g) => g.value === value)?.label ?? value ?? "—";
}