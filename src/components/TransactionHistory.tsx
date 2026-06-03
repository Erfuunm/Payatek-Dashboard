import { useApi } from "@/context/ApiProvider";

import { useEffect , useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { ok } from "assert";


interface Entry {
  id: number;
  transaction_type: "deposit" | "payment";
  entry_type: "real" | "forecast";
  category: string;
  amount: number;
  note?: string;
  year: number;
  month: number;
  period: 1 | 2 | 3;
}

export default function TransactionHistory() {
  const api = useApi();

  const [entries, setEntries] = useState<Entry[]>([]);
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [transactionType, setTransactionType] = useState("");
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [period, setPeriod] = useState("");

  const [selected, setSelected] = useState<Entry | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [debouncedSearch, setDebouncedSearch] = useState("");


  const pageSize = 10;
  const totalPages = Math.ceil(count / pageSize);

  useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedSearch(search);
  }, 400);

  return () => clearTimeout(timer);
}, [search]);


  const fetchEntries = async () => {

    debugger
    setLoading(true);

    try {
      const params = new URLSearchParams();
      params.append("page", String(page));

      if (debouncedSearch) {
  params.append("search", debouncedSearch);
}

      if (transactionType) params.append("transaction_type", transactionType);
      if (year) params.append("year", year);
      if (month) params.append("month", month);
      if (period) params.append("period", period);

      const response = await api.get(`/api/entries/?${params.toString()}`);

      setEntries(response.body.results || []);
      setCount(response.body.count || 0);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
}, [page, debouncedSearch, transactionType, year, month, period]);


  const handleDelete = async (id: number) => {
    const confirmed = window.confirm("آیا از حذف این رکورد مطمئن هستید؟");
    if (!confirmed) return;

    try {
      await api.delete(`/api/entries/${id}/`);
      fetchEntries();
    } catch (error) {
      console.error(error);
    }
  };

  const openEditModal = (entry: Entry) => {
    console.log(entry);
    setSelected(entry);
    setIsModalOpen(true);
  };

  const handleUpdate = async () => {
    if (!selected) return;

    debugger
    

    try {
     const res = await api.patch(`/api/entries/${selected.id}/`, {
        transaction_type: selected.transaction_type,
        entry_type: selected.entry_type,
        category: selected.category,
        amount: selected.amount,
        note: selected.note,
        year: selected.year,
        month: selected.month,
        period: selected.period,
      });

      if(res.ok === false){
  toast.error("درخواست شما ناموفق بود")
      }

      setIsModalOpen(false);
      fetchEntries();
    } catch (error) {
      console.error(error);
      toast.error("درخواست شما ناموفق بود")
    }
  };

  return (
    <div className="p-6">

<div className="flex items-center justify-between mb-6">
  <h2 className="text-xl font-semibold text-foreground">
    تاریخچه
  </h2>

  <button
    onClick={fetchEntries}
    className="p-2 rounded-lg border border-border hover:bg-muted transition hover:cursor-pointer"
  >
    <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
  </button>
</div>


      {/* Filters */}

<div className="grid md:grid-cols-5 gap-3 mb-6">

  <input
    type="text"
    placeholder="جستجو..."
    value={search}
    onChange={(e) => {
      setPage(1);
      setSearch(e.target.value);
    }}
    className="h-11 rounded-xl border border-input bg-background px-4"
  />

  {/* نوع تراکنش */}

  <Select
    value={transactionType || "all"}
    onValueChange={(v) => {
      setPage(1);
      setTransactionType(v === "all" ? "" : v);
    }}
  >
    <SelectTrigger className="h-11 rounded-xl">
      <SelectValue placeholder="همه" />
    </SelectTrigger>

    <SelectContent>
      <SelectItem value="all">همه</SelectItem>
      <SelectItem value="deposit">دریافت</SelectItem>

      
      <SelectItem value="payment">پرداخت</SelectItem>
    </SelectContent>
  </Select>

  <input
    type="number"
    placeholder="سال"
    value={year}
    onChange={(e) => {
      setPage(1);
      setYear(e.target.value);
    }}
    className="h-11 rounded-xl border border-input bg-background px-4"
  />

  {/* ماه */}

  <Select
    value={month || "all"}
    onValueChange={(v) => {
      setPage(1);
      setMonth(v === "all" ? "" : v);
    }}
  >
    <SelectTrigger className="h-11 rounded-xl">
      <SelectValue placeholder="همه ماه‌ها" />
    </SelectTrigger>

    <SelectContent>
      <SelectItem value="all">همه ماه‌ها</SelectItem>
      <SelectItem value="1">فروردین</SelectItem>
      <SelectItem value="2">اردیبهشت</SelectItem>
      <SelectItem value="3">خرداد</SelectItem>
      <SelectItem value="4">تیر</SelectItem>
      <SelectItem value="5">مرداد</SelectItem>
      <SelectItem value="6">شهریور</SelectItem>
      <SelectItem value="7">مهر</SelectItem>
      <SelectItem value="8">آبان</SelectItem>
      <SelectItem value="9">آذر</SelectItem>
      <SelectItem value="10">دی</SelectItem>
      <SelectItem value="11">بهمن</SelectItem>
      <SelectItem value="12">اسفند</SelectItem>
    </SelectContent>
  </Select>

  {/* دوره */}

  <Select
    value={period || "all"}
    onValueChange={(v) => {
      setPage(1);
      setPeriod(v === "all" ? "" : v);
    }}
  >
    <SelectTrigger className="h-11 rounded-xl">
      <SelectValue placeholder="همه دوره‌ها" />
    </SelectTrigger>

    <SelectContent>
      <SelectItem value="all">همه دوره‌ها</SelectItem>
      <SelectItem value="1">دهه اول</SelectItem>
      <SelectItem value="2">دهه دوم</SelectItem>
      <SelectItem value="3">دهه سوم</SelectItem>
    </SelectContent>
  </Select>

</div>


      <div className="bg-card border border-border rounded-xl shadow-[var(--shadow-card)] overflow-hidden">

        {loading ? (
          <div className="p-10 text-center text-muted-foreground w-full">
            در حال بارگذاری...
          </div>
        ) : (
          <div className="overflow-x-auto">

            <motion.table
           
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.35, ease: "easeOut" }}
              className="w-full text-sm"
            >
              <thead className="bg-muted text-muted-foreground">
     <tr className="text-right">
  <th className="p-4">سال</th>
  <th className="p-4">ماه</th>
  <th className="p-4">دوره</th>
  <th className="p-4">نوع</th>
  <th className="p-4">وضعیت</th>
  <th className="p-4">دسته</th>
  <th className="p-4">مبلغ</th>
  <th className="p-4">عملیات</th>
</tr>

              </thead>

              <tbody>
                {entries.map((entry) => (
                  <tr
                    key={entry.id}
                    className="border-t border-border text-right hover:bg-muted/40 transition"
                  >
                    <td className="p-4">{entry.year}</td>
                    <td className="p-4">{entry.month}</td>
                    <td className="p-4"> دوره {entry.period}</td>

                    <td className="p-4 ">
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          entry.transaction_type === "deposit"
                            ? "bg-[hsl(var(--success)/0.15)] text-[hsl(var(--success))]"
                            : "bg-[hsl(var(--destructive)/0.15)] text-[hsl(var(--destructive))]"
                        }`}
                      >
                        {entry.transaction_type === "deposit"
                          ? "دریافت"
                          : "پرداخت"}
                      </span>
                    </td>

                    <td className="p-4">
  <span
    className={`px-2 py-1 text-xs rounded ${
      entry.entry_type === "real"
        ? "bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]"
        : "bg-[hsl(var(--warning)/0.15)] text-[hsl(var(--warning))]"
    }`}
  >
    {entry.entry_type === "real" ? "واقعی" : "پیش‌بینی"}
  </span>
</td>


                    <td className="p-4 ">{entry.category}</td>

                    <td className="p-4 font-medium">
                      {entry.amount.toLocaleString()} تومان
                    </td>

                    <td className="p-4 flex justify-start gap-2 ">

                      <button
                        onClick={() => openEditModal(entry)}
                        className="px-3 py-1 text-xs rounded bg-primary text-black hover:opacity-90 transition"
                      >
                        ویرایش
                      </button>

                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="px-3 py-1 text-xs rounded bg-destructive text-destructive-foreground hover:opacity-90 transition"
                      >
                        حذف
                      </button>

                    </td>
                  </tr>
                ))}
              </tbody>

            </motion.table>
          </div>
        )}
      </div>

      {/* Pagination */}

      <div className="flex justify-center items-center gap-6 mt-6">

        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded disabled:opacity-40 hover:opacity-90 transition"
        >
          قبلی
        </button>

        <motion.span
         
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-muted-foreground"
        >
          صفحه {page} از {totalPages || 1}
        </motion.span>

        <button
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded disabled:opacity-40 hover:opacity-90 transition"
        >
          بعدی
        </button>

      </div>

      {/* Edit Modal */}

     <AnimatePresence>
  {isModalOpen && selected && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-2xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
      >

        {/* Header */}

        <div className="border-b border-border px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-foreground">
              ویرایش تراکنش
            </h3>

            <p className="text-sm text-muted-foreground mt-1">
              اطلاعات تراکنش را بروزرسانی کنید
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(false)}
            className="h-9 w-9 rounded-lg hover:bg-muted transition flex items-center justify-center text-muted-foreground"
          >
            ✕
          </button>
        </div>

        {/* Body */}

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                سال
              </label>

              <input
                type="number"
                value={selected.year}
                onChange={(e) =>
                  setSelected({
                    ...selected,
                    year: Number(e.target.value),
                  })
                }
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                ماه
              </label>

              <input
                type="number"
                value={selected.month}
                onChange={(e) =>
                  setSelected({
                    ...selected,
                    month: Number(e.target.value),
                  })
                }
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

<div className="space-y-2">
  <label className="text-sm text-muted-foreground">
    دوره
  </label>

  <Select
    value={String(selected.period)}
    onValueChange={(v) =>
      setSelected({
        ...selected,
        period: Number(v) as 1 | 2 | 3,
      })
    }
  >
    <SelectTrigger className="h-12 rounded-xl border-input bg-background">
      <SelectValue placeholder="انتخاب دوره" />
    </SelectTrigger>

    <SelectContent>
      <SelectItem value="1">دهه اول</SelectItem>
      <SelectItem value="2">دهه دوم</SelectItem>
      <SelectItem value="3">دهه سوم</SelectItem>
    </SelectContent>
  </Select>
</div>


          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                دسته‌بندی
              </label>

              <input
                type="text"
                readOnly
                value={selected.category}
                onChange={(e) =>
                  setSelected({
                    ...selected,
                    category: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                مبلغ
              </label>

              <input
                type="number"
                value={selected.amount}
                onChange={(e) =>
                  setSelected({
                    ...selected,
                    amount: Number(e.target.value),
                  })
                }
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

          </div>

          {/* Note */}

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              توضیحات
            </label>

            <textarea
              value={selected.note || ""}
              onChange={(e) =>
                setSelected({
                  ...selected,
                  note: e.target.value,
                })
              }
              placeholder="توضیحات تراکنش را وارد کنید..."
              rows={6}
              className="w-full resize-none rounded-2xl border border-input bg-background px-4 py-4 text-foreground outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

        </div>

        {/* Footer */}

        <div className="border-t border-border px-6 py-4 flex items-center justify-end gap-3 bg-muted/30">

          <button
            onClick={() => setIsModalOpen(false)}
            className="px-5 py-2.5 rounded-xl bg-secondary text-secondary-foreground hover:opacity-90 transition"
          >
            انصراف
          </button>

          <button
            onClick={handleUpdate}
            className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition font-medium"
          >
            ذخیره تغییرات
          </button>

        </div>

      </motion.div>
    </motion.div>
  )}
</AnimatePresence>

    </div>
  );
}
