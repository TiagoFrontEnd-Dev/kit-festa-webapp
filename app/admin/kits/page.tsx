"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/lib/supabase";

type Kit = {
  id: number;
  nome: string;
  descricao: string | null;
  preco: number;
  imagem: string | null;
  ativo: boolean;
};

export default function AdminKitsPage() {
  const [kits, setKits] = useState<Kit[]>([]);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco] = useState("");
  const [imagem, setImagem] = useState("");
  const [arquivoImagem, setArquivoImagem] = useState<File | null>(null);
  const [previewImagem, setPreviewImagem] = useState("");
  const [loading, setLoading] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);

  async function carregarKits() {
    const { data, error } = await supabase
      .from("kits")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      alert(`Erro ao carregar kits: ${error.message}`);
      return;
    }

    setKits(data || []);
  }

  function selecionarImagem(file: File | null) {
    if (!file) return;

    setArquivoImagem(file);
    setPreviewImagem(URL.createObjectURL(file));
  }

  async function uploadImagem() {
    if (!arquivoImagem) return imagem;

    const extensao = arquivoImagem.name.split(".").pop();
    const nomeArquivo = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}.${extensao}`;

    const caminho = `kits/${nomeArquivo}`;

    const { error } = await supabase.storage
      .from("kits")
      .upload(caminho, arquivoImagem);

    if (error) {
      throw new Error(error.message);
    }

    const { data } = supabase.storage.from("kits").getPublicUrl(caminho);

    return data.publicUrl;
  }

  async function salvarKit() {
    if (!nome.trim() || !preco.trim()) {
      alert("Preencha o nome e o preço.");
      return;
    }

    setLoading(true);

    try {
      const imagemFinal = await uploadImagem();

      if (editandoId) {
        const { error } = await supabase
          .from("kits")
          .update({
            nome: nome.trim(),
            descricao: descricao.trim(),
            preco: Number(preco),
            imagem: imagemFinal,
          })
          .eq("id", editandoId);

        if (error) throw new Error(error.message);

        alert("Kit atualizado com sucesso!");
      } else {
        const { error } = await supabase.from("kits").insert({
          nome: nome.trim(),
          descricao: descricao.trim(),
          preco: Number(preco),
          imagem: imagemFinal,
          ativo: true,
        });

        if (error) throw new Error(error.message);

        alert("Kit cadastrado com sucesso!");
      }

      limparFormulario();
      carregarKits();
    } catch (error) {
      if (error instanceof Error) {
        alert(`Erro: ${error.message}`);
      } else {
        alert("Erro desconhecido ao salvar kit.");
      }
    }

    setLoading(false);
  }

  function editarKit(kit: Kit) {
    setEditandoId(kit.id);
    setNome(kit.nome);
    setDescricao(kit.descricao || "");
    setPreco(String(kit.preco));
    setImagem(kit.imagem || "");
    setPreviewImagem(kit.imagem || "");
    setArquivoImagem(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function excluirKit(id: number) {
    const confirmar = confirm("Tem certeza que deseja excluir este kit?");
    if (!confirmar) return;

    const { error } = await supabase.from("kits").delete().eq("id", id);

    if (error) {
      alert(`Erro ao excluir kit: ${error.message}`);
      return;
    }

    alert("Kit excluído com sucesso!");
    carregarKits();
  }

  function limparFormulario() {
    setEditandoId(null);
    setNome("");
    setDescricao("");
    setPreco("");
    setImagem("");
    setArquivoImagem(null);
    setPreviewImagem("");
  }

  useEffect(() => {
    carregarKits();
  }, []);

  return (
    <AdminLayout>
      <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">
        Kits
      </h1>

      <p className="mb-8 text-gray-700 dark:text-gray-300">
        Cadastro, edição, exclusão e upload de imagens dos kits.
      </p>

      <div className="mb-8 rounded-2xl bg-white p-6 shadow dark:bg-gray-900">
        <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
          {editandoId ? "Editar kit" : "Cadastrar novo kit"}
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome do kit"
            className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-400"
          />

          <input
            value={preco}
            onChange={(e) => setPreco(e.target.value)}
            placeholder="Preço"
            type="number"
            className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-400"
          />

          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descrição"
            className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-400 md:col-span-2"
          />

          <div className="md:col-span-2">
            <label className="mb-2 block font-bold text-gray-900 dark:text-white">
              Imagem do kit
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={(e) => selecionarImagem(e.target.files?.[0] || null)}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />

            {previewImagem && (
              <img
                src={previewImagem}
                alt="Preview"
                className="mt-4 h-48 w-full rounded-xl object-cover"
              />
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={salvarKit}
            disabled={loading}
            className="rounded-xl bg-pink-600 px-6 py-3 font-bold text-white disabled:opacity-50"
          >
            {loading
              ? "Salvando..."
              : editandoId
              ? "Salvar alterações"
              : "+ Cadastrar Kit"}
          </button>

          {editandoId && (
            <button
              type="button"
              onClick={limparFormulario}
              className="rounded-xl bg-gray-200 px-6 py-3 font-bold text-gray-900 dark:bg-gray-700 dark:text-white"
            >
              Cancelar edição
            </button>
          )}
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow dark:bg-gray-900">
        <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
          Kits cadastrados
        </h2>

        {kits.length === 0 ? (
          <p className="text-gray-700 dark:text-gray-300">
            Nenhum kit cadastrado ainda.
          </p>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {kits.map((kit) => (
              <div
                key={kit.id}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
              >
                {kit.imagem ? (
                  <img
                    src={kit.imagem}
                    alt={kit.nome}
                    className="h-44 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-44 items-center justify-center bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                    Sem imagem
                  </div>
                )}

                <div className="p-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {kit.nome}
                  </h3>

                  <p className="mt-2 text-gray-700 dark:text-gray-300">
                    {kit.descricao || "Sem descrição."}
                  </p>

                  <p className="mt-3 text-xl font-bold text-pink-600">
                    R$ {kit.preco}
                  </p>

                  <div className="mt-5 flex gap-3">
                    <button
                      type="button"
                      onClick={() => editarKit(kit)}
                      className="flex-1 rounded-xl bg-blue-600 px-4 py-2 font-bold text-white"
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => excluirKit(kit.id)}
                      className="flex-1 rounded-xl bg-red-600 px-4 py-2 font-bold text-white"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}