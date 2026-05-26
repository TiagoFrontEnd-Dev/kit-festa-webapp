import { supabase } from "@/lib/supabase";

export type Cliente = {
  id: number;
  nome: string;
  telefone: string;
  telefone_normalizado: string;
  email: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
};

export function normalizarTelefone(telefone: string) {
  return telefone.replace(/\D/g, "");
}

export async function salvarClienteReserva({
  nome,
  telefone,
  email,
}: {
  nome: string;
  telefone: string;
  email: string;
}) {
  const telefoneNormalizado = normalizarTelefone(telefone);

  if (!telefoneNormalizado) {
    throw new Error("Informe um WhatsApp valido.");
  }

  const payload = {
    nome: nome.trim(),
    telefone: telefone.trim(),
    telefone_normalizado: telefoneNormalizado,
    email: email.trim() || null,
    updated_at: new Date().toISOString(),
  };

  const { data: clienteExistente, error: erroBusca } = await supabase
    .from("clientes")
    .select("*")
    .eq("telefone_normalizado", telefoneNormalizado)
    .maybeSingle();

  if (erroBusca) {
    throw new Error(erroBusca.message);
  }

  if (clienteExistente) {
    const { data, error } = await supabase
      .from("clientes")
      .update(payload)
      .eq("id", clienteExistente.id)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data as Cliente;
  }

  const { data, error } = await supabase
    .from("clientes")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Cliente;
}
