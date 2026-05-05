import { useState } from "react";
import { Navigate } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { useAuth } from "@/hooks/useAuth";
import { DEPARTMENTS, departmentLabel, type DepartmentCode } from "@/lib/departments";
import { DepartmentCharts } from "@/components/DepartmentCharts";
import { EntryPanel } from "@/components/EntryPanel";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Building2, ShieldCheck } from "lucide-react";

export default function Dashboard() {
  const { user, loading, profile, isAdmin } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeDept, setActiveDept] = useState<DepartmentCode>("financial");

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
          <section className="grid gap-6 lg:grid-cols-[420px_1fr]">
            <div>
              <PageTitle
                icon={<Building2 className="h-6 w-6" />}
                title={departmentLabel(profile.department)}
                subtitle="ثبت اطلاعات و مشاهده وضعیت واحد شما"
              />
              <EntryPanel
                department={profile.department}
                userId={user!.id}
                onSaved={() => setRefreshKey((k) => k + 1)}
              />
            </div>
            <div key={refreshKey}>
              <DepartmentCharts department={profile.department} />
            </div>
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
