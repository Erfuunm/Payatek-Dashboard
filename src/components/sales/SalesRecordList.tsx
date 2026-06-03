import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useApi } from "@/context/ApiProvider";
import { formatNumber, formatToman } from "@/lib/departments";
import {
  choiceLabel,
  CUSTOMER_GROUPS,
  SALES_DEVICES,
  SALES_ENDPOINTS,
  SALES_SOURCES,
} from "@/lib/sales";

import type { SalesEntryRecord } from "./SalesEntryPanel";
import type { SalesLeadRecord } from "./SalesLeadPanel";

type Props = {
  type: "sales" | "leads";
  year: string;
  month: string;
  period: string;
  refreshKey: number;
  onChanged: () => void;
  onEditSale?: (item: SalesEntryRecord) => void;
  onEditLead?: (item: SalesLeadRecord) => void;
};

type PaginatedResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: any[];
};

const PAGE_SIZE = 10;

export function SalesRecordList({
  type,
  year,
  month,
  period,
  refreshKey,
  onChanged,
  onEditSale,
  onEditLead,
}: Props) {
  const api = useApi();

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [next, setNext] = useState<string | null>(null);
  const [previous, setPrevious] = useState<string | null>(null);

  const endpoint = type === "sales" ? SALES_ENDPOINTS.entries : SALES_ENDPOINTS.leads;
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [type, year, month, period]);

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

        const body = res.body as PaginatedResponse | any[];

        if (Array.isArray(body)) {
          setItems(body);
          setCount(body.length);
          setNext(null);
          setPrevious(null);
        } else {
          setItems(body?.results || []);
          setCount(Number(body?.count || 0));
          setNext(body?.next || null);
          setPrevious(body?.previous || null);
        }

        setLoading(false);
      })
      .catch(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [api, endpoint, year, month, period, refreshKey, page]);

  const remove = async (id: number) => {
    if (!confirm("این رکورد حذف شود؟")) return;

    const res = await api.delete(`${endpoint}${id}/`);

    if (res.ok) {
      toast.success("رکورد حذف شد");
      setItems((prev) => prev.filter((item) => item.id !== id));
      onChanged();
    } else {
      toast.error("خطا در حذف رکورد");
    }
  };

  if (loading) {
    return (
      <div className="card-elegant grid place-items-center rounded-2xl py-12 text-muted-foreground animate-pulse">
        در حال بارگذاری...
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="card-elegant grid place-items-center rounded-2xl py-12 text-center">
        <p className="text-muted-foreground">برای این دوره هنوز رکوردی ثبت نشده است.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {items.map((item) =>
          type === "sales" ? (
            <SalesRow
              key={item.id}
              item={item}
              onEdit={() => onEditSale?.(item)}
              onDelete={() => remove(item.id)}
            />
          ) : (
            <LeadRow
              key={item.id}
              item={item}
              onEdit={() => onEditLead?.(item)}
              onDelete={() => remove(item.id)}
            />
          )
        )}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-muted-foreground">
          صفحه <span className="num-fa font-semibold text-foreground">{formatNumber(page)}</span> از{" "}
          <span className="num-fa font-semibold text-foreground">{formatNumber(totalPages)}</span>
          <span className="mx-2 text-border">|</span>
          مجموع رکوردها: <span className="num-fa font-semibold text-foreground">{formatNumber(count)}</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!previous || page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronRight className="ml-1 h-4 w-4" />
            قبلی
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!next || page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            بعدی
            <ChevronLeft className="mr-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function SalesRow({
  item,
  onEdit,
  onDelete,
}: {
  item: SalesEntryRecord;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const deviceLabel = item.device_label ?? choiceLabel(SALES_DEVICES, item.device);
  const sourceLabel = item.source_label ?? choiceLabel(SALES_SOURCES, item.source);
  const groupLabel = item.customer_group_label ?? choiceLabel(CUSTOMER_GROUPS, item.customer_group);

  return (
    <div className="card-elegant flex items-start justify-between gap-4 rounded-2xl border border-border/70 bg-card/80 p-4 transition hover:-translate-y-0.5 hover:bg-muted/25">
      <div className="min-w-0 flex-1 space-y-1">
        <div className="font-semibold text-foreground">
          {deviceLabel} — {formatNumber(item.quantity)} عدد
        </div>

        <div className="text-sm text-muted-foreground">
          منبع: {sourceLabel} · گروه مشتری: {groupLabel}
        </div>

        <div className="text-sm text-muted-foreground">
          مبلغ: {formatToman(Number(item.amount || 0))}
          {item.sale_date ? ` · تاریخ: ${item.sale_date}` : ""}
        </div>

        {item.note && (
          <div className="mt-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
            {item.note}
          </div>
        )}
      </div>

      <RowActions onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
}

function LeadRow({
  item,
  onEdit,
  onDelete,
}: {
  item: SalesLeadRecord;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const deviceLabel = item.device_label ?? choiceLabel(SALES_DEVICES, item.device);
  const sourceLabel = item.source_label ?? choiceLabel(SALES_SOURCES, item.source);

  return (
    <div className="card-elegant flex items-start justify-between gap-4 rounded-2xl border border-border/70 bg-card/80 p-4 transition hover:-translate-y-0.5 hover:bg-muted/25">
      <div className="min-w-0 flex-1 space-y-1">
        <div className="font-semibold text-foreground">
          {deviceLabel} — {formatNumber(item.lead_count)} لید
        </div>

        <div className="text-sm text-muted-foreground">منبع: {sourceLabel}</div>

        {item.note && (
          <div className="mt-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
            {item.note}
          </div>
        )}
      </div>

      <RowActions onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
}

function RowActions({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <button
        onClick={onEdit}
        className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-primary/10 hover:text-primary"
        aria-label="ویرایش"
      >
        <Edit2 className="h-4 w-4" />
      </button>

      <button
        onClick={onDelete}
        className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
        aria-label="حذف"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
