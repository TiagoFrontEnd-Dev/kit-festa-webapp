"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/lib/supabase";

type Kit = {
  id: number;
  nome: string;
  preco: number;
};

type Reserva = {
  id: number;
  kit_id: number | null;
  cliente_nome: string;
  cliente_telefone: string;
  cliente_email: string | null;
  data_evento: string;
  observacoes: string | null;
  status: string;
  created_at: string;
};

export default function AdminReservasPage() {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [kits, setKits] = useState<Kit[]>([]);
  const [loading, setLoading] = useState(true);

  async function carregarReservas() {
    setLoading(true);

    const { data: kitsData, error: kitsError } = await supabase
      .from("kits")
      .select("id, nome, preco");

    const { data: reservasData, error: reservasError } = await supabase
      .from("reservas")
      .select("*")
      .order("id", { ascending: false });

    setLoading(false);

    if (kitsError) {
      alert(`Erro ao carregar kits: ${kitsError.message}`);
      return;
    }

    if (reservasError) {
      alert(`Erro ao carregar reservas: ${reservasError.message}`);
      return;
    }

    setKits(kitsData || []);
    setReservas(reservasData || []);
  }

  function buscarKit(kitId: number | null) {
    return kits.find((kit) => kit.id === kitId);
  }

  async function atualizarStatus(id: number, status: string) {
    const { error } = await supabase
      .from("reservas")
      .update({ status })
      .eq("id", id);

    if (error) {
      alert(`Erro ao atualizar status: ${error.message}`);
      return;
    }

    carregarReservas();
  }

  async function excluirReserva(id: number) {
    const confirmar = confirm("Tem certeza que deseja excluir esta reserva?");
    if (!confirmar) return;

    const { error } = await supabase.from("reservas").delete().eq("id", id);

    if (error) {
      alert(`Erro ao excluir reserva: ${error.message}`);
      return;
    }

    alert("Reserva excluída com sucesso!");
    carregarReservas();
  }

  function formatarData(data: string) {
    return new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR");
  }

  function corStatus(status: string) {
    if (status === "confirmada") return "bg-green-600";
    if (status === "cancelada") return "bg-red-600";
    if (status === "finalizada") return "bg-blue-600";
    return "bg-yellow-500";
  }

  useEffect(() => {
    carregarReservas();
  }, []);

  return (
    <AdminLayout>
      <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">
        Reservas
      </h1>

      <p className="mb-8 text-gray-700 dark:text-gray-300">
        Acompanhe solicitações, confirme eventos e gerencie reservas.
      </p>

      <div className="rounded-2xl bg-white p-6 shadow dark:bg-gray-900">
        <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
          Reservas recebidas
        </h2>

        {loading ? (
          <p className="text-gray-700 dark:text-gray-300">
            Carregando reservas...
          </p>
        ) : reservas.length === 0 ? (
          <p className="text-gray-700 dark:text-gray-300">
            Nenhuma reserva registrada ainda.
          </p>
        ) : (
          <div className="grid gap-6">
            {reservas.map((reserva) => {
              const kit = buscarKit(reserva.kit_id);

              return (
                <div
                  key={reserva.id}
                  className="rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {reserva.cliente_nome}
                      </h3>

                      <p className="mt-1 text-gray-700 dark:text-gray-300">
                        Kit:{" "}
                        <span className="font-bold">
                          {kit?.nome || "Kit não encontrado"}
                        </span>
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-4 py-2 text-sm font-bold text-white ${corStatus(
                        reserva.status
                      )}`}
                    >
                      {reserva.status}
                    </span>
                  </div>

                  <div className="grid gap-3 text-gray-700 dark:text-gray-300 md:grid-cols-2">
                    <p>
                      <strong>WhatsApp:</strong> {reserva.cliente_telefone}
                    </p>

                    <p>
                      <strong>E-mail:</strong>{" "}
                      {reserva.cliente_email || "Não informado"}
                    </p>

                    <p>
                      <strong>Data do evento:</strong>{" "}
                      {formatarData(reserva.data_evento)}
                    </p>

                    <p>
                      <strong>Valor do kit:</strong> R$ {kit?.preco || 0}
                    </p>
                  </div>

                  {reserva.observacoes && (
                    <p className="mt-4 text-gray-700 dark:text-gray-300">
                      <strong>Observações:</strong> {reserva.observacoes}
                    </p>
                  )}

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        atualizarStatus(reserva.id, "confirmada")
                      }
                      className="rounded-xl bg-green-600 px-4 py-2 font-bold text-white"
                    >
                      Confirmar
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        atualizarStatus(reserva.id, "pendente")
                      }
                      className="rounded-xl bg-yellow-500 px-4 py-2 font-bold text-white"
                    >
                      Pendente
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        atualizarStatus(reserva.id, "finalizada")
                      }
                      className="rounded-xl bg-blue-600 px-4 py-2 font-bold text-white"
                    >
                      Finalizar
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        atualizarStatus(reserva.id, "cancelada")
                      }
                      className="rounded-xl bg-red-600 px-4 py-2 font-bold text-white"
                    >
                      Cancelar
                    </button>

                    <button
                      type="button"
                      onClick={() => excluirReserva(reserva.id)}
                      className="rounded-xl bg-gray-700 px-4 py-2 font-bold text-white"
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