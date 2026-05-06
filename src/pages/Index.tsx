import { useState } from "react";
import { Navigate } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { useAuth } from "@/hooks/useAuth";
import { DEPARTMENTS, departmentLabel, type DepartmentCode } from "@/lib/departments";
import { DepartmentCharts } from "@/components/DepartmentCharts";
import { EntryPanel } from "@/components/EntryPanel";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Building2, ShieldCheck, Plus } from "lucide-react";

export default function Dashboard() {
  const { user, loading, profile, isAdmin } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeDept, setActiveDept] = useState<DepartmentCode>("financial");
  const [openEntry, setOpenEntry] = useState(false);

  if (!loading && !user) return <Navigate to="/auth" replace />;

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center text-muted-foreground">در حال بارگذاری…</div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-background">
      <AppHeader />
      <main className="container py-8">
        {isAdmin ? (
          <section>
            <PageTitle
              icon={<ShieldCheck className="h-6 w-6" />}
              title="پنل مدیر — نمودارهای واحدها"
              subtitle="با انتخاب هر واحد، نمودارهای آن واحد را ببینید."
            />
            <Tabs value={activeDept} onValueChange={(v) => setActiveDept(v as DepartmentCode)}>
              <TabsList className="mb-6 grid h-auto w-full grid-cols-2 gap-2 bg-transparent p-0 sm:grid-cols-3 lg:grid-cols-5">
                {DEPARTMENTS.map((d) => (
                  <TabsTrigger
                    key={d.code}
                    value={d.code}
                    className="data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground rounded-lg border bg-card px-4 py-3"
                  >
                    {d.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {DEPARTMENTS.map((d) => (
                <TabsContent key={d.code} value={d.code} className="mt-0">
                  <DepartmentCharts department={d.code} />
                </TabsContent>
              ))}
            </Tabs>
          </section>
        ) : profile?.department ? (
          <section className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <PageTitle
                icon={<Building2 className="h-6 w-6" />}
                title={departmentLabel(profile.department)}
                subtitle="نمای کلی، نمودارها و ثبت اطلاعات واحد شما"
              />
              <Button
                onClick={() => setOpenEntry(true)}
                size="lg"
                className="gradient-primary text-primary-foreground hover:opacity-95 shadow-[var(--shadow-elegant)]"
              >
                <Plus className="ml-2 h-5 w-5" /> ثبت رکورد جدید
              </Button>
            </div>
            <div key={refreshKey}>
              <DepartmentCharts department={profile.department} />
            </div>
            <EntryPanel
              department={profile.department}
              userId={user!.id}
              open={openEntry}
              onOpenChange={setOpenEntry}
              onSaved={() => setRefreshKey((k) => k + 1)}
            />
          </section>
        ) : (
          <div className="card-elegant grid place-items-center px-6 py-16 text-center">
            <p className="text-muted-foreground">واحد سازمانی شما هنوز تنظیم نشده است. لطفاً با مدیر سیستم تماس بگیرید.</p>
          </div>
        )}
      </main>
    </div>
  );
}

function PageTitle({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="mb-6 flex items-start gap-3">
      <div className="grid h-11 w-11 place-items-center rounded-xl gradient-primary text-primary-foreground shadow-[var(--shadow-elegant)]">
        {icon}
      </div>
      <div>
        <h1 className="text-2xl font-extrabold">{title}</h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}
