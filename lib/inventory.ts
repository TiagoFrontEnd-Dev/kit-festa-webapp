export type EstoqueItem = {
  id: number;
  nome: string;
  quantidade_total: number;
  descricao: string | null;
  ativo: boolean;
};

export type KitItem = {
  id: number;
  kit_id: number;
  item_id: number;
  quantidade: number;
};

export type ReservaEstoque = {
  id: number;
  kit_id: number | null;
  data_evento: string;
  status: string;
};

export type ReservaItem = {
  id: number;
  reserva_id: number;
  kit_id: number | null;
  item_id: number;
  quantidade: number;
};

export type ItemFaltante = {
  itemId: number;
  nome: string;
  necessario: number;
  disponivel: number;
  total: number;
  emUso: number;
};

const ESTOQUE_STATUS_ATIVOS = ["pendente", "confirmada"];
const DIA_EM_MS = 24 * 60 * 60 * 1000;
const PRAZO_BLOQUEIO_DIAS = 2;

function dataLocal(data: string) {
  return new Date(`${data}T00:00:00`);
}

export function reservaBloqueiaData(dataReserva: string, dataEvento: string) {
  const reserva = dataLocal(dataReserva).getTime();
  const evento = dataLocal(dataEvento).getTime();
  const diferencaEmDias = Math.floor((evento - reserva) / DIA_EM_MS);

  return diferencaEmDias >= 0 && diferencaEmDias < PRAZO_BLOQUEIO_DIAS;
}

export function calcularUsoPorItem(
  dataEvento: string,
  kitItens: KitItem[],
  reservas: ReservaEstoque[],
  reservaItens: ReservaItem[] = []
) {
  const usoPorItem = new Map<number, number>();
  const reservasAtivas = reservas
    .filter((reserva) => ESTOQUE_STATUS_ATIVOS.includes(reserva.status))
    .filter((reserva) => reservaBloqueiaData(reserva.data_evento, dataEvento));

  const reservasPorId = new Map(
    reservasAtivas.map((reserva) => [reserva.id, reserva])
  );
  const reservasComSnapshot = new Set<number>();

  reservaItens.forEach((reservaItem) => {
    if (!reservasPorId.has(reservaItem.reserva_id)) return;

    reservasComSnapshot.add(reservaItem.reserva_id);

    const usoAtual = usoPorItem.get(reservaItem.item_id) || 0;
    usoPorItem.set(
      reservaItem.item_id,
      usoAtual + reservaItem.quantidade
    );
  });

  reservasAtivas
    .filter((reserva) => reserva.kit_id !== null)
    .filter((reserva) => !reservasComSnapshot.has(reserva.id))
    .forEach((reserva) => {
      kitItens
        .filter((kitItem) => kitItem.kit_id === reserva.kit_id)
        .forEach((kitItem) => {
          const usoAtual = usoPorItem.get(kitItem.item_id) || 0;
          usoPorItem.set(kitItem.item_id, usoAtual + kitItem.quantidade);
        });
    });

  return usoPorItem;
}

export function calcularDisponibilidadeKit(
  kitId: number,
  dataEvento: string,
  kitItens: KitItem[],
  estoqueItens: EstoqueItem[],
  reservas: ReservaEstoque[],
  reservaItens: ReservaItem[] = []
) {
  const itensDoKit = kitItens.filter((kitItem) => kitItem.kit_id === kitId);
  const usoPorItem = calcularUsoPorItem(
    dataEvento,
    kitItens,
    reservas,
    reservaItens
  );

  const faltantes = itensDoKit.reduce<ItemFaltante[]>((lista, kitItem) => {
    const item = estoqueItens.find((estoqueItem) => estoqueItem.id === kitItem.item_id);
    const total = item?.quantidade_total || 0;
    const emUso = usoPorItem.get(kitItem.item_id) || 0;
    const disponivel = total - emUso;

    if (disponivel < kitItem.quantidade) {
      lista.push({
        itemId: kitItem.item_id,
        nome: item?.nome || "Item nao encontrado",
        necessario: kitItem.quantidade,
        disponivel: Math.max(disponivel, 0),
        total,
        emUso,
      });
    }

    return lista;
  }, []);

  return {
    disponivel: faltantes.length === 0,
    faltantes,
  };
}

export function calcularResumoItem(
  itemId: number,
  dataEvento: string,
  kitItens: KitItem[],
  estoqueItens: EstoqueItem[],
  reservas: ReservaEstoque[],
  reservaItens: ReservaItem[] = []
) {
  const item = estoqueItens.find((estoqueItem) => estoqueItem.id === itemId);
  const total = item?.quantidade_total || 0;
  const usoPorItem = calcularUsoPorItem(
    dataEvento,
    kitItens,
    reservas,
    reservaItens
  );
  const emUso = usoPorItem.get(itemId) || 0;

  return {
    total,
    emUso,
    disponivel: Math.max(total - emUso, 0),
  };
}
