import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Trash2, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useApi } from "@/context/ApiProvider";
import { DEVICE_CHOICES, TASK_ENDPOINTS, type TaskType } from "@/lib/support";

interface Props {
  taskType: TaskType;
  year: string;
  month: string;
  period: string;
  refreshKey: number;
}

type PaginatedResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: any[];
};

const PAGE_SIZE = 10;

export function SupportTaskList({ taskType, year, month, period, refreshKey }: Props) {
  const api = useApi();

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [isPaginated, setIsPaginated] = useState(false);

  const endpoint = TASK_ENDPOINTS[taskType];

  useEffect(() => {
    setPage(1);
  }, [taskType, year, month, period]);

  useEffect(() => {
    let alive = true;
    setLoading(true);

    const params = new URLSearchParams({
      year,
      month,
      period,
      page: String(page),
    });

    api
      .get(`${endpoint}?${params.toString()}`)
      .then((res) => {
        if (!alive) return;

        if (Array.isArray(res.body)) {
          setItems(res.body);
          setCount(res.body.length);
          setIsPaginated(false);
        } else {
          const body = res.body as PaginatedResponse;
          const list = Array.isArray(body?.results) ? body.results : [];
          setItems(list);
          setCount(Number(body?.count || list.length));
          setIsPaginated(true);
        }

        setLoading(false);
      })
      .catch(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [api, endpoint, year, month, period, page, refreshKey]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(count / PAGE_SIZE));
  }, [count]);

  const handleDelete = async (id: number) => {
    if (!confirm("این تسک حذف شود؟")) return;

    const res = await api.delete(`${endpoint}${id}/`);

    if (res.ok) {
      toast.success("تسک حذف شد");
      setItems((prev) => prev.filter((item) => item.id !== id));
      setCount((prev) => Math.max(0, prev - 1));
    } else {
      toast.error("خطا در حذف");
    }
  };

  if (loading) {
    return (
      <div className="grid place-items-center py-12 text-muted-foreground animate-pulse">
        در حال بارگذاری...
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="card-elegant grid place-items-center py-12 text-center">
        <p className="text-muted-foreground">هیچ تسکی برای این دوره ثبت نشده است.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3">
        {items.map((item) => (
          <TaskRow
            key={item.id}
            item={item}
            taskType={taskType}
            onDelete={() => handleDelete(item.id)}
          />
        ))}
      </div>

      {isPaginated && totalPages > 1 && (
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-muted-foreground">
            صفحه <span className="num-fa font-semibold text-foreground">{page}</span> از{" "}
            <span className="num-fa font-semibold text-foreground">{totalPages}</span> — مجموع{" "}
            <span className="num-fa font-semibold text-foreground">{formatNumber(count)}</span> رکورد
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              قبلی
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            >
              بعدی
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskRow({
  item,
  taskType,
  onDelete,
}: {
  item: any;
  taskType: TaskType;
  onDelete: () => void;
}) {
  const deviceLabel =
    DEVICE_CHOICES.find((device) => device.value === item.device)?.label ?? item.device ?? "—";

  return (
    <div className="card-elegant flex items-start justify-between gap-4 p-4 transition hover:bg-muted/20">
      <div className="min-w-0 flex-1 space-y-1">
        {taskType === "technical" && (
          <>
            <div className="font-semibold text-foreground">{item.customer_name}</div>
            <div className="text-sm text-muted-foreground">
              {deviceLabel} · سطح {item.support_level} · {item.contact_date}
            </div>
            <div className="truncate text-xs text-muted-foreground">{item.contact_reason}</div>
            <StatusBadge
              ok={item.status === "resolved"}
              label={
                item.status === "resolved"
                  ? "برطرف شده"
                  : `ارجاع به ${item.referred_to ?? "—"}`
              }
            />
          </>
        )}

        {taskType === "qc" && (
          <>
            <div className="font-semibold text-foreground">{deviceLabel}</div>
            <div className="text-sm text-muted-foreground">{formatNumber(item.duration_minutes)} دقیقه</div>
            <StatusBadge ok={item.passed} label={item.passed ? "Pass" : "Fail"} />
            {!item.passed && item.fail_reason && (
              <div className="text-xs text-destructive">{item.fail_reason}</div>
            )}
          </>
        )}

        {taskType === "shipment" && (
          <>
            <div className="font-semibold text-foreground">{item.customer_last_name}</div>
            <div className="text-sm text-muted-foreground">
              پرونده: {item.order_number} ·{" "}
              {item.shipping_method === "freight" ? "باربری" : "تیپاکس"}
            </div>
            <div className="text-xs text-muted-foreground">
              دستگاه‌ها: {formatDevices(item.devices)}
            </div>
          </>
        )}

        {taskType === "internal" && (
          <>
            <div className="font-semibold text-foreground">{item.description}</div>
            <div className="text-sm text-muted-foreground">{formatNumber(item.duration_minutes)} دقیقه</div>
          </>
        )}

        {item.note && (
          <div className="mt-2 border-t border-border pt-2 text-xs text-muted-foreground">
            {item.note}
          </div>
        )}
      </div>

      <button
        onClick={onDelete}
        className="mt-1 shrink-0 rounded-lg p-2 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
        aria-label="حذف تسک"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
        ok
          ? "bg-emerald-500/10 text-emerald-500"
          : "bg-rose-500/10 text-rose-500"
      }`}
    >
      {ok ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
      {label}
    </span>
  );
}

function formatDevices(devices: string[] | undefined) {
  if (!devices?.length) return "—";

  return devices
    .map((device) => DEVICE_CHOICES.find((item) => item.value === device)?.label ?? device)
    .join("، ");
}

function formatNumber(value: number | string) {
  return Number(value || 0).toLocaleString("fa-IR");
}
