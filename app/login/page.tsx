"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  async function entrar() {
    if (!email || !senha) {
      alert("Preencha email e senha.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    setLoading(false);

    if (error) {
      alert(`Erro ao entrar: ${error.message}`);
      return;
    }

    router.push("/admin");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-6 text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow dark:bg-gray-900">
        <h1 className="mb-2 text-3xl font-bold text-pink-600">
          Login Admin
        </h1>

        <p className="mb-8 text-gray-700 dark:text-gray-300">
          Acesse o painel administrativo.
        </p>

        <div className="grid gap-4">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="Email"
            className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />

          <input
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            type="password"
            placeholder="Senha"
            className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />

          <button
            onClick={entrar}
            disabled={loading}
            className="rounded-xl bg-pink-600 py-3 font-bold text-white disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </div>
      </div>
    </main>
  );
}