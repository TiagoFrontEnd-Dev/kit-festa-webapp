"use client";

import Link from "next/link";
import { useState } from "react";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  const [menuAberto, setMenuAberto] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-rose-100 bg-rose-50/95 shadow-sm backdrop-blur dark:border-rose-900/40 dark:bg-gray-950/95">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="text-2xl font-black tracking-tight text-rose-500 md:text-3xl"
        >
          ArtePinte
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          <nav className="flex items-center gap-6 font-medium text-gray-800 dark:text-rose-100">
            <Link href="/">Início</Link>
            <Link href="/kits">Kits</Link>
            <Link href="/sobre">Sobre</Link>
            <Link href="/contato">Contato</Link>

            <Link
              href="/admin"
              className="rounded-2xl bg-rose-400 px-5 py-2 font-bold text-white shadow hover:bg-rose-500 dark:bg-rose-500 dark:hover:bg-rose-600"
            >
              Admin
            </Link>
          </nav>

          <ThemeToggle />
        </div>

        <button
          type="button"
          onClick={() => setMenuAberto(!menuAberto)}
          className="rounded-2xl bg-rose-400 px-4 py-2 font-bold text-white md:hidden"
        >
          Menu
        </button>
      </div>

      {menuAberto && (
        <div className="border-t border-rose-100 bg-rose-50 px-6 py-4 dark:border-rose-900/40 dark:bg-gray-950 md:hidden">
          <nav className="flex flex-col gap-4 font-medium text-gray-800 dark:text-rose-100">
            <Link href="/" onClick={() => setMenuAberto(false)}>
              Início
            </Link>

            <Link href="/kits" onClick={() => setMenuAberto(false)}>
              Kits
            </Link>

            <Link href="/sobre" onClick={() => setMenuAberto(false)}>
              Sobre
            </Link>

            <Link href="/contato" onClick={() => setMenuAberto(false)}>
              Contato
            </Link>

            <Link href="/admin" onClick={() => setMenuAberto(false)}>
              Admin
            </Link>

            <ThemeToggle />
          </nav>
        </div>
      )}
    </header>
  );
}