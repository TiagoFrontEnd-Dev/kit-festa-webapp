import { NextResponse } from "next/server";
import type { AdminReservationNotification } from "@/lib/adminNotification";

function formatarData(data: string) {
  const [ano, mes, dia] = data.split("-");

  if (!ano || !mes || !dia) return data;

  return `${dia}/${mes}/${ano}`;
}

function formatarPreco(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

function montarMensagem(payload: AdminReservationNotification) {
  const itens =
    payload.itens.length > 0
      ? payload.itens
          .map((item) => `- ${item.nome}: ${item.quantidade}x`)
          .join("\n")
      : "- Nenhum item vinculado";

  return [
    "Nova reserva recebida",
    "",
    `Reserva: #${payload.reservaId}`,
    `Kit: ${payload.kitNome}`,
    `Valor: ${formatarPreco(payload.kitPreco)}`,
    `Data do evento: ${formatarData(payload.dataEvento)}`,
    "",
    "Cliente",
    `Nome: ${payload.clienteNome}`,
    `WhatsApp: ${payload.clienteTelefone}`,
    `E-mail: ${payload.clienteEmail || "Nao informado"}`,
    "",
    "Observacoes",
    payload.observacoes || "Sem observacoes",
    "",
    "Itens separados",
    itens,
  ].join("\n");
}

function normalizarTelefone(telefone?: string) {
  return telefone?.replace(/\D/g, "") || "";
}

export async function POST(request: Request) {
  const payload = (await request.json()) as AdminReservationNotification;
  const webhookUrl = process.env.WHATSAPP_WEBHOOK_URL;
  const webhookToken = process.env.WHATSAPP_WEBHOOK_TOKEN;
  const adminPhone = normalizarTelefone(process.env.WHATSAPP_ADMIN_PHONE);

  if (!webhookUrl) {
    return NextResponse.json({
      ok: false,
      configured: false,
      message:
        "WHATSAPP_WEBHOOK_URL nao configurado. A reserva foi salva, mas a notificacao automatica nao foi enviada.",
    });
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (webhookToken) {
    headers.Authorization = `Bearer ${webhookToken}`;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        to: adminPhone,
        message: montarMensagem(payload),
        reservation: payload,
      }),
    });

    return NextResponse.json({
      ok: response.ok,
      configured: true,
      status: response.status,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        configured: true,
        message:
          error instanceof Error
            ? error.message
            : "Falha ao enviar notificacao automatica.",
      },
      { status: 502 }
    );
  }
}
