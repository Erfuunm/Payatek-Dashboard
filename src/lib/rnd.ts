export const RND_ENDPOINTS = {
  tasks: "/api/rnd/tasks/",
  taskUpdates: "/api/rnd/task-updates/",
  summary: "/api/rnd/summary/",
  gantt: "/api/rnd/gantt/",
};

export const RND_CATEGORIES = [
  { value: "research", label: "تحقیق" },
  { value: "design", label: "طراحی" },
  { value: "prototype", label: "نمونه‌سازی" },
  { value: "test", label: "تست و آزمایش" },
  { value: "improvement", label: "بهبود محصول" },
  { value: "documentation", label: "مستندسازی" },
  { value: "software", label: "نرم‌افزار" },
  { value: "hardware", label: "سخت‌افزار" },
] as const;

export const RND_TASK_STATUSES = [
  { value: "planned", label: "برنامه‌ریزی شده" },
  { value: "doing", label: "در حال انجام" },
  { value: "done", label: "انجام شده" },
  { value: "blocked", label: "متوقف شده" },
  { value: "cancelled", label: "لغو شده" },
] as const;

export const RND_TASK_PRIORITIES = [
  { value: "low", label: "کم" },
  { value: "normal", label: "معمولی" },
  { value: "high", label: "زیاد" },
  { value: "urgent", label: "فوری" },
] as const;

export type RndCategory = typeof RND_CATEGORIES[number]["value"];
export type RndTaskStatus = typeof RND_TASK_STATUSES[number]["value"];
export type RndTaskPriority = typeof RND_TASK_PRIORITIES[number]["value"];

export function choiceLabel<T extends readonly { value: string; label: string }[]>(list: T, value?: string | null) {
  return list.find((item) => item.value === value)?.label ?? value ?? "-";
}
