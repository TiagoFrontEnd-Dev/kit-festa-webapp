"use client";

import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Cliente, normalizarTelefone } from "@/lib/customers";
import { supabase } from "@/lib/supabase";

type Kit = {
  id: number;
  nome: string;
  preco: number;
};

type Reserva = {
  id: number;
  cliente_id: number | null;
  kit_id: number | null;
  cliente_nome: string;
  cliente_telefone: string;
  cliente_email: string | null;
  data_evento: string;
  observacoes: string | null;
  status: string;
  created_at: string;
};

export default function AdminClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [kits, setKits] = useState<Kit[]>([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);

  async function carregarClientes() {
    setLoading(true);

    const { data: clientesData, error: clientesError } = await supabase
      .from("clientes")
      .select("*")
      .order("nome", { ascending: true });

    const { data: reservasData, error: reservasError } = await supabase
      .from("reservas")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: kitsData, error: kitsError } = await supabase
      .from("kits")
      .select("id, nome, preco");

    setLoading(false);

    if (clientesError || reservasError || kitsError) {
      alert(
        "Erro ao carregar clientes. Confira se o SQL supabase/clients.sql ja foi executado no Supabase."
      );
      return;
    }

    setClientes(clientesData || []);
    setReservas(reservasData || []);
    setKits(kitsData || []);
  }

  function buscarKit(kitId: number | null) {
    return kits.find((kit) => kit.id === kitId);
  }

  function reservasDoCliente(cliente: Cliente) {
    return reservas.filter((reserva) => {
      if (reserva.cliente_id === cliente.id) return true;

      return (
        normalizarTelefone(reserva.cliente_telefone) ===
        cliente.telefone_normalizado
      );
    });
  }

  function formatarData(data: string) {
    return new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR");
  }

  function formatarCriadoEm(data: string) {
    return new Date(data).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function corStatus(status: string) {
    if (status === "confirmada") return "bg-green-600";
    if (status === "cancelada") return "bg-red-600";
    if (status === "finalizada") return "bg-blue-600";
    return "bg-yellow-500";
  }

  const clientesFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const telefoneBusca = normalizarTelefone(busca);

    if (!termo && !telefoneBusca) return clientes;

    return clientes.filter((cliente) => {
      const email = cliente.email || "";

      return (
        cliente.nome.toLowerCase().includes(termo) ||
        email.toLowerCase().includes(termo) ||
        cliente.telefone_normalizado.includes(telefoneBusca)
      );
    });
  }, [busca, clientes]);

  useEffect(() => {
    carregarClientes();
  }, []);

  return (
    <AdminLayout>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">
            Clientes
          </h1>

          <p className="text-gray-700 dark:text-gray-300">
            Clientes cadastrados automaticamente a partir das reservas.
          </p>
        </div>

        <button
          type="button"
          onClick={carregarClientes}
          className="rounded-xl bg-gray-900 px-5 py-3 font-bold text-white dark:bg-white dark:text-gray-900"
        >
          Atualizar clientes
        </button>
      </div>

      <div className="mb-8 rounded-2xl bg-white p-6 shadow dark:bg-gray-900">
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome, WhatsApp ou e-mail"
          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
      </div>

      <div className="rounded-2xl bg-white p-6 shadow dark:bg-gray-900">
        <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
          Clientes cadastrados
        </h2>

        {loading ? (
          <p className="text-gray-700 dark:text-gray-300">
            Carregando clientes...
          </p>
        ) : clientesFiltrados.length === 0 ? (
          <p className="text-gray-700 dark:text-gray-300">
            Nenhum cliente encontrado.
          </p>
        ) : (
          <div className="grid gap-6">
            {clientesFiltrados.map((cliente) => {
              const reservasCliente = reservasDoCliente(cliente);
              const ultimaReserva = reservasCliente[0];
              const totalReservas = reservasCliente.length;

              return (
                <article
                  key={cliente.id}
                  className="rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {cliente.nome}
                      </h3>

                      <p className="mt-2 text-gray-700 dark:text-gray-300">
                        WhatsApp: <strong>{cliente.telefone}</strong>
                      </p>

                      <p className="text-gray-700 dark:text-gray-300">
                        E-mail: {cliente.email || "Nao informado"}
                      </p>

                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Cliente desde {formatarCriadoEm(cliente.created_at)}
                      </p>
                    </div>

                    <div className="grid gap-2 text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Reservas
                      </p>

                      <p className="text-3xl font-bold text-pink-600">
                        {totalReservas}
                      </p>

                      <a
                        href={`https://wa.me/55${cliente.telefone_normalizado}`}
                        target="_blank"
                        className="rounded-xl bg-green-600 px-4 py-2 text-center text-sm font-bold text-white"
                      >
                        Chamar no WhatsApp
                      </a>
                    </div>
                  </div>

                  {ultimaReserva && (
                    <div className="mt-5 rounded-xl bg-white p-4 dark:bg-gray-900">
                      <p className="mb-2 font-bold text-gray-900 dark:text-white">
                        Ultima reserva
                      </p>

                      <div className="grid gap-2 text-gray-700 dark:text-gray-300 md:grid-cols-3">
                        <p>
                          Kit:{" "}
                          <strong>
                            {buscarKit(ultimaReserva.kit_id)?.nome ||
                              "Kit removido"}
                          </strong>
                        </p>

                        <p>
                          Data: {formatarData(ultimaReserva.data_evento)}
                        </p>

                        <p>
                          Status:{" "}
                          <span
                            className={`rounded-full px-3 py-1 text-sm font-bold text-white ${corStatus(
                              ultimaReserva.status
                            )}`}
                          >
                            {ultimaReserva.status}
                          </span>
                        </p>
                      </div>
                    </div>
                  )}

                  {reservasCliente.length > 0 && (
                    <div className="mt-5">
                      <p className="mb-3 font-bold text-gray-900 dark:text-white">
                        Historico de reservas
                      </p>

                      <div className="grid gap-3">
                        {reservasCliente.map((reserva) => {
                          const kit = buscarKit(reserva.kit_id);

                          return (
                            <div
                              key={reserva.id}
                              className="rounded-xl bg-white p-4 dark:bg-gray-900"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                  <p className="font-bold text-gray-900 dark:text-white">
                                    {kit?.nome || "Kit removido"}
                                  </p>

                                  <p className="text-sm text-gray-700 dark:text-gray-300">
                                    Evento em {formatarData(reserva.data_evento)}
                                  </p>
                                </div>

                                <span
                                  className={`rounded-full px-3 py-1 text-sm font-bold text-white ${corStatus(
                                    reserva.status
                                  )}`}
                                >
                                  {reserva.status}
                                </span>
                              </div>

                              {reserva.observacoes && (
                                <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">
                                  {reserva.observacoes}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
