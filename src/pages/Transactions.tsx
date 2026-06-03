
import { Navigate } from "react-router-dom";

import { AppHeader } from "@/components/AppHeader";

import { useAuth } from "@/context/AuthContext";
import TransactionHistory from "@/components/TransactionHistory";

export default function Trans() {
  const { user, loading, profile, isAdmin } = useAuth();


  if (loading) return <div className="grid min-h-screen place-items-center">در حال بارگذاری…</div>;
  if (!user) return <Navigate to="/auth" replace />;

  // useEffect(()=>{

  //   console.log(activeDept)

  // } ,[activeDept])

  return (
    <div dir="rtl" className="min-h-screen bg-background">
      <AppHeader />
      <main className="container py-1">
        <TransactionHistory />
      </main>
    </div>
  );
}





