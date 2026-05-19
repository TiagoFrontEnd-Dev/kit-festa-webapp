"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "./AdminSidebar";
import { supabase } from "@/lib/supabase";

type Props = {
  children: ReactNode;
};

export default function AdminLayout({ children }: Props) {
  const router = useRouter();
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function verificarLogin() {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        router.push("/login");
        return;
      }

      setCarregando(false);
    }

    verificarLogin();
  }, [router]);

  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100 text-gray-900 dark:bg-gray-950 dark:text-white">
        <p className="text-xl font-bold">Verificando acesso...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen bg-gray-100 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <AdminSidebar />

      <section className="flex-1 p-6 md:p-10">{children}</section>
    </main>
  );
}