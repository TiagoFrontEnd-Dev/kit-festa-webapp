"use client";

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

const WHATSAPP_ADMIN = "5531995983128";

export default function KitsPage() {
  const [kits, setKits] = useState<Kit[]>([]);
  const [loading, setLoading] = useState(true);
  const [kitSelecionado, setKitSelecionado] = useState<Kit | null>(null);

  const [clienteNome, setClienteNome] = useState("");
  const [clienteTelefone, setClienteTelefone] = useState("");
  const [clienteEmail, setClienteEmail] = useState("");
  const [dataEvento, setDataEvento] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [salvando, setSalvando] = useState(false);

  const [datasOcupadas, setDatasOcupadas] = useState<string[]>([]);

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
    carregarKits();
  }, []);

  const hoje = new Date().toISOString().split("T")[0];
  const dataSelecionadaOcupada = dataEvento && dataEstaOcupada(dataEvento);

  return (
    <main className="min-h-screen bg-gray-100 px-6 py-16 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <section className="mx-auto max-w-7xl">
        <h1 className="mb-4 text-center text-5xl font-bold">
          Kits Disponíveis
        </h1>

        <p className="mb-12 text-center text-gray-700 dark:text-gray-300">
          Escolha o kit ideal para sua festa.
        </p>

        {loading ? (
          <p className="text-center text-gray-700 dark:text-gray-300">
            Carregando kits...
          </p>
        ) : kits.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow dark:bg-gray-900">
            <p className="text-gray-700 dark:text-gray-300">
              Nenhum kit disponível no momento.
            </p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-3">
            {kits.map((kit) => (
              <div
                key={kit.id}
                className="overflow-hidden rounded-2xl bg-white shadow dark:bg-gray-900"
              >
                {kit.imagem ? (
                  <img
                    src={kit.imagem}
                    alt={kit.nome}
                    className="h-64 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-64 items-center justify-center bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                    Sem imagem
                  </div>
                )}

                <div className="p-6">
                  <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
                    {kit.nome}
                  </h2>

                  <p className="mb-4 text-gray-700 dark:text-gray-300">
                    {kit.descricao || "Sem descrição."}
                  </p>

                  <p className="mb-5 text-2xl font-bold text-pink-600">
                    R$ {kit.preco}
                  </p>

                  <button
                    type="button"
                    onClick={() => abrirReserva(kit)}
                    className="w-full rounded-xl bg-pink-600 py-3 font-bold text-white"
                  >
                    Reservar
                  </button>
                </div>
              </div>
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
                className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />

              <input
                value={clienteTelefone}
                onChange={(e) => setClienteTelefone(e.target.value)}
                placeholder="WhatsApp"
                className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />

              <input
                value={clienteEmail}
                onChange={(e) => setClienteEmail(e.target.value)}
                placeholder="E-mail opcional"
                className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
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
                className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
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