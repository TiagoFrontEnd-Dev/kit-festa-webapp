"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Kit = {
  id: number;
  nome: string;
  descricao: string | null;
  preco: number;
  imagem: string | null;
  ativo: boolean;
};

type Item = {
  id: number;
  kit_id: number | null;
  nome: string;
  quantidade: number;
  descricao: string | null;
  ativo: boolean;
};

type KitImagem = {
  id: number;
  kit_id: number;
  url: string;
  caminho: string | null;
  ordem: number;
  principal: boolean;
};

export default function KitDetalhesPage() {
  const params = useParams();

  const idParam = Array.isArray(params.id) ? params.id[0] : params.id;
  const kitId = Number(idParam);

  const [kit, setKit] = useState<Kit | null>(null);
  const [itens, setItens] = useState<Item[]>([]);
  const [imagens, setImagens] = useState<KitImagem[]>([]);
  const [imagemAtual, setImagemAtual] = useState(0);
  const [loading, setLoading] = useState(true);

  async function carregarKit() {
    if (!kitId || Number.isNaN(kitId)) {
      setLoading(false);
      setKit(null);
      return;
    }

    setLoading(true);

    const { data: kitData, error: kitError } = await supabase
      .from("kits")
      .select("*")
      .eq("id", kitId)
      .maybeSingle();

    const { data: itensData, error: itensError } = await supabase
      .from("itens")
      .select("*")
      .eq("kit_id", kitId)
      .eq("ativo", true)
      .order("id", { ascending: true });

    const { data: imagensData, error: imagensError } = await supabase
      .from("kit_imagens")
      .select("*")
      .eq("kit_id", kitId)
      .order("ordem", { ascending: true });

    setLoading(false);

    if (kitError) {
      alert(`Erro ao carregar kit: ${kitError.message}`);
      return;
    }

    if (itensError) {
      alert(`Erro ao carregar itens: ${itensError.message}`);
      return;
    }

    if (imagensError) {
      alert(`Erro ao carregar imagens: ${imagensError.message}`);
      return;
    }

    if (!kitData) {
      setKit(null);
      return;
    }

    setKit(kitData);
    setItens(itensData || []);
    setImagens(imagensData || []);
    setImagemAtual(0);
  }

  function proximaImagem() {
    if (imagens.length === 0) return;

    setImagemAtual((atual) =>
      atual === imagens.length - 1 ? 0 : atual + 1
    );
  }

  function imagemAnterior() {
    if (imagens.length === 0) return;

    setImagemAtual((atual) =>
      atual === 0 ? imagens.length - 1 : atual - 1
    );
  }

  useEffect(() => {
    carregarKit();
  }, [kitId]);

  const imagemPrincipal =
    imagens.length > 0 ? imagens[imagemAtual].url : kit?.imagem || "";

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 px-6 py-16 text-gray-900 dark:bg-gray-950 dark:text-white">
        <p className="text-center text-xl font-bold">
          Carregando kit...
        </p>
      </main>
    );
  }

  if (!kit) {
    return (
      <main className="min-h-screen bg-gray-100 px-6 py-16 text-gray-900 dark:bg-gray-950 dark:text-white">
        <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 text-center shadow dark:bg-gray-900">
          <h1 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">
            Kit não encontrado
          </h1>

          <p className="mb-6 text-gray-700 dark:text-gray-300">
            Esse kit pode ter sido removido ou o link está incorreto.
          </p>

          <Link href="/kits" className="font-bold text-pink-600">
            Voltar para kits
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 px-6 py-16 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <section className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2">
        <div className="rounded-3xl bg-white p-4 shadow dark:bg-gray-900">
          <div className="relative overflow-hidden rounded-2xl">
            {imagemPrincipal ? (
              <img
                src={imagemPrincipal}
                alt={kit.nome}
                className="h-[420px] w-full object-cover"
              />
            ) : (
              <div className="flex h-[420px] items-center justify-center bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                Sem imagem
              </div>
            )}

            {imagens.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={imagemAnterior}
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/70 px-4 py-3 font-bold text-white"
                >
                  ‹
                </button>

                <button
                  type="button"
                  onClick={proximaImagem}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/70 px-4 py-3 font-bold text-white"
                >
                  ›
                </button>

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-4 py-2 text-sm font-bold text-white">
                  {imagemAtual + 1} / {imagens.length}
                </div>
              </>
            )}
          </div>

          {imagens.length > 1 && (
            <div className="mt-4 grid grid-cols-4 gap-3 md:grid-cols-5">
              {imagens.map((imagem, index) => (
                <button
                  key={imagem.id}
                  type="button"
                  onClick={() => setImagemAtual(index)}
                  className={`overflow-hidden rounded-xl border-4 ${
                    imagemAtual === index
                      ? "border-pink-600"
                      : "border-transparent"
                  }`}
                >
                  <img
                    src={imagem.url}
                    alt={`${kit.nome} ${index + 1}`}
                    className="h-20 w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl bg-white p-8 shadow dark:bg-gray-900">
          <Link
            href="/kits"
            className="mb-6 inline-block font-bold text-pink-600"
          >
            ← Voltar para kits
          </Link>

          <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">
            {kit.nome}
          </h1>

          <p className="mb-6 text-lg leading-8 text-gray-700 dark:text-gray-300">
            {kit.descricao || "Sem descrição."}
          </p>

          <p className="mb-8 text-4xl font-bold text-pink-600">
            R$ {kit.preco}
          </p>

          <div className="mb-8 rounded-2xl bg-gray-100 p-5 dark:bg-gray-800">
            <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
              Itens inclusos
            </h2>

            {itens.length === 0 ? (
              <p className="text-gray-700 dark:text-gray-300">
                Nenhum item cadastrado para este kit.
              </p>
            ) : (
              <ul className="grid gap-3">
                {itens.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between rounded-xl bg-white px-4 py-3 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                  >
                    <span>{item.nome}</span>

                    <strong className="text-pink-600">
                      {item.quantidade}x
                    </strong>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="grid gap-3">
            <Link
              href="/kits"
              className="block w-full rounded-xl bg-pink-600 py-4 text-center text-lg font-bold text-white"
            >
              Reservar este kit
            </Link>

            <Link
              href="/kits"
              className="block w-full rounded-xl bg-gray-900 py-4 text-center text-lg font-bold text-white dark:bg-white dark:text-gray-900"
            >
              Voltar para todos os kits
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}