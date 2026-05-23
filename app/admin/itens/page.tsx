"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/lib/supabase";

type Kit = {
  id: number;
  nome: string;
};

type Item = {
  id: number;
  kit_id: number | null;
  nome: string;
  quantidade: number;
  descricao: string | null;
  ativo: boolean;
};

export default function AdminItensPage() {
  const [kits, setKits] = useState<Kit[]>([]);
  const [itens, setItens] = useState<Item[]>([]);

  const [kitId, setKitId] = useState("");
  const [nome, setNome] = useState("");
  const [quantidade, setQuantidade] = useState("1");
  const [descricao, setDescricao] = useState("");
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  async function carregarDados() {
    const { data: kitsData } = await supabase
      .from("kits")
      .select("id, nome")
      .order("nome", { ascending: true });

    const { data: itensData } = await supabase
      .from("itens")
      .select("*")
      .order("id", { ascending: false });

    setKits(kitsData || []);
    setItens(itensData || []);
  }

  function buscarKit(id: number | null) {
    return kits.find((kit) => kit.id === id);
  }

  async function salvarItem() {
    if (!kitId || !nome.trim()) {
      alert("Selecione um kit e informe o nome do item.");
      return;
    }

    setLoading(true);

    const payload = {
      kit_id: Number(kitId),
      nome: nome.trim(),
      quantidade: Number(quantidade),
      descricao: descricao.trim(),
      ativo: true,
    };

    const { error } = editandoId
      ? await supabase.from("itens").update(payload).eq("id", editandoId)
      : await supabase.from("itens").insert(payload);

    setLoading(false);

    if (error) {
      alert(`Erro ao salvar item: ${error.message}`);
      return;
    }

    alert(editandoId ? "Item atualizado!" : "Item cadastrado!");
    limparFormulario();
    carregarDados();
  }

  function editarItem(item: Item) {
    setEditandoId(item.id);
    setKitId(String(item.kit_id || ""));
    setNome(item.nome);
    setQuantidade(String(item.quantidade));
    setDescricao(item.descricao || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function excluirItem(id: number) {
    if (!confirm("Deseja excluir este item?")) return;

    const { error } = await supabase.from("itens").delete().eq("id", id);

    if (error) {
      alert(`Erro ao excluir item: ${error.message}`);
      return;
    }

    carregarDados();
  }

  function limparFormulario() {
    setEditandoId(null);
    setKitId("");
    setNome("");
    setQuantidade("1");
    setDescricao("");
  }

  useEffect(() => {
    carregarDados();
  }, []);

  return (
    <AdminLayout>
      <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">
        Itens
      </h1>

      <p className="mb-8 text-gray-700 dark:text-gray-300">
        Cadastre os itens que compõem cada kit.
      </p>

      <div className="mb-8 rounded-2xl bg-white p-6 shadow dark:bg-gray-900">
        <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
          {editandoId ? "Editar item" : "Cadastrar novo item"}
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          <select
            value={kitId}
            onChange={(e) => setKitId(e.target.value)}
            className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            <option value="">Selecione o kit</option>
            {kits.map((kit) => (
              <option key={kit.id} value={kit.id}>
                {kit.nome}
              </option>
            ))}
          </select>

          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome do item"
            className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />

          <input
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
            type="number"
            min="1"
            placeholder="Quantidade"
            className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />

          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descrição opcional"
            className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white md:col-span-2"
          />
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={salvarItem}
            disabled={loading}
            className="rounded-xl bg-pink-600 px-6 py-3 font-bold text-white disabled:opacity-50"
          >
            {loading ? "Salvando..." : editandoId ? "Salvar alterações" : "+ Cadastrar Item"}
          </button>

          {editandoId && (
            <button
              onClick={limparFormulario}
              className="rounded-xl bg-gray-200 px-6 py-3 font-bold text-gray-900 dark:bg-gray-700 dark:text-white"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow dark:bg-gray-900">
        <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
          Itens cadastrados
        </h2>

        {itens.length === 0 ? (
          <p className="text-gray-700 dark:text-gray-300">
            Nenhum item cadastrado ainda.
          </p>
        ) : (
          <div className="grid gap-4">
            {itens.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-800"
              >
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {item.nome}
                </h3>

                <p className="text-gray-700 dark:text-gray-300">
                  Kit: <strong>{buscarKit(item.kit_id)?.nome || "Kit não encontrado"}</strong>
                </p>

                <p className="text-gray-700 dark:text-gray-300">
                  Quantidade: {item.quantidade}
                </p>

                {item.descricao && (
                  <p className="mt-2 text-gray-700 dark:text-gray-300">
                    {item.descricao}
                  </p>
                )}

                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => editarItem(item)}
                    className="rounded-xl bg-blue-600 px-4 py-2 font-bold text-white"
                  >
                    Editar
                  </button>

                  <button
                    onClick={() => excluirItem(item.id)}
                    className="rounded-xl bg-red-600 px-4 py-2 font-bold text-white"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}