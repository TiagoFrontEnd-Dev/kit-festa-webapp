export type AdminReservationItem = {
  nome: string;
  quantidade: number;
};

export type AdminReservationNotification = {
  reservaId: number;
  kitNome: string;
  kitPreco: number;
  dataEvento: string;
  clienteNome: string;
  clienteTelefone: string;
  clienteEmail: string;
  observacoes: string;
  itens: AdminReservationItem[];
};

export async function enviarNotificacaoAdmin(
  payload: AdminReservationNotification
) {
  try {
    const response = await fetch("/api/notificar-whatsapp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = (await response.json().catch(() => null)) as {
      ok?: boolean;
      configured?: boolean;
    } | null;

    return response.ok && result?.ok !== false && result?.configured !== false;
  } catch {
    return false;
  }
}
