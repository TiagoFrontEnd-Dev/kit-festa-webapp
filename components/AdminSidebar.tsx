"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const links = [
  { nome: "Dashboard", href: "/admin" },
  { nome: "Kits", href: "/admin/kits" },
  { nome: "Itens", href: "/admin/itens" },
  { nome: "Reservas", href: "/admin/reservas" },
  { nome: "Clientes", href: "/admin/clientes" },
  { nome: "Checklist", href: "/admin/checklist" },
  { nome: "Relatórios", href: "/admin/relatorios" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function sair() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside className="hidden min-h-screen w-72 bg-white p-6 text-gray-900 shadow-md dark:bg-gray-900 dark:text-white md:block">
      <h2 className="mb-10 text-3xl font-bold text-pink-600">
        Kit Festa
      </h2>

      <nav className="flex flex-col gap-3">
        {links.map((link) => {
          const active = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-xl px-4 py-3 transition ${
                active
                  ? "bg-pink-600 text-white"
                  : "text-gray-800 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
            >
              {link.nome}
            </Link>
          );
        })}

        <button
          type="button"
          onClick={sair}
          className="mt-8 rounded-xl bg-red-600 px-4 py-3 text-left font-bold text-white"
        >
          Sair
        </button>
      </nav>
    </aside>
  );
}