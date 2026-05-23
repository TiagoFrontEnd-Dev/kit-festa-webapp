"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Kit = {
  id: number;
  nome: string;
  descricao: string | null;
  preco: number;
  imagem: string | null;
  ativo: boolean;
};

export default function KitsPage() {
  const [kits, setKits] = useState<Kit[]>([]);
  const [loading, setLoading] = useState(true);

  async function carregarKits() {
    setLoading(true);

    const { data, error } = await supabase
      .from("kits")
      .select("*")
      .eq("ativo", true)
      .order("id", { ascending: false });

    setLoading(false);

    if (error) {
      alert(`Erro ao carregar kits: ${error.message}`);
      return;
    }

    setKits(data || []);
  }

  useEffect(() => {
    carregarKits();
  }, []);

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-14 text-gray-900 dark:bg-gray-950 dark:text-white md:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="mb-14 text-center">
          <h1 className="text-4xl font-bold md:text-6xl">
            Kits Disponíveis
          </h1>

          <p className="mt-4 text-gray-700 dark:text-gray-300">
            Escolha o kit ideal para sua festa.
          </p>
        </div>

        {loading ? (
          <p className="text-center text-lg font-bold">
            Carregando kits...
          </p>
        ) : kits.length === 0 ? (
          <div className="rounded-3xl bg-white p-10 text-center shadow dark:bg-gray-900">
            <p className="text-lg text-gray-700 dark:text-gray-300">
              Nenhum kit disponível no momento.
            </p>
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
            {kits.map((kit) => (
              <article
                key={kit.id}
                className="overflow-hidden rounded-3xl bg-white shadow-lg transition duration-300 hover:-translate-y-2 hover:shadow-2xl dark:bg-gray-900"
              >
                <div className="relative h-72 overflow-hidden">
                  {kit.imagem ? (
                    <img
                      src={kit.imagem}
                      alt={kit.nome}
                      className="h-full w-full object-cover transition duration-500 hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                      Sem imagem
                    </div>
                  )}

                  <div className="absolute left-4 top-4 rounded-full bg-pink-600 px-4 py-2 text-sm font-bold text-white shadow-lg">
                    Destaque
                  </div>
                </div>

                <div className="p-6">
                  <h2 className="mb-3 text-3xl font-bold text-gray-900 dark:text-white">
                    {kit.nome}
                  </h2>

                  <p className="line-clamp-5 min-h-[140px] text-gray-700 dark:text-gray-300">
                    {kit.descricao || "Sem descrição."}
                  </p>

                  <div className="mt-6 flex items-center justify-between">
                    <p className="text-3xl font-bold text-pink-600">
                      R$ {kit.preco}
                    </p>

                    <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  </div>

                  <div className="mt-6 grid gap-3">
                    <Link
                      href={`/kits/${kit.id}`}
                      className="rounded-2xl bg-gray-900 px-6 py-4 text-center font-bold text-white transition hover:opacity-90 dark:bg-white dark:text-gray-900"
                    >
                      Ver detalhes
                    </Link>

                    <Link
                      href={`/kits/${kit.id}`}
                      className="rounded-2xl bg-pink-600 px-6 py-4 text-center font-bold text-white transition hover:bg-pink-700"
                    >
                      Reservar agora
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}