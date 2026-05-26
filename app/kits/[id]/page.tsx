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

const WHATSAPP_ADMIN = "5531995983128";

export default function KitDetalhesPage() {
  const params = useParams();

  const idParam = Array.isArray(params.id) ? params.id[0] : params.id;
  const kitId = Number(idParam);

  const [kit, setKit] = useState<Kit | null>(null);
  const [itens, setItens] = useState<Item[]>([]);
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
  const [datasOcupadas, setDatasOcupadas] = useState<string[]>([]);

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

  function abrirReserva() {
    setModalReservaAberto(true);
    setClienteNome("");
    setClienteTelefone("");
    setClienteEmail("");
    setDataEvento("");
    setObservacoes("");
    carregarDatasOcupadas();
  }

  function fecharReserva() {
    setModalReservaAberto(false);
  }

  function dataEstaOcupada(data: string) {
    return datasOcupadas.includes(data);
  }

  function formatarData(data: string) {
    return new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR");
  }

  function abrirWhatsApp() {
    if (!kit) return;

    const listaItens =
      itens.length > 0
        ? itens.map((item) => `- ${item.quantidade}x ${item.nome}`).join("\n")
        : "Nenhum item cadastrado para este kit.";

    const mensagem = `
NOVA SOLICITACAO DE RESERVA

Kit selecionado:
${kit.nome}

Valor:
R$ ${kit.preco}

Data do evento:
${formatarData(dataEvento)}

Itens inclusos no kit:
${listaItens}

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
    if (!kit) return;

    if (!clienteNome.trim() || !clienteTelefone.trim() || !dataEvento) {
      alert("Preencha nome, telefone e data do evento.");
      return;
    }

    if (dataEstaOcupada(dataEvento)) {
      alert("Esta data ja esta ocupada. Escolha outra data.");
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
      alert("Esta data ja possui uma reserva pendente ou confirmada.");
      carregarDatasOcupadas();
      return;
    }

    const { error } = await supabase.from("reservas").insert({
      kit_id: kit.id,
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
    alert("Reserva enviada com sucesso! O WhatsApp sera aberto com a mensagem pronta.");
    fecharReserva();
  }

  useEffect(() => {
    carregarKit();
  }, [kitId]);

  const imagemPrincipal =
    imagens.length > 0 ? imagens[imagemAtual].url : kit?.imagem || "";
  const hoje = new Date().toISOString().split("T")[0];
  const dataSelecionadaOcupada = dataEvento && dataEstaOcupada(dataEvento);

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
                  Escolha uma data disponivel e preencha seus dados.
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
                    Esta data esta ocupada. Escolha outra.
                  </p>
                )}

                {dataEvento && !dataSelecionadaOcupada && (
                  <p className="mt-2 font-bold text-green-600">
                    Data disponivel.
                  </p>
                )}
              </div>

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
