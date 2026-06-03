import { useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Plus, ShieldCheck } from "lucide-react";

import { AppHeader } from "@/components/AppHeader";
import { DEPARTMENTS, departmentLabel, type DepartmentCode } from "@/lib/departments";
import { DepartmentCharts } from "@/components/DepartmentCharts";
import { EntryPanel } from "@/components/EntryPanel";
import { AdminOverviewChart } from "@/components/AdminOverviewChart";
import { SupportDashboard } from "@/components/support/SupportDashboard";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

import { SupportAdminOverviewChart } from "@/components/support/SupportAdminOverviewChart";
import { SalesAdminOverviewChart } from "@/components/sales/SalesAdminOverviewChart";
import { SalesDashboard } from "@/components/sales/SalesDashboard";

import { ProductionDashboard } from "@/components/production/ProductionDashboard";
import { ProductionAdminOverviewChart } from "@/components/production/ProductionAdminOverviewChart";

import { RndDashboard } from "@/components/rnd/RndDashboard";
import { RndAdminOverviewChart } from "@/components/rnd/RndAdminOverviewChart";

export default function Dashboard() {
  const { user, loading, profile, isAdmin } = useAuth();

  const [refreshKey, setRefreshKey] = useState(0);
  const [activeDept, setActiveDept] = useState<DepartmentCode>("financial");
  const [openEntry, setOpenEntry] = useState(false);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center">
        در حال بارگذاری…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const userDepartment = profile?.department as DepartmentCode | undefined;

  return (
    <div dir="rtl" className="min-h-screen bg-background">
      <AppHeader />

      <main className="container py-8">
        {isAdmin ? (
          <AdminDashboard
            activeDept={activeDept}
            onDeptChange={setActiveDept}
          />
        ) : userDepartment ? (
          <UserDashboard
            department={userDepartment}
            userId={user.id}
            refreshKey={refreshKey}
            openEntry={openEntry}
            onOpenEntryChange={setOpenEntry}
            onSaved={() => setRefreshKey((k) => k + 1)}
          />
        ) : (
          <EmptyDepartmentState />
        )}
      </main>
    </div>
  );
}

/* ---------------- Admin ---------------- */

function AdminDashboard({
  activeDept,
  onDeptChange,
}: {
  activeDept: DepartmentCode;
  onDeptChange: (department: DepartmentCode) => void;
}) {
  return (
    <section className="space-y-8">
      <PageTitle
        icon={<ShieldCheck className="h-6 w-6" />}
        title="پنل مدیریت سیستم"
        subtitle="مشاهده و نظارت بر تمامی واحدهای سازمانی"
      />

      <Tabs
        dir="rtl"
        value={activeDept}
        onValueChange={(value) => onDeptChange(value as DepartmentCode)}
        className="w-full"
      >
        <TabsList className="grid h-auto w-full grid-cols-2 gap-2 bg-muted/50 p-1 sm:grid-cols-3 lg:grid-cols-5">
          {DEPARTMENTS.map((department) => (
            <TabsTrigger
              key={department.code}
              value={department.code}
              className="rounded-md py-3 text-sm transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              {department.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {activeDept === "support" ? (
        <SupportAdminOverviewChart year="1405" />
      ) : activeDept === "sales" ? (
        <SalesAdminOverviewChart year="1405" />
      ) : activeDept === "production" ? (
        <ProductionAdminOverviewChart year="1405" />
      ) : activeDept === "rnd" ? (
        <RndAdminOverviewChart year="1405" />
      ) : (
        <AdminOverviewChart department={activeDept} year="1405" />
      )}

      <div className="border-t border-border pt-8">
        <PageTitle
          icon={<Building2 className="h-6 w-6" />}
          title={`جزئیات واحد ${departmentLabel(activeDept)}`}
          subtitle="نمای تفصیلی اطلاعات واحد انتخاب‌شده"
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={activeDept}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <DepartmentView department={activeDept} mode="admin" />
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

/* ---------------- Normal User ---------------- */

function UserDashboard({
  department,
  userId,
  refreshKey,
  openEntry,
  onOpenEntryChange,
  onSaved,
}: {
  department: DepartmentCode;
  userId: string;
  refreshKey: number;
  openEntry: boolean;
  onOpenEntryChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  if (
    department === "support" ||
    department === "sales" ||
    department === "production" ||
    department === "rnd"
  ) {
    return (
      <section className="space-y-6">
        <DepartmentView department={department} mode="user" />
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageTitle
          icon={<Building2 className="h-6 w-6" />}
          title={departmentLabel(department)}
          subtitle="نمای کلی و ثبت اطلاعات واحد شما"
        />

        <Button
          onClick={() => onOpenEntryChange(true)}
          size="lg"
          className="gradient-primary"
        >
          <Plus className="ml-2 h-5 w-5" />
          ثبت رکورد جدید
        </Button>
      </div>

      <DepartmentView
        key={refreshKey}
        department={department}
        mode="user"
      />

      <EntryPanel
        department={department}
        userId={userId}
        open={openEntry}
        onOpenChange={onOpenEntryChange}
        onSaved={onSaved}
      />
    </section>
  );
}

/* ---------------- Department Router ---------------- */

function DepartmentView({
  department,
  mode,
}: {
  department: DepartmentCode;
  mode: "admin" | "user";
}) {
  const isAdmin = mode === "admin";

  switch (department) {
    case "support":
      return <SupportDashboard />;

    case "sales":
      return <SalesDashboard />;

    case "production":
      return <ProductionDashboard />;

    case "rnd":
      return <RndDashboard />;

    default:
      return (
        <DepartmentCharts
          department={department}
          isAdmin={isAdmin}
        />
      );
  }
}

/* ---------------- Shared UI ---------------- */

function PageTitle({
  icon,
  title,
  subtitle,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
}) {
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

function EmptyDepartmentState() {
  return (
    <div className="card-elegant grid place-items-center py-16 text-center">
      <p className="text-muted-foreground">
        واحد سازمانی شما تنظیم نشده است.
      </p>
    </div>
  );
}