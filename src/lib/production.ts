export const PRODUCTION_ENDPOINTS = {
  forecasts: "/api/production/forecasts/",
  entries: "/api/production/entries/",
  tasks: "/api/production/tasks/",
  taskUpdates: "/api/production/task-updates/",
  summary: "/api/production/summary/",
  gantt: "/api/production/gantt/",
};

export const PRODUCTION_DEVICES = [
  { value: "pressure", label: "فشار" },
  { value: "gait_2", label: "گیت ۲" },
  { value: "gait_1_2", label: "گیت ۱.۲" },
  { value: "plantar", label: "پلنتار" },
  { value: "plantar_2d", label: "دو‌بعدی" },
  { value: "posture", label: "پاسچر" },
  { value: "printer", label: "پرینتر" },
  { value: "body_3d", label: "سه‌بعدی بدن" },
  { value: "plantar_3d", label: "سه‌بعدی کف پا" },
] as const;

export const TASK_STATUSES = [
  { value: "planned", label: "برنامه‌ریزی شده" },
  { value: "doing", label: "در حال انجام" },
  { value: "done", label: "انجام شده" },
  { value: "blocked", label: "متوقف شده" },
  { value: "cancelled", label: "لغو شده" },
] as const;

export const TASK_PRIORITIES = [
  { value: "low", label: "کم" },
  { value: "normal", label: "معمولی" },
  { value: "high", label: "زیاد" },
  { value: "urgent", label: "فوری" },
] as const;

export type ProductionDevice = typeof PRODUCTION_DEVICES[number]["value"];
export type TaskStatus = typeof TASK_STATUSES[number]["value"];
export type TaskPriority = typeof TASK_PRIORITIES[number]["value"];

export function choiceLabel<T extends readonly { value: string; label: string }[]>(list: T, value?: string | null) {
  return list.find((item) => item.value === value)?.label ?? value ?? "-";
}
