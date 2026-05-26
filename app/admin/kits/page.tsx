"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/lib/supabase";
import { EstoqueItem, KitItem } from "@/lib/inventory";

type Kit = {
  id: number;
  nome: string;
  descricao: string | null;
  preco: number;
  imagem: string | null;
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

export default function AdminKitsPage() {
  const [kits, setKits] = useState<Kit[]>([]);
  const [imagens, setImagens] = useState<KitImagem[]>([]);
  const [estoqueItens, setEstoqueItens] = useState<EstoqueItem[]>([]);
  const [kitItens, setKitItens] = useState<KitItem[]>([]);

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco] = useState("");
  const [itemSelecionadoId, setItemSelecionadoId] = useState("");
  const [quantidadeItem, setQuantidadeItem] = useState("1");

  const [arquivosImagem, setArquivosImagem] = useState<File[]>([]);
  const [previewsImagem, setPreviewsImagem] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [salvandoItem, setSalvandoItem] = useState(false);

  async function carregarKits() {
    const { data: kitsData, error: kitsError } = await supabase
      .from("kits")
      .select("*")
      .order("id", { ascending: false });

    const { data: imagensData, error: imagensError } = await supabase
      .from("kit_imagens")
      .select("*")
      .order("ordem", { ascending: true });

    const { data: estoqueData, error: estoqueError } = await supabase
      .from("estoque_itens")
      .select("*")
      .eq("ativo", true)
      .order("nome", { ascending: true });

    const { data: kitItensData, error: kitItensError } = await supabase
      .from("kit_itens")
      .select("*");

    if (kitsError) {
      alert(`Erro ao carregar kits: ${kitsError.message}`);
      return;
    }

    if (imagensError) {
      alert(`Erro ao carregar imagens: ${imagensError.message}`);
      return;
    }

    if (estoqueError || kitItensError) {
      alert(
        "Erro ao carregar itens de estoque. Confira se o SQL supabase/inventory.sql ja foi executado no Supabase."
      );
      return;
    }

    setKits(kitsData || []);
    setImagens(imagensData || []);
    setEstoqueItens(estoqueData || []);
    setKitItens(kitItensData || []);
  }

  function buscarImagensDoKit(kitId: number) {
    return imagens.filter((imagem) => imagem.kit_id === kitId);
  }

  function buscarItensDoKit(kitId: number) {
    return kitItens.filter((kitItem) => kitItem.kit_id === kitId);
  }

  function buscarItemEstoque(itemId: number) {
    return estoqueItens.find((item) => item.id === itemId);
  }

  function selecionarImagens(files: FileList | null) {
    if (!files) return;

    const listaArquivos = Array.from(files);
    setArquivosImagem(listaArquivos);

    const previews = listaArquivos.map((file) => URL.createObjectURL(file));
    setPreviewsImagem(previews);
  }

  async function uploadImagens(kitId: number) {
    if (arquivosImagem.length === 0) {
      return [];
    }

    const imagensEnviadas: {
      url: string;
      caminho: string;
    }[] = [];

    for (const arquivo of arquivosImagem) {
      const extensao = arquivo.name.split(".").pop();
      const nomeArquivo = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}.${extensao}`;

      const caminho = `kits/${kitId}/${nomeArquivo}`;

      const { error } = await supabase.storage
        .from("kits")
        .upload(caminho, arquivo);

      if (error) {
        throw new Error(error.message);
      }

      const { data } = supabase.storage.from("kits").getPublicUrl(caminho);

      imagensEnviadas.push({
        url: data.publicUrl,
        caminho,
      });
    }

    return imagensEnviadas;
  }

  async function salvarKit() {
    if (!nome.trim() || !preco.trim()) {
      alert("Preencha o nome e o preço.");
      return;
    }

    setLoading(true);

    try {
      if (editandoId) {
        const imagensEnviadas = await uploadImagens(editandoId);

        const imagensExistentes = buscarImagensDoKit(editandoId);

        const imagemPrincipal =
          imagensExistentes[0]?.url || imagensEnviadas[0]?.url || null;

        const { error: erroUpdate } = await supabase
          .from("kits")
          .update({
            nome: nome.trim(),
            descricao: descricao.trim(),
            preco: Number(preco),
            imagem: imagemPrincipal,
          })
          .eq("id", editandoId);

        if (erroUpdate) {
          throw new Error(erroUpdate.message);
        }

        if (imagensEnviadas.length > 0) {
          const proximaOrdem = imagensExistentes.length + 1;

          const payloadImagens = imagensEnviadas.map((imagem, index) => ({
            kit_id: editandoId,
            url: imagem.url,
            caminho: imagem.caminho,
            ordem: proximaOrdem + index,
            principal: imagensExistentes.length === 0 && index === 0,
          }));

          const { error: erroImagens } = await supabase
            .from("kit_imagens")
            .insert(payloadImagens);

          if (erroImagens) {
            throw new Error(erroImagens.message);
          }

          if (!imagemPrincipal && imagensEnviadas[0]) {
            await supabase
              .from("kits")
              .update({
                imagem: imagensEnviadas[0].url,
              })
              .eq("id", editandoId);
          }
        }

        alert("Kit atualizado com sucesso!");
      } else {
        const { data: kitCriado, error: erroInsert } = await supabase
          .from("kits")
          .insert({
            nome: nome.trim(),
            descricao: descricao.trim(),
            preco: Number(preco),
            imagem: null,
            ativo: true,
          })
          .select()
          .single();

        if (erroInsert) {
          throw new Error(erroInsert.message);
        }

        const imagensEnviadas = await uploadImagens(kitCriado.id);

        if (imagensEnviadas.length > 0) {
          const payloadImagens = imagensEnviadas.map((imagem, index) => ({
            kit_id: kitCriado.id,
            url: imagem.url,
            caminho: imagem.caminho,
            ordem: index + 1,
            principal: index === 0,
          }));

          const { error: erroImagens } = await supabase
            .from("kit_imagens")
            .insert(payloadImagens);

          if (erroImagens) {
            throw new Error(erroImagens.message);
          }

          const { error: erroImagemPrincipal } = await supabase
            .from("kits")
            .update({
              imagem: imagensEnviadas[0].url,
            })
            .eq("id", kitCriado.id);

          if (erroImagemPrincipal) {
            throw new Error(erroImagemPrincipal.message);
          }
        }

        alert("Kit cadastrado com sucesso!");
      }

      limparFormulario();
      carregarKits();
    } catch (error) {
      if (error instanceof Error) {
        alert(`Erro: ${error.message}`);
      } else {
        alert("Erro desconhecido ao salvar kit.");
      }
    }

    setLoading(false);
  }

  function editarKit(kit: Kit) {
    setEditandoId(kit.id);
    setNome(kit.nome);
    setDescricao(kit.descricao || "");
    setPreco(String(kit.preco));
    setArquivosImagem([]);
    setPreviewsImagem([]);
    setItemSelecionadoId("");
    setQuantidadeItem("1");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function excluirImagem(imagem: KitImagem) {
    const confirmar = confirm("Deseja excluir esta imagem?");
    if (!confirmar) return;

    if (imagem.caminho) {
      await supabase.storage.from("kits").remove([imagem.caminho]);
    }

    const { error } = await supabase
      .from("kit_imagens")
      .delete()
      .eq("id", imagem.id);

    if (error) {
      alert(`Erro ao excluir imagem: ${error.message}`);
      return;
    }

    const imagensRestantes = imagens.filter(
      (item) => item.id !== imagem.id && item.kit_id === imagem.kit_id
    );

    const novaImagemPrincipal = imagensRestantes[0]?.url || null;

    await supabase
      .from("kits")
      .update({
        imagem: novaImagemPrincipal,
      })
      .eq("id", imagem.kit_id);

    carregarKits();
  }

  async function excluirKit(id: number) {
    const confirmar = confirm("Tem certeza que deseja excluir este kit?");
    if (!confirmar) return;

    const imagensDoKit = buscarImagensDoKit(id);

    const caminhos = imagensDoKit
      .map((imagem) => imagem.caminho)
      .filter(Boolean) as string[];

    if (caminhos.length > 0) {
      await supabase.storage.from("kits").remove(caminhos);
    }

    const { error } = await supabase.from("kits").delete().eq("id", id);

    if (error) {
      alert(`Erro ao excluir kit: ${error.message}`);
      return;
    }

    alert("Kit excluído com sucesso!");
    carregarKits();
  }

  async function salvarItemDoKit() {
    if (!editandoId) {
      alert("Edite ou cadastre um kit antes de vincular itens.");
      return;
    }

    if (!itemSelecionadoId) {
      alert("Selecione um item do estoque.");
      return;
    }

    const quantidade = Number(quantidadeItem);

    if (!Number.isFinite(quantidade) || quantidade <= 0) {
      alert("Informe uma quantidade valida para o kit.");
      return;
    }

    setSalvandoItem(true);

    const { error } = await supabase.from("kit_itens").upsert(
      {
        kit_id: editandoId,
        item_id: Number(itemSelecionadoId),
        quantidade,
      },
      { onConflict: "kit_id,item_id" }
    );

    setSalvandoItem(false);

    if (error) {
      alert(`Erro ao vincular item: ${error.message}`);
      return;
    }

    setItemSelecionadoId("");
    setQuantidadeItem("1");
    carregarKits();
  }

  async function removerItemDoKit(vinculoId: number) {
    if (!confirm("Remover este item do kit?")) return;

    const { error } = await supabase
      .from("kit_itens")
      .delete()
      .eq("id", vinculoId);

    if (error) {
      alert(`Erro ao remover item do kit: ${error.message}`);
      return;
    }

    carregarKits();
  }

  function limparFormulario() {
    setEditandoId(null);
    setNome("");
    setDescricao("");
    setPreco("");
    setArquivosImagem([]);
    setPreviewsImagem([]);
    setItemSelecionadoId("");
    setQuantidadeItem("1");
  }

  useEffect(() => {
    carregarKits();
  }, []);

  return (
    <AdminLayout>
      <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">
        Kits
      </h1>

      <p className="mb-8 text-gray-700 dark:text-gray-300">
        Cadastro, edição, exclusão e galeria de imagens dos kits.
      </p>

      <div className="mb-8 rounded-2xl bg-white p-6 shadow dark:bg-gray-900">
        <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
          {editandoId ? "Editar kit" : "Cadastrar novo kit"}
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome do kit"
            className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-400"
          />

          <input
            value={preco}
            onChange={(e) => setPreco(e.target.value)}
            placeholder="Preço"
            type="number"
            className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-400"
          />

          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descrição"
            className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-400 md:col-span-2"
          />

          <div className="md:col-span-2">
            <label className="mb-2 block font-bold text-gray-900 dark:text-white">
              Imagens do kit
            </label>

            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => selecionarImagens(e.target.files)}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />

            {previewsImagem.length > 0 && (
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                {previewsImagem.map((preview) => (
                  <img
                    key={preview}
                    src={preview}
                    alt="Preview"
                    className="h-40 w-full rounded-xl object-cover"
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={salvarKit}
            disabled={loading}
            className="rounded-xl bg-pink-600 px-6 py-3 font-bold text-white disabled:opacity-50"
          >
            {loading
              ? "Salvando..."
              : editandoId
              ? "Salvar alterações"
              : "+ Cadastrar Kit"}
          </button>

          {editandoId && (
            <button
              type="button"
              onClick={limparFormulario}
              className="rounded-xl bg-gray-200 px-6 py-3 font-bold text-gray-900 dark:bg-gray-700 dark:text-white"
            >
              Cancelar edição
            </button>
          )}
        </div>

        {editandoId && (
          <div className="mt-8 rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
              Itens deste kit
            </h3>

            <p className="mb-5 text-gray-700 dark:text-gray-300">
              Vincule itens do estoque e informe quantas unidades este kit usa.
            </p>

            <div className="grid gap-4 md:grid-cols-[1fr_160px_auto]">
              <select
                value={itemSelecionadoId}
                onChange={(e) => setItemSelecionadoId(e.target.value)}
                className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                <option value="">Selecione um item do estoque</option>
                {estoqueItens.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nome} - estoque: {item.quantidade_total}
                  </option>
                ))}
              </select>

              <input
                value={quantidadeItem}
                onChange={(e) => setQuantidadeItem(e.target.value)}
                type="number"
                min="1"
                placeholder="Qtd. no kit"
                className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />

              <button
                type="button"
                onClick={salvarItemDoKit}
                disabled={salvandoItem}
                className="rounded-xl bg-pink-600 px-5 py-3 font-bold text-white disabled:opacity-50"
              >
                {salvandoItem ? "Salvando..." : "Vincular"}
              </button>
            </div>

            <div className="mt-5 grid gap-3">
              {buscarItensDoKit(editandoId).length === 0 ? (
                <p className="text-gray-700 dark:text-gray-300">
                  Nenhum item vinculado a este kit ainda.
                </p>
              ) : (
                buscarItensDoKit(editandoId).map((vinculo) => {
                  const item = buscarItemEstoque(vinculo.item_id);

                  return (
                    <div
                      key={vinculo.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4 dark:bg-gray-900"
                    >
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">
                          {item?.nome || "Item removido"}
                        </p>

                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          Usa {vinculo.quantidade} unidade(s) neste kit
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => removerItemDoKit(vinculo.id)}
                        className="rounded-xl bg-red-600 px-4 py-2 font-bold text-white"
                      >
                        Remover
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-white p-6 shadow dark:bg-gray-900">
        <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
          Kits cadastrados
        </h2>

        {kits.length === 0 ? (
          <p className="text-gray-700 dark:text-gray-300">
            Nenhum kit cadastrado ainda.
          </p>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {kits.map((kit) => {
              const imagensDoKit = buscarImagensDoKit(kit.id);
              const itensDoKit = buscarItensDoKit(kit.id);

              return (
                <div
                  key={kit.id}
                  className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
                >
                  {kit.imagem ? (
                    <img
                      src={kit.imagem}
                      alt={kit.nome}
                      className="h-44 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-44 items-center justify-center bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                      Sem imagem
                    </div>
                  )}

                  <div className="p-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {kit.nome}
                    </h3>

                    <p className="mt-2 text-gray-700 dark:text-gray-300">
                      {kit.descricao || "Sem descrição."}
                    </p>

                    <p className="mt-3 text-xl font-bold text-pink-600">
                      R$ {kit.preco}
                    </p>

                    <div className="mt-4">
                      <p className="mb-2 font-bold text-gray-900 dark:text-white">
                        Galeria
                      </p>

                      {imagensDoKit.length === 0 ? (
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          Nenhuma imagem extra.
                        </p>
                      ) : (
                        <div className="grid grid-cols-3 gap-2">
                          {imagensDoKit.map((imagem) => (
                            <div key={imagem.id} className="relative">
                              <img
                                src={imagem.url}
                                alt={kit.nome}
                                className="h-20 w-full rounded-lg object-cover"
                              />

                              <button
                                type="button"
                                onClick={() => excluirImagem(imagem)}
                                className="absolute right-1 top-1 rounded bg-red-600 px-2 py-1 text-xs font-bold text-white"
                              >
                                X
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-4">
                      <p className="mb-2 font-bold text-gray-900 dark:text-white">
                        Itens vinculados
                      </p>

                      {itensDoKit.length === 0 ? (
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          Nenhum item vinculado.
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {itensDoKit.map((vinculo) => {
                            const item = buscarItemEstoque(vinculo.item_id);

                            return (
                              <span
                                key={vinculo.id}
                                className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                              >
                                {vinculo.quantidade}x{" "}
                                {item?.nome || "Item removido"}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="mt-5 flex gap-3">
                      <button
                        type="button"
                        onClick={() => editarKit(kit)}
                        className="flex-1 rounded-xl bg-blue-600 px-4 py-2 font-bold text-white"
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() => excluirKit(kit.id)}
                        className="flex-1 rounded-xl bg-red-600 px-4 py-2 font-bold text-white"
                      >
                        Excluir
                      </button>
                    </div>
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
