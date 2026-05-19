import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-white shadow-md dark:bg-gray-900">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-3xl font-bold text-pink-600">
          Kit Festa
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          <nav className="flex items-center gap-6 font-medium text-gray-900 dark:text-gray-100">
            <Link href="/">Início</Link>
            <Link href="/kits">Kits</Link>
            <Link href="/reserva">Reservas</Link>
            <Link href="/sobre">Sobre</Link>
            <Link href="/contato">Contato</Link>

            <Link
              href="/admin"
              className="rounded-xl bg-pink-600 px-5 py-2 text-white"
            >
              Admin
            </Link>
          </nav>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}