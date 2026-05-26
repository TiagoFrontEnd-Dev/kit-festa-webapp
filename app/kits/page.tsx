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

type Item = {
  id: number;
  kit_id: number | null;
  nome: string;
  quantidade: number;
  descricao: string | null;
  ativo: boolean;
};

const WHATSAPP_ADMIN = "5531995983128";

export default function KitsPage() {
  const [kits, setKits] = useState<Kit[]>([]);
  const [itens, setItens] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const [kitSelecionado, setKitSelecionado] = useState<Kit | null>(null);
  const [clienteNome, setClienteNome] = useState("");
  const [clienteTelefone, setClienteTelefone] = useState("");
  const [clienteEmail, setClienteEmail] = useState("");
  const [dataEvento, setDataEvento] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [datasOcupadas, setDatasOcupadas] = useState<string[]>([]);

  async function carregarDados() {
    setLoading(true);

    const { data: kitsData, error: kitsError } = await supabase
      .from("kits")
      .select("*")
      .eq("ativo", true)
      .order("nome", { ascending: true });

    const { data: itensData, error: itensError } = await supabase
      .from("itens")
      .select("*")
      .eq("ativo", true)
      .order("id", { ascending: true });

    setLoading(false);

    if (kitsError) {
      alert(`Erro ao carregar kits: ${kitsError.message}`);
      return;
    }

    if (itensError) {
      alert(`Erro ao carregar itens: ${itensError.message}`);
      return;
    }

    const kitsOrdenados = [...(kitsData || [])].sort((a, b) =>
      a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" })
    );

    setKits(kitsOrdenados);
    setItens(itensData || []);
  }

  async function carregarDatasOcupadas() {
    const { data, error } = await supabase
      .from("reservas")
      .select("data_evento")
      .in("status", ["pendente", "confirmada"]);

    if (error) {
      alert(`Erro ao carregar datas ocupadas: ${error.message}`);
      return;
    }

    setDatasOcupadas(data?.map((reserva) => reserva.data_evento) || []);
  }

  function buscarItensDoKit(kitId: number) {
    return itens.filter((item) => item.kit_id === kitId);
  }

  function abrirReserva(kit: Kit) {
    setKitSelecionado(kit);
    setClienteNome("");
    setClienteTelefone("");
    setClienteEmail("");
    setDataEvento("");
    setObservacoes("");
    carregarDatasOcupadas();
  }

  function fecharReserva() {
    setKitSelecionado(null);
  }

  function dataEstaOcupada(data: string) {
    return datasOcupadas.includes(data);
  }

  function formatarData(data: string) {
    return new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR");
  }

  function abrirWhatsApp() {
    if (!kitSelecionado) return;

    const itensDoKit = buscarItensDoKit(kitSelecionado.id);

    const listaItens =
      itensDoKit.length > 0
        ? itensDoKit
            .map((item) => `• ${item.quantidade}x ${item.nome}`)
            .join("\n")
        : "Nenhum item cadastrado para este kit.";

    const mensagem = `
🎉 *NOVA SOLICITAÇÃO DE RESERVA*

━━━━━━━━━━━━━━━

📦 *Kit Selecionado:*
${kitSelecionado.nome}

💰 *Valor:*
R$ ${kitSelecionado.preco}

📅 *Data do Evento:*
${formatarData(dataEvento)}

━━━━━━━━━━━━━━━

🎁 *Itens inclusos no kit:*
${listaItens}

━━━━━━━━━━━━━━━

👤 *Dados do Cliente*

Nome:
${clienteNome}

WhatsApp:
${clienteTelefone}

E-mail:
${clienteEmail || "Não informado"}

━━━━━━━━━━━━━━━

📝 *Observações:*
${observacoes || "Nenhuma observação."}

━━━━━━━━━━━━━━━

Reserva enviada pelo sistema Kit Festa 🚀
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

    if (dataEstaOcupada(dataEvento)) {
      alert("Esta data já está ocupada. Escolha outra data.");
      return;
    }

    setSalvando(true);

    const { data: reservasExistentes, error: erroBusca } = await supabase
      .from("reservas")
      .select("id, status")
      .eq("data_evento", dataEvento)
      .in("status", ["pendente", "confirmada"]);

    if (erroBusca) {
      setSalvando(false);
      alert(`Erro ao verificar disponibilidade: ${erroBusca.message}`);
      return;
    }

    if (reservasExistentes && reservasExistentes.length > 0) {
      setSalvando(false);
      alert("Esta data já possui uma reserva pendente ou confirmada.");
      carregarDatasOcupadas();
      return;
    }

    const { error } = await supabase.from("reservas").insert({
      kit_id: kitSelecionado.id,
      cliente_nome: clienteNome.trim(),
      cliente_telefone: clienteTelefone.trim(),
      cliente_email: clienteEmail.trim(),
      data_evento: dataEvento,
      observacoes: observacoes.trim(),
      status: "pendente",
    });

    setSalvando(false);

    if (error) {
      alert(`Erro ao enviar reserva: ${error.message}`);
      return;
    }

    abrirWhatsApp();
    alert("Reserva enviada com sucesso! O WhatsApp será aberto com a mensagem pronta.");
    fecharReserva();
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const hoje = new Date().toISOString().split("T")[0];
  const dataSelecionadaOcupada = dataEvento && dataEstaOcupada(dataEvento);

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
                    Disponível
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
                  Escolha uma data disponível e preencha seus dados.
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
                Datas ocupadas
              </h3>

              {datasOcupadas.length === 0 ? (
                <p className="text-sm text-green-600">
                  Nenhuma data ocupada no momento.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {datasOcupadas.map((data) => (
                    <span
                      key={data}
                      className="rounded-full bg-red-600 px-3 py-1 text-sm font-bold text-white"
                    >
                      {formatarData(data)}
                    </span>
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

              <div>
                <input
                  value={dataEvento}
                  onChange={(e) => setDataEvento(e.target.value)}
                  type="date"
                  min={hoje}
                  className={`w-full rounded-xl border px-4 py-3 text-gray-900 dark:bg-gray-800 dark:text-white ${
                    dataSelecionadaOcupada
                      ? "border-red-600 bg-red-50 dark:border-red-500"
                      : "border-gray-300 bg-white dark:border-gray-700"
                  }`}
                />

                {dataSelecionadaOcupada && (
                  <p className="mt-2 font-bold text-red-600">
                    Esta data está ocupada. Escolha outra.
                  </p>
                )}

                {dataEvento && !dataSelecionadaOcupada && (
                  <p className="mt-2 font-bold text-green-600">
                    Data disponível.
                  </p>
                )}
              </div>

              <textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Observações"
                className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <button
              type="button"
              onClick={enviarReserva}
              disabled={salvando || Boolean(dataSelecionadaOcupada)}
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
