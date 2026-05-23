"use client";

import Link from "next/link";
import { useState } from "react";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  const [menuAberto, setMenuAberto] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md dark:bg-gray-900">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-2xl font-bold text-pink-600 md:text-3xl">
          Kit Festa
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          <nav className="flex items-center gap-6 font-medium text-gray-900 dark:text-gray-100">
            <Link href="/">Início</Link>
            <Link href="/kits">Kits</Link>
            <Link href="/sobre">Sobre</Link>
            <Link href="/contato">Contato</Link>
            <Link href="/admin" className="rounded-xl bg-pink-600 px-5 py-2 text-white">
              Admin
            </Link>
          </nav>

          <ThemeToggle />
        </div>

        <button
          onClick={() => setMenuAberto(!menuAberto)}
          className="rounded-xl bg-pink-600 px-4 py-2 font-bold text-white md:hidden"
        >
          Menu
        </button>
      </div>

      {menuAberto && (
        <div className="border-t bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900 md:hidden">
          <nav className="flex flex-col gap-4 font-medium text-gray-900 dark:text-gray-100">
            <Link href="/" onClick={() => setMenuAberto(false)}>Início</Link>
            <Link href="/kits" onClick={() => setMenuAberto(false)}>Kits</Link>
            <Link href="/sobre" onClick={() => setMenuAberto(false)}>Sobre</Link>
            <Link href="/contato" onClick={() => setMenuAberto(false)}>Contato</Link>
            <Link href="/admin" onClick={() => setMenuAberto(false)}>Admin</Link>
            <ThemeToggle />
          </nav>
        </div>
      )}
    </header>
  );
}