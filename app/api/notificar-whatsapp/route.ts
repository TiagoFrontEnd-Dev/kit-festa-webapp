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
    payload.itens.length > 0 ? montarListaItens(payload) : "- Nenhum item vinculado";

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

function montarListaItens(payload: AdminReservationNotification) {
  return payload.itens
    .map((item) => `- ${item.nome}: ${item.quantidade}x`)
    .join("\n");
}

function normalizarTelefone(telefone?: string) {
  return telefone?.replace(/\D/g, "") || "";
}

function montarTemplateMeta(payload: AdminReservationNotification) {
  const templateName = process.env.META_WHATSAPP_TEMPLATE_NAME || "nova_reserva_admin";
  const languageCode = process.env.META_WHATSAPP_TEMPLATE_LANGUAGE || "pt_BR";
  const itens = montarListaItens(payload) || "Nenhum item vinculado";

  return {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: normalizarTelefone(process.env.WHATSAPP_ADMIN_PHONE),
    type: "template",
    template: {
      name: templateName,
      language: {
        code: languageCode,
      },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: String(payload.reservaId) },
            { type: "text", text: payload.kitNome },
            { type: "text", text: formatarPreco(payload.kitPreco) },
            { type: "text", text: formatarData(payload.dataEvento) },
            { type: "text", text: payload.clienteNome },
            { type: "text", text: payload.clienteTelefone },
            { type: "text", text: payload.clienteEmail || "Nao informado" },
            { type: "text", text: payload.observacoes || "Sem observacoes" },
            { type: "text", text: itens },
          ],
        },
      ],
    },
  };
}

function montarTextoMeta(payload: AdminReservationNotification) {
  return {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: normalizarTelefone(process.env.WHATSAPP_ADMIN_PHONE),
    type: "text",
    text: {
      preview_url: false,
      body: montarMensagem(payload),
    },
  };
}

async function enviarMetaCloudApi(payload: AdminReservationNotification) {
  const accessToken = process.env.META_WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID;
  const apiVersion = process.env.META_WHATSAPP_API_VERSION || "v25.0";

  if (!accessToken || !phoneNumberId) {
    return NextResponse.json({
      ok: false,
      configured: false,
      message:
        "META_WHATSAPP_ACCESS_TOKEN e META_WHATSAPP_PHONE_NUMBER_ID nao configurados.",
    });
  }

  const useTemplate = process.env.META_WHATSAPP_USE_TEMPLATE !== "false";
  const body = useTemplate ? montarTemplateMeta(payload) : montarTextoMeta(payload);
  const response = await fetch(
    `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );
  const result = await response.json().catch(() => null);

  return NextResponse.json(
    {
      ok: response.ok,
      configured: true,
      provider: "meta",
      status: response.status,
      result,
    },
    { status: response.ok ? 200 : 502 }
  );
}

async function enviarWebhookGenerico(payload: AdminReservationNotification) {
  const webhookUrl = process.env.WHATSAPP_WEBHOOK_URL;
  const webhookToken = process.env.WHATSAPP_WEBHOOK_TOKEN;
  const adminPhone = normalizarTelefone(process.env.WHATSAPP_ADMIN_PHONE);

  if (!webhookUrl) return null;

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
    const result = await response.json().catch(() => null);

    return NextResponse.json({
      ok: response.ok,
      configured: true,
      provider: "webhook",
      status: response.status,
      result,
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

export async function POST(request: Request) {
  const payload = (await request.json()) as AdminReservationNotification;
  const webhookResponse = await enviarWebhookGenerico(payload);

  if (webhookResponse) {
    return webhookResponse;
  }

  if (
    process.env.META_WHATSAPP_ACCESS_TOKEN ||
    process.env.META_WHATSAPP_PHONE_NUMBER_ID
  ) {
    return enviarMetaCloudApi(payload);
  }

  return NextResponse.json({
    ok: false,
    configured: false,
    message:
      "Nenhum provedor de WhatsApp configurado. Configure WHATSAPP_WEBHOOK_URL ou META_WHATSAPP_ACCESS_TOKEN + META_WHATSAPP_PHONE_NUMBER_ID.",
  });
}
