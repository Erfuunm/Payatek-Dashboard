import { useEffect, useState } from "react";

import { useApi } from "@/context/ApiProvider";
import { RND_ENDPOINTS } from "@/lib/rnd";
import { GanttTimeline, type GanttItem } from "@/components/shared/GanttTimeline";
import type { RndTaskRecord } from "./RndTaskPanel";

type Props = {
  year: string;
  month: string;
  period: string;
  refreshKey: number;
};

type RndGanttTask = RndTaskRecord & {
  updates?: GanttItem["updates"];
};

export function RndGantt({ year, month, period, refreshKey }: Props) {
  const api = useApi();
  const [items, setItems] = useState<RndGanttTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);

    const params = new URLSearchParams({
      year,
      month,
      period,
      no_paginate: "true",
    });

    api
      .get(`${RND_ENDPOINTS.tasks}?${params.toString()}`)
      .then((res) => {
        if (!alive) return;

        const body = res.body;
        const list = Array.isArray(body) ? body : body?.results || [];

        setItems(list);
        setLoading(false);
      })
      .catch(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [api, year, month, period, refreshKey]);

  return (
    <GanttTimeline
      title="گانت چارت تحقیق و توسعه"
      subtitle="نمای زمان‌بندی کارها، درصد پیشرفت، وضعیت و آخرین گزارش روزانه هر فعالیت"
      metaTitle="دسته‌بندی"
      loading={loading}
      emptyMessage="برای این دوره هنوز کاری جهت نمایش در گانت تحقیق و توسعه ثبت نشده است."
      items={items.map((item) => ({
        id: item.id,
        title: item.title,
        metaLabel: item.category_label || item.category,
        start_date: item.start_date,
        end_date: item.end_date,
        progress_percent: item.progress_percent,
        status: item.status,
        status_label: item.status_label,
        priority: item.priority,
        priority_label: item.priority_label,
        description: item.description,
        updates: item.updates,
      }))}
    />
  );
}
