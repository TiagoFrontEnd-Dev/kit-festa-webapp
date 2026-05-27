"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const savedTheme = localStorage.getItem("theme");

      if (savedTheme === "dark") {
        document.documentElement.classList.add("dark");
        setTheme("dark");
      } else {
        document.documentElement.classList.remove("dark");
        setTheme("light");
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  function toggleTheme() {
    const isDark = document.documentElement.classList.contains("dark");

    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setTheme("light");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setTheme("dark");
    }
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="rounded-2xl bg-rose-100 px-4 py-2 font-bold text-rose-700 transition hover:bg-rose-200 dark:bg-gray-800 dark:text-rose-200 dark:hover:bg-gray-700"
    >
      {theme === "dark" ? "🌸 Claro" : "🌙 Escuro"}
    </button>
  );
}
