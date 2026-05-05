import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DEPARTMENTS, type DepartmentCode } from "@/lib/departments";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Wallet } from "lucide-react";

const signInSchema = z.object({
  email: z.string().trim().email({ message: "ایمیل نامعتبر است" }).max(255),
  password: z.string().min(6, { message: "رمز حداقل ۶ کاراکتر" }).max(72),
});
const signUpSchema = signInSchema.extend({
  full_name: z.string().trim().min(2, { message: "نام را وارد کنید" }).max(100),
  department: z.enum(["financial", "sales", "support", "rnd", "production"], {
    errorMap: () => ({ message: "واحد را انتخاب کنید" }),
  }),
});

export default function Auth() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const [si, setSi] = useState({ email: "", password: "" });
  const [su, setSu] = useState({ email: "", password: "", full_name: "", department: "" as DepartmentCode | "" });

  if (!loading && user) return <Navigate to="/" replace />;

  const onSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = signInSchema.safeParse(si);
    if (!r.success) return toast.error(r.error.issues[0].message);
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword(r.data);
    setBusy(false);
    if (error) return toast.error("ورود ناموفق: " + error.message);
    toast.success("خوش آمدید");
    navigate("/");
  };

  const onSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = signUpSchema.safeParse(su);
    if (!r.success) return toast.error(r.error.issues[0].message);
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: r.data.email,
      password: r.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: r.data.full_name, department: r.data.department },
      },
    });
    setBusy(false);
    if (error) return toast.error("ثبت‌نام ناموفق: " + error.message);
    toast.success("ثبت‌نام موفق — اکنون وارد شوید");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute left-4 top-4"><ThemeToggle /></div>
      <div className="container flex min-h-screen items-center justify-center py-10">
        <div className="grid w-full max-w-5xl gap-10 lg:grid-cols-2 lg:items-center">
          <div className="hidden lg:block animate-fade-in">
            <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary text-primary-foreground shadow-[var(--shadow-elegant)]">
              <Wallet className="h-7 w-7" />
            </div>
            <h1 className="mb-3 text-4xl font-extrabold leading-tight">
              داشبورد مالی <span className="bg-gradient-to-l from-primary to-accent bg-clip-text text-transparent">سازمانی</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              ثبت دریافت‌ها، پرداخت‌ها و پیش‌بینی برای هر واحد، با نمودارهای زنده برای مدیریت.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
              <li>• تفکیک نقش مدیر و کارشناس واحد</li>
              <li>• پشتیبانی از ۵ واحد سازمانی</li>
              <li>• پیش‌بینی بازه‌های زمانی آینده</li>
            </ul>
          </div>

          <div className="card-elegant p-6 sm:p-8 animate-fade-in">
            <Tabs defaultValue="signin">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">ورود</TabsTrigger>
                <TabsTrigger value="signup">ثبت‌نام</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={onSignIn} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="si-email">ایمیل</Label>
                    <Input id="si-email" type="email" dir="ltr" value={si.email}
                      onChange={(e) => setSi({ ...si, email: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="si-pass">رمز عبور</Label>
                    <Input id="si-pass" type="password" dir="ltr" value={si.password}
                      onChange={(e) => setSi({ ...si, password: e.target.value })} />
                  </div>
                  <Button type="submit" disabled={busy} className="w-full gradient-primary text-primary-foreground hover:opacity-95">
                    ورود به داشبورد
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={onSignUp} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="su-name">نام و نام خانوادگی</Label>
                    <Input id="su-name" value={su.full_name}
                      onChange={(e) => setSu({ ...su, full_name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>واحد سازمانی</Label>
                    <Select value={su.department} onValueChange={(v) => setSu({ ...su, department: v as DepartmentCode })}>
                      <SelectTrigger><SelectValue placeholder="انتخاب واحد" /></SelectTrigger>
                      <SelectContent>
                        {DEPARTMENTS.map((d) => <SelectItem key={d.code} value={d.code}>{d.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="su-email">ایمیل</Label>
                    <Input id="su-email" type="email" dir="ltr" value={su.email}
                      onChange={(e) => setSu({ ...su, email: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="su-pass">رمز عبور</Label>
                    <Input id="su-pass" type="password" dir="ltr" value={su.password}
                      onChange={(e) => setSu({ ...su, password: e.target.value })} />
                  </div>
                  <Button type="submit" disabled={busy} className="w-full gradient-primary text-primary-foreground hover:opacity-95">
                    ایجاد حساب
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    برای دریافت دسترسی مدیر، با مدیر سیستم تماس بگیرید.
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
