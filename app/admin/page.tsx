"use client";

import { useCallback, useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import StatCard from "@/components/cards/StatCard";
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
  data_evento: string;
  status: string;
};

export default function AdminPage() {
  const [totalKits, setTotalKits] = useState(0);
  const [totalReservas, setTotalReservas] = useState(0);
  const [reservasPendentes, setReservasPendentes] = useState(0);
  const [faturamento, setFaturamento] = useState(0);
  const [proximasReservas, setProximasReservas] = useState<Reserva[]>([]);
  const [kits, setKits] = useState<Kit[]>([]);

  const carregarDashboard = useCallback(async () => {
    const { data: kitsData, error: kitsError } = await supabase
      .from("kits")
      .select("id, nome, preco");

    const { data: reservasData, error: reservasError } = await supabase
      .from("reservas")
      .select("id, kit_id, cliente_nome, data_evento, status")
      .order("data_evento", { ascending: true });

    if (kitsError) {
      alert(`Erro ao carregar kits: ${kitsError.message}`);
      return;
    }

    if (reservasError) {
      alert(`Erro ao carregar reservas: ${reservasError.message}`);
      return;
    }

    const listaKits = kitsData || [];
    const listaReservas = reservasData || [];

    setKits(listaKits);
    setTotalKits(listaKits.length);
    setTotalReservas(listaReservas.length);

    const pendentes = listaReservas.filter(
      (reserva) => reserva.status === "pendente"
    ).length;

    setReservasPendentes(pendentes);

    const faturamentoConfirmado = listaReservas
      .filter((reserva) => reserva.status === "confirmada")
      .reduce((total, reserva) => {
        const kit = listaKits.find((item) => item.id === reserva.kit_id);
        return total + Number(kit?.preco || 0);
      }, 0);

    setFaturamento(faturamentoConfirmado);

    const hoje = new Date().toISOString().split("T")[0];

    const proximas = listaReservas
      .filter((reserva) => reserva.data_evento >= hoje)
      .slice(0, 5);

    setProximasReservas(proximas);
  }, []);

  function buscarKit(kitId: number | null) {
    return kits.find((kit) => kit.id === kitId);
  }

  function formatarData(data: string) {
    return new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR");
  }

  useEffect(() => {
    const carregamento = window.setTimeout(() => {
      void carregarDashboard();
    }, 0);

    return () => window.clearTimeout(carregamento);
  }, [carregarDashboard]);

  return (
    <AdminLayout>
      <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">
        Dashboard
      </h1>

      <p className="mb-8 text-gray-700 dark:text-gray-300">
        Resumo geral do seu sistema.
      </p>

      <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard titulo="Kits cadastrados" valor={String(totalKits)} />
        <StatCard titulo="Reservas totais" valor={String(totalReservas)} />
        <StatCard titulo="Pendentes" valor={String(reservasPendentes)} />
        <StatCard
          titulo="Faturamento"
          valor={`R$ ${faturamento.toFixed(2)}`}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow dark:bg-gray-900">
          <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
            Próximas reservas
          </h2>

          {proximasReservas.length === 0 ? (
            <p className="text-gray-700 dark:text-gray-300">
              Nenhuma reserva futura encontrada.
            </p>
          ) : (
            <div className="grid gap-4">
              {proximasReservas.map((reserva) => {
                const kit = buscarKit(reserva.kit_id);

                return (
                  <div
                    key={reserva.id}
                    className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"
                  >
                    <h3 className="font-bold text-gray-900 dark:text-white">
                      {reserva.cliente_nome}
                    </h3>

                    <p className="text-gray-700 dark:text-gray-300">
                      Kit: {kit?.nome || "Kit não encontrado"}
                    </p>

                    <p className="text-gray-700 dark:text-gray-300">
                      Data: {formatarData(reserva.data_evento)}
                    </p>

                    <p className="font-bold text-pink-600">
                      Status: {reserva.status}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-white p-6 shadow dark:bg-gray-900">
          <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
            Situação do negócio
          </h2>

          <div className="grid gap-4">
            <div className="rounded-xl bg-gray-100 p-4 dark:bg-gray-800">
              <p className="text-gray-700 dark:text-gray-300">
                Reservas pendentes
              </p>

              <p className="text-3xl font-bold text-yellow-500">
                {reservasPendentes}
              </p>
            </div>

            <div className="rounded-xl bg-gray-100 p-4 dark:bg-gray-800">
              <p className="text-gray-700 dark:text-gray-300">
                Faturamento confirmado
              </p>

              <p className="text-3xl font-bold text-green-600">
                R$ {faturamento.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
