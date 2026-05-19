import AdminLayout from "@/components/AdminLayout";

export default function AdminItensPage() {
  return (
    <AdminLayout>
      <h1 className="text-4xl font-bold mb-4">Itens</h1>

      <p className="text-gray-600 mb-8">
        Controle de peças, decorações e acessórios.
      </p>

      <button className="bg-pink-600 text-white px-6 py-3 rounded-xl font-bold mb-8">
        + Novo Item
      </button>

      <div className="bg-white rounded-2xl shadow p-6">
        <p className="text-gray-500">Nenhum item cadastrado ainda.</p>
      </div>
    </AdminLayout>
  );
}