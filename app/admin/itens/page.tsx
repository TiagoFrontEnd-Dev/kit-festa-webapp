"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/lib/supabase";
import {
  calcularResumoItem,
  EstoqueItem,
  KitItem,
  ReservaItem,
  ReservaEstoque,
} from "@/lib/inventory";

type Kit = {
  id: number;
  nome: string;
};

function dataHojeLocal() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

export default function AdminItensPage() {
  const [itens, setItens] = useState<EstoqueItem[]>([]);
  const [kits, setKits] = useState<Kit[]>([]);
  const [kitItens, setKitItens] = useState<KitItem[]>([]);
  const [reservas, setReservas] = useState<ReservaEstoque[]>([]);
  const [reservaItens, setReservaItens] = useState<ReservaItem[]>([]);

  const [nome, setNome] = useState("");
  const [quantidadeTotal, setQuantidadeTotal] = useState("1");
  const [descricao, setDescricao] = useState("");
  const [ativo, setAtivo] = useState(true);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [carregando, setCarregando] = useState(true);

  const hoje = dataHojeLocal();

  async function carregarDados() {
    setCarregando(true);

    const { data: itensData, error: itensError } = await supabase
      .from("estoque_itens")
      .select("*")
      .order("nome", { ascending: true });

    const { data: kitsData, error: kitsError } = await supabase
      .from("kits")
      .select("id, nome")
      .order("nome", { ascending: true });

    const { data: kitItensData, error: kitItensError } = await supabase
      .from("kit_itens")
      .select("*");

    const { data: reservasData, error: reservasError } = await supabase
      .from("reservas")
      .select("id, kit_id, data_evento, status")
      .in("status", ["pendente", "confirmada"]);

    const { data: reservaItensData, error: reservaItensError } = await supabase
      .from("reserva_itens")
      .select("*");

    setCarregando(false);

    if (
      itensError ||
      kitsError ||
      kitItensError ||
      reservasError ||
      reservaItensError
    ) {
      alert(
        "Erro ao carregar estoque. Confira se o SQL supabase/inventory.sql ja foi executado no Supabase."
      );
      return;
    }

    setItens(itensData || []);
    setKits(kitsData || []);
    setKitItens(kitItensData || []);
    setReservas(reservasData || []);
    setReservaItens(reservaItensData || []);
  }

  function buscarKit(id: number) {
    return kits.find((kit) => kit.id === id);
  }

  function buscarVinculosDoItem(itemId: number) {
    return kitItens.filter((kitItem) => kitItem.item_id === itemId);
  }

  async function salvarItem() {
    if (!nome.trim()) {
      alert("Informe o nome do item.");
      return;
    }

    const quantidade = Number(quantidadeTotal);

    if (!Number.isFinite(quantidade) || quantidade < 0) {
      alert("Informe uma quantidade valida.");
      return;
    }

    setLoading(true);

    const payload = {
      nome: nome.trim(),
      quantidade_total: quantidade,
      descricao: descricao.trim() || null,
      ativo,
    };

    const { error } = editandoId
      ? await supabase.from("estoque_itens").update(payload).eq("id", editandoId)
      : await supabase.from("estoque_itens").insert(payload);

    setLoading(false);

    if (error) {
      alert(`Erro ao salvar item: ${error.message}`);
      return;
    }

    alert(editandoId ? "Item atualizado!" : "Item cadastrado!");
    limparFormulario();
    carregarDados();
  }

  function editarItem(item: EstoqueItem) {
    setEditandoId(item.id);
    setNome(item.nome);
    setQuantidadeTotal(String(item.quantidade_total));
    setDescricao(item.descricao || "");
    setAtivo(item.ativo);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function excluirItem(id: number) {
    if (!confirm("Deseja excluir este item do estoque?")) return;

    const { error } = await supabase.from("estoque_itens").delete().eq("id", id);

    if (error) {
      alert(`Erro ao excluir item: ${error.message}`);
      return;
    }

    carregarDados();
  }

  function limparFormulario() {
    setEditandoId(null);
    setNome("");
    setQuantidadeTotal("1");
    setDescricao("");
    setAtivo(true);
  }

  useEffect(() => {
    carregarDados();

    const intervalo = window.setInterval(() => {
      carregarDados();
    }, 30000);

    return () => window.clearInterval(intervalo);
  }, []);

  return (
    <AdminLayout>
      <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">
        Estoque de itens
      </h1>

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-3xl text-gray-700 dark:text-gray-300">
          Cadastre cada item uma vez, informe o total fisico e depois vincule
          esse item aos kits na pagina de Kits.
        </p>

        <button
          type="button"
          onClick={carregarDados}
          className="rounded-xl bg-gray-900 px-5 py-3 font-bold text-white dark:bg-white dark:text-gray-900"
        >
          Atualizar estoque
        </button>
      </div>

      <div className="mb-8 rounded-2xl bg-white p-6 shadow dark:bg-gray-900">
        <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
          {editandoId ? "Editar item de estoque" : "Cadastrar item de estoque"}
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome do item, ex: Arco romano"
            className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />

          <input
            value={quantidadeTotal}
            onChange={(e) => setQuantidadeTotal(e.target.value)}
            type="number"
            min="0"
            placeholder="Quantidade total no estoque"
            className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />

          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descricao opcional"
            className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white md:col-span-2"
          />

          <label className="flex items-center gap-3 font-bold text-gray-900 dark:text-white">
            <input
              checked={ativo}
              onChange={(e) => setAtivo(e.target.checked)}
              type="checkbox"
              className="h-5 w-5"
            />
            Item ativo
          </label>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={salvarItem}
            disabled={loading}
            className="rounded-xl bg-pink-600 px-6 py-3 font-bold text-white disabled:opacity-50"
          >
            {loading
              ? "Salvando..."
              : editandoId
              ? "Salvar alteracoes"
              : "+ Cadastrar Item"}
          </button>

          {editandoId && (
            <button
              type="button"
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

        {carregando ? (
          <p className="text-gray-700 dark:text-gray-300">
            Carregando estoque...
          </p>
        ) : itens.length === 0 ? (
          <p className="text-gray-700 dark:text-gray-300">
            Nenhum item cadastrado ainda.
          </p>
        ) : (
          <div className="grid gap-4">
            {itens.map((item) => {
              const resumo = calcularResumoItem(
                item.id,
                hoje,
                kitItens,
                itens,
                reservas,
                reservaItens
              );
              const vinculos = buscarVinculosDoItem(item.id);

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {item.nome}
                      </h3>

                      {item.descricao && (
                        <p className="mt-2 text-gray-700 dark:text-gray-300">
                          {item.descricao}
                        </p>
                      )}

                      <p className="mt-2 font-bold text-gray-700 dark:text-gray-300">
                        Status: {item.ativo ? "Ativo" : "Inativo"}
                      </p>
                    </div>

                    <div className="grid gap-2 text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Total fisico
                      </p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {resumo.total}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-3">
                    <div className="rounded-xl bg-white p-4 dark:bg-gray-900">
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Disponivel agora
                      </p>
                      <p className="text-2xl font-bold text-green-600">
                        {resumo.disponivel}
                      </p>
                    </div>

                    <div className="rounded-xl bg-white p-4 dark:bg-gray-900">
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Em uso por 48h
                      </p>
                      <p className="text-2xl font-bold text-yellow-500">
                        {resumo.emUso}
                      </p>
                    </div>

                    <div className="rounded-xl bg-white p-4 dark:bg-gray-900">
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Kits vinculados
                      </p>
                      <p className="text-2xl font-bold text-pink-600">
                        {vinculos.length}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-xl bg-white p-4 dark:bg-gray-900">
                    <p className="mb-3 font-bold text-gray-900 dark:text-white">
                      Usado nos kits
                    </p>

                    {vinculos.length === 0 ? (
                      <p className="text-gray-700 dark:text-gray-300">
                        Este item ainda nao esta vinculado a nenhum kit.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {vinculos.map((vinculo) => (
                          <span
                            key={vinculo.id}
                            className="rounded-full bg-gray-100 px-3 py-1 text-sm font-bold text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                          >
                            {buscarKit(vinculo.kit_id)?.nome || "Kit removido"}:
                            {" "}
                            {vinculo.quantidade}x
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={() => editarItem(item)}
                      className="rounded-xl bg-blue-600 px-4 py-2 font-bold text-white"
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => excluirItem(item.id)}
                      className="rounded-xl bg-red-600 px-4 py-2 font-bold text-white"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
