"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ClientNotice, { ClientNoticeType } from "@/components/client/ClientNotice";
import { salvarClienteReserva } from "@/lib/customers";
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

type KitImagem = {
  id: number;
  kit_id: number;
  url: string;
  caminho: string | null;
  ordem: number;
  principal: boolean;
};

type NoticeState = {
  title: string;
  message: string;
  type: ClientNoticeType;
};

function dataHojeLocal() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

export default function KitDetalhesPage() {
  const params = useParams();

  const idParam = Array.isArray(params.id) ? params.id[0] : params.id;
  const kitId = Number(idParam);

  const [kit, setKit] = useState<Kit | null>(null);
  const [estoqueItens, setEstoqueItens] = useState<EstoqueItem[]>([]);
  const [kitItens, setKitItens] = useState<KitItem[]>([]);
  const [reservasAtivas, setReservasAtivas] = useState<ReservaEstoque[]>([]);
  const [reservaItens, setReservaItens] = useState<ReservaItem[]>([]);
  const [imagens, setImagens] = useState<KitImagem[]>([]);
  const [imagemAtual, setImagemAtual] = useState(0);
  const [loading, setLoading] = useState(true);
  const [modalReservaAberto, setModalReservaAberto] = useState(false);
  const [clienteNome, setClienteNome] = useState("");
  const [clienteTelefone, setClienteTelefone] = useState("");
  const [clienteEmail, setClienteEmail] = useState("");
  const [dataEvento, setDataEvento] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [notice, setNotice] = useState<NoticeState | null>(null);

  function mostrarAviso(title: string, message: string, type: ClientNoticeType = "info") {
    setNotice({ title, message, type });
  }

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

    const { data: imagensData, error: imagensError } = await supabase
      .from("kit_imagens")
      .select("*")
      .eq("kit_id", kitId)
      .order("ordem", { ascending: true });

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

    if (kitError) {
      mostrarAviso("Ops, algo saiu do lugar", `Nao conseguimos carregar este kit agora. ${kitError.message}`, "error");
      return;
    }

    if (imagensError) {
      mostrarAviso("As fotos nao carregaram", imagensError.message, "error");
      return;
    }

    if (estoqueError || kitItensError || reservasError || reservaItensError) {
      mostrarAviso(
        "Estoque indisponivel",
        "Nao conseguimos carregar o estoque neste momento. Tente novamente em instantes.",
        "error"
      );
      return;
    }

    if (!kitData) {
      setKit(null);
      return;
    }

    setKit(kitData);
    setImagens(imagensData || []);
    setEstoqueItens(estoqueData || []);
    setKitItens(kitItensData || []);
    setReservasAtivas(reservasData || []);
    setReservaItens(reservaItensData || []);
    setImagemAtual(0);
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
      mostrarAviso(
        "Nao foi possivel conferir a agenda",
        `Tente novamente em instantes. ${
          error?.message || reservaItensError?.message
        }`,
        "error"
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

  function buscarItensDoKit(kitIdAtual: number) {
    return kitItens.filter((item) => item.kit_id === kitIdAtual);
  }

  function buscarItemEstoque(itemId: number) {
    return estoqueItens.find((item) => item.id === itemId);
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

  function abrirReserva() {
    setModalReservaAberto(true);
    setClienteNome("");
    setClienteTelefone("");
    setClienteEmail("");
    setDataEvento("");
    setObservacoes("");
    carregarReservasAtivas();
  }

  function fecharReserva() {
    setModalReservaAberto(false);
  }

  function formatarData(data: string) {
    return new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR");
  }

  async function enviarReserva() {
    if (!kit) return;

    if (!clienteNome.trim() || !clienteTelefone.trim() || !dataEvento) {
      mostrarAviso(
        "So falta um pouquinho",
        "Preencha seu nome, WhatsApp e a data do evento para continuarmos com carinho.",
        "info"
      );
      return;
    }

    setSalvando(true);

    const dadosAtualizados = await carregarReservasAtivas();

    if (!dadosAtualizados) {
      setSalvando(false);
      return;
    }

    const disponibilidade = calcularDisponibilidadeKit(
      kit.id,
      dataEvento,
      kitItens,
      estoqueItens,
      dadosAtualizados.reservas,
      dadosAtualizados.reservaItens
    );

    if (!disponibilidade.disponivel) {
      setSalvando(false);
      mostrarAviso(
        "Essa data ficou apertadinha",
        `Alguns itens nao estao disponiveis nessa data: ${disponibilidade.faltantes
          .map((item) => `${item.nome} (${item.disponivel}/${item.necessario})`)
          .join(", ")}. Escolha outra data para tentarmos te atender melhor.`,
        "error"
      );
      return;
    }

    let clienteId: number;

    try {
      const cliente = await salvarClienteReserva({
        nome: clienteNome,
        telefone: clienteTelefone,
        email: clienteEmail,
      });

      clienteId = cliente.id;
    } catch (error) {
      setSalvando(false);
      mostrarAviso(
        "Nao conseguimos salvar seus dados",
        error instanceof Error
          ? error.message
          : "Tente novamente em instantes para seguirmos com sua reserva.",
        "error"
      );
      return;
    }

    const { data: reservaCriada, error } = await supabase
      .from("reservas")
      .insert({
        cliente_id: clienteId,
        kit_id: kit.id,
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
      mostrarAviso("Nao conseguimos enviar sua reserva", error.message, "error");
      return;
    }

    if (!reservaCriada) {
      setSalvando(false);
      mostrarAviso(
        "Nao conseguimos criar sua reserva",
        "Tente novamente em instantes para seguirmos com seu atendimento.",
        "error"
      );
      return;
    }

    const itensDaReserva = buscarItensDoKit(kit.id).map((item) => ({
      reserva_id: reservaCriada.id,
      kit_id: kit.id,
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
        mostrarAviso(
          "Nao conseguimos separar os itens",
          erroItensReserva.message,
          "error"
        );
        return;
      }
    }

    setSalvando(false);
    fecharReserva();
    carregarReservasAtivas();
    mostrarAviso(
      "Recebemos sua reserva",
      "Obrigada pelo carinho! Seus dados ja chegaram para o nosso atendimento e entraremos em contato em instantes para continuar tudo com voce.",
      "success"
    );
  }

  useEffect(() => {
    carregarKit();
  }, [kitId]);

  const imagemPrincipal =
    imagens.length > 0 ? imagens[imagemAtual].url : kit?.imagem || "";
  const hoje = dataHojeLocal();
  const disponibilidadeSelecionada =
    kit && dataEvento
      ? calcularDisponibilidadeKit(
          kit.id,
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
            Kit nao encontrado
          </h1>

          <p className="mb-6 text-gray-700 dark:text-gray-300">
            Esse kit pode ter sido removido ou o link esta incorreto.
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
                  {"<"}
                </button>

                <button
                  type="button"
                  onClick={proximaImagem}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/70 px-4 py-3 font-bold text-white"
                >
                  {">"}
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
            Voltar para kits
          </Link>

          <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">
            {kit.nome}
          </h1>

          <p className="mb-6 text-lg leading-8 text-gray-700 dark:text-gray-300">
            {kit.descricao || "Sem descricao."}
          </p>

          <p className="mb-8 text-4xl font-bold text-pink-600">
            R$ {kit.preco}
          </p>

          <div className="mb-8 rounded-2xl bg-gray-100 p-5 dark:bg-gray-800">
            <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
              Itens inclusos
            </h2>

            {buscarItensDoKit(kit.id).length === 0 ? (
              <p className="text-gray-700 dark:text-gray-300">
                Nenhum item cadastrado para este kit.
              </p>
            ) : (
              <ul className="grid gap-3">
                {buscarItensDoKit(kit.id).map((item) => {
                  const itemEstoque = buscarItemEstoque(item.item_id);

                  return (
                    <li
                      key={item.id}
                      className="flex items-center justify-between rounded-xl bg-white px-4 py-3 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                    >
                      <span>{itemEstoque?.nome || "Item nao encontrado"}</span>

                      <strong className="text-pink-600">
                        {item.quantidade}x
                      </strong>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="grid gap-3">
            <button
              type="button"
              onClick={abrirReserva}
              className="block w-full rounded-xl bg-pink-600 py-4 text-center text-lg font-bold text-white"
            >
              Reservar este kit
            </button>

            <Link
              href="/kits"
              className="block w-full rounded-xl bg-gray-900 py-4 text-center text-lg font-bold text-white dark:bg-white dark:text-gray-900"
            >
              Voltar para todos os kits
            </Link>
          </div>
        </div>
      </section>

      {modalReservaAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 px-4 py-8">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Reservar {kit.nome}
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
              {salvando ? "Enviando..." : "Enviar reserva"}
            </button>
          </div>
        </div>
      )}

      {notice && (
        <ClientNotice
          title={notice.title}
          message={notice.message}
          type={notice.type}
          onClose={() => setNotice(null)}
        />
      )}
    </main>
  );
}
