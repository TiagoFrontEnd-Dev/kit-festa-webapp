import AdminLayout from "@/components/AdminLayout";

export default function AdminClientesPage() {
  return (
    <AdminLayout>
      <h1 className="text-4xl font-bold mb-4">Clientes</h1>

      <p className="text-gray-600 mb-8">
        Lista de clientes cadastrados.
      </p>

      <div className="bg-white rounded-2xl shadow p-6">
        <p className="text-gray-500">Nenhum cliente cadastrado ainda.</p>
      </div>
    </AdminLayout>
  );
}