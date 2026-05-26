"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  calcularDisponibilidadeKit,
  EstoqueItem,
  KitItem,
  ReservaItem,
  ReservaEstoque,
} from "@/lib/inventory";

type Kit = {
  id: number;
  nome: string;
  descricao: string | null;
  preco: number;
  imagem: string | null;
  ativo: boolean;
};

const WHATSAPP_ADMIN = "5531995983128";

function dataHojeLocal() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

export default function KitsPage() {
  const [kits, setKits] = useState<Kit[]>([]);
  const [estoqueItens, setEstoqueItens] = useState<EstoqueItem[]>([]);
  const [kitItens, setKitItens] = useState<KitItem[]>([]);
  const [reservasAtivas, setReservasAtivas] = useState<ReservaEstoque[]>([]);
  const [reservaItens, setReservaItens] = useState<ReservaItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [kitSelecionado, setKitSelecionado] = useState<Kit | null>(null);
  const [clienteNome, setClienteNome] = useState("");
  const [clienteTelefone, setClienteTelefone] = useState("");
  const [clienteEmail, setClienteEmail] = useState("");
  const [dataEvento, setDataEvento] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function carregarDados() {
    setLoading(true);

    const { data: kitsData, error: kitsError } = await supabase
      .from("kits")
      .select("*")
      .eq("ativo", true)
      .order("nome", { ascending: true });

    const { data: estoqueData, error: estoqueError } = await supabase
      .from("estoque_itens")
      .select("*")
      .eq("ativo", true)
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

    setLoading(false);

    if (kitsError) {
      alert(`Erro ao carregar kits: ${kitsError.message}`);
      return;
    }

    if (estoqueError || kitItensError || reservasError || reservaItensError) {
      alert(
        "Erro ao carregar estoque. Execute o SQL supabase/inventory.sql no Supabase antes de usar o controle de itens."
      );
      return;
    }

    const kitsOrdenados = [...(kitsData || [])].sort((a, b) =>
      a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" })
    );

    setKits(kitsOrdenados);
    setEstoqueItens(estoqueData || []);
    setKitItens(kitItensData || []);
    setReservasAtivas(reservasData || []);
    setReservaItens(reservaItensData || []);
  }

  async function carregarReservasAtivas() {
    const { data, error } = await supabase
      .from("reservas")
      .select("id, kit_id, data_evento, status")
      .in("status", ["pendente", "confirmada"]);

    const { data: reservaItensData, error: reservaItensError } = await supabase
      .from("reserva_itens")
      .select("*");

    if (error || reservaItensError) {
      alert(
        `Erro ao carregar reservas ativas: ${
          error?.message || reservaItensError?.message
        }`
      );
      return null;
    }

    const lista = data || [];
    const listaItens = reservaItensData || [];
    setReservasAtivas(lista);
    setReservaItens(listaItens);
    return {
      reservas: lista,
      reservaItens: listaItens,
    };
  }

  function buscarItensDoKit(kitId: number) {
    return kitItens.filter((item) => item.kit_id === kitId);
  }

  function buscarItemEstoque(itemId: number) {
    return estoqueItens.find((item) => item.id === itemId);
  }

  function abrirReserva(kit: Kit) {
    setKitSelecionado(kit);
    setClienteNome("");
    setClienteTelefone("");
    setClienteEmail("");
    setDataEvento("");
    setObservacoes("");
    carregarReservasAtivas();
  }

  function fecharReserva() {
    setKitSelecionado(null);
  }

  function formatarData(data: string) {
    return new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR");
  }

  function montarListaItensDoKit(kitId: number) {
    const itensDoKit = buscarItensDoKit(kitId);

    if (itensDoKit.length === 0) {
      return "Nenhum item cadastrado para este kit.";
    }

    return itensDoKit
      .map((item) => {
        const itemEstoque = buscarItemEstoque(item.item_id);
        return `- ${item.quantidade}x ${itemEstoque?.nome || "Item nao encontrado"}`;
      })
      .join("\n");
  }

  function abrirWhatsApp() {
    if (!kitSelecionado) return;

    const mensagem = `
NOVA SOLICITACAO DE RESERVA

Kit selecionado:
${kitSelecionado.nome}

Valor:
R$ ${kitSelecionado.preco}

Data do evento:
${formatarData(dataEvento)}

Itens inclusos no kit:
${montarListaItensDoKit(kitSelecionado.id)}

Dados do cliente

Nome:
${clienteNome}

WhatsApp:
${clienteTelefone}

E-mail:
${clienteEmail || "Nao informado"}

Observacoes:
${observacoes || "Nenhuma observacao."}

Reserva enviada pelo sistema ArtePinte
    `.trim();

    const url = `https://wa.me/${WHATSAPP_ADMIN}?text=${encodeURIComponent(
      mensagem
    )}`;

    window.open(url, "_blank");
  }

  async function enviarReserva() {
    if (!kitSelecionado) return;

    if (!clienteNome.trim() || !clienteTelefone.trim() || !dataEvento) {
      alert("Preencha nome, telefone e data do evento.");
      return;
    }

    setSalvando(true);

    const dadosAtualizados = await carregarReservasAtivas();

    if (!dadosAtualizados) {
      setSalvando(false);
      return;
    }

    const disponibilidade = calcularDisponibilidadeKit(
      kitSelecionado.id,
      dataEvento,
      kitItens,
      estoqueItens,
      dadosAtualizados.reservas,
      dadosAtualizados.reservaItens
    );

    if (!disponibilidade.disponivel) {
      setSalvando(false);
      alert(
        `Nao ha estoque suficiente para esta data: ${disponibilidade.faltantes
          .map((item) => `${item.nome} (${item.disponivel}/${item.necessario})`)
          .join(", ")}`
      );
      return;
    }

    const { data: reservaCriada, error } = await supabase
      .from("reservas")
      .insert({
        kit_id: kitSelecionado.id,
        cliente_nome: clienteNome.trim(),
        cliente_telefone: clienteTelefone.trim(),
        cliente_email: clienteEmail.trim(),
        data_evento: dataEvento,
        observacoes: observacoes.trim(),
        status: "pendente",
      })
      .select("id")
      .single();

    if (error) {
      setSalvando(false);
      alert(`Erro ao enviar reserva: ${error.message}`);
      return;
    }

    if (!reservaCriada) {
      setSalvando(false);
      alert("Erro ao criar reserva.");
      return;
    }

    const itensDaReserva = buscarItensDoKit(kitSelecionado.id).map((item) => ({
      reserva_id: reservaCriada.id,
      kit_id: kitSelecionado.id,
      item_id: item.item_id,
      quantidade: item.quantidade,
    }));

    if (itensDaReserva.length > 0) {
      const { error: erroItensReserva } = await supabase
        .from("reserva_itens")
        .insert(itensDaReserva);

      if (erroItensReserva) {
        await supabase.from("reservas").delete().eq("id", reservaCriada.id);
        setSalvando(false);
        alert(`Erro ao reservar itens do estoque: ${erroItensReserva.message}`);
        return;
      }
    }

    setSalvando(false);
    abrirWhatsApp();
    alert("Reserva enviada com sucesso! O WhatsApp sera aberto com a mensagem pronta.");
    fecharReserva();
    carregarReservasAtivas();
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const hoje = dataHojeLocal();
  const disponibilidadeSelecionada =
    kitSelecionado && dataEvento
      ? calcularDisponibilidadeKit(
          kitSelecionado.id,
          dataEvento,
          kitItens,
          estoqueItens,
          reservasAtivas,
          reservaItens
        )
      : null;
  const estoqueIndisponivel =
    Boolean(disponibilidadeSelecionada) &&
    disponibilidadeSelecionada?.disponivel === false;

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-14 text-gray-900 dark:bg-gray-950 dark:text-white md:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="mb-14 text-center">
          <h1 className="text-4xl font-bold md:text-6xl">
            Kits Disponiveis
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
              Nenhum kit disponivel no momento.
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
                    Disponivel
                  </div>
                </div>

                <div className="p-6">
                  <h2 className="mb-3 text-3xl font-bold text-gray-900 dark:text-white">
                    {kit.nome}
                  </h2>

                  <p className="line-clamp-5 min-h-[140px] text-gray-700 dark:text-gray-300">
                    {kit.descricao || "Sem descricao."}
                  </p>

                  <div className="mt-6 flex items-center justify-between">
                    <p className="text-3xl font-bold text-pink-600">
                      R$ {kit.preco}
                    </p>

                    <div className="h-3 w-3 rounded-full bg-green-500" />
                  </div>

                  <div className="mt-6 grid gap-3">
                    <Link
                      href={`/kits/${kit.id}`}
                      className="rounded-2xl bg-gray-900 px-6 py-4 text-center font-bold text-white transition hover:opacity-90 dark:bg-white dark:text-gray-900"
                    >
                      Ver detalhes
                    </Link>

                    <button
                      type="button"
                      onClick={() => abrirReserva(kit)}
                      className="rounded-2xl bg-pink-600 px-6 py-4 text-center font-bold text-white transition hover:bg-pink-700"
                    >
                      Reservar agora
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {kitSelecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 px-4 py-8">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Reservar {kitSelecionado.nome}
                </h2>

                <p className="mt-2 text-gray-700 dark:text-gray-300">
                  Escolha uma data e confira se todos os itens do kit estao
                  disponiveis.
                </p>
              </div>

              <button
                type="button"
                onClick={fecharReserva}
                className="rounded-lg bg-gray-200 px-3 py-2 font-bold text-gray-900 dark:bg-gray-700 dark:text-white"
              >
                X
              </button>
            </div>

            <div className="mb-5 rounded-2xl bg-gray-100 p-4 dark:bg-gray-800">
              <h3 className="mb-3 font-bold text-gray-900 dark:text-white">
                Disponibilidade do estoque
              </h3>

              {!dataEvento ? (
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Selecione a data do evento para verificar o estoque.
                </p>
              ) : disponibilidadeSelecionada?.disponivel ? (
                <p className="text-sm font-bold text-green-600">
                  Estoque disponivel para este kit em {formatarData(dataEvento)}.
                </p>
              ) : (
                <div className="grid gap-2">
                  <p className="text-sm font-bold text-red-600">
                    Estoque insuficiente para esta data.
                  </p>

                  {disponibilidadeSelecionada?.faltantes.map((item) => (
                    <p
                      key={item.itemId}
                      className="rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-700 dark:bg-red-950/40 dark:text-red-200"
                    >
                      {item.nome}: disponivel {item.disponivel}, necessario{" "}
                      {item.necessario}
                    </p>
                  ))}
                </div>
              )}
            </div>

            <div className="grid gap-4">
              <input
                value={clienteNome}
                onChange={(e) => setClienteNome(e.target.value)}
                placeholder="Seu nome"
                className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />

              <input
                value={clienteTelefone}
                onChange={(e) => setClienteTelefone(e.target.value)}
                placeholder="WhatsApp"
                className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />

              <input
                value={clienteEmail}
                onChange={(e) => setClienteEmail(e.target.value)}
                placeholder="E-mail opcional"
                className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />

              <input
                value={dataEvento}
                onChange={(e) => setDataEvento(e.target.value)}
                type="date"
                min={hoje}
                className={`w-full rounded-xl border px-4 py-3 text-gray-900 dark:bg-gray-800 dark:text-white ${
                  estoqueIndisponivel
                    ? "border-red-600 bg-red-50 dark:border-red-500"
                    : "border-gray-300 bg-white dark:border-gray-700"
                }`}
              />

              <textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Observacoes"
                className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <button
              type="button"
              onClick={enviarReserva}
              disabled={salvando || estoqueIndisponivel}
              className="mt-6 w-full rounded-xl bg-pink-600 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {salvando ? "Enviando..." : "Enviar reserva e abrir WhatsApp"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
