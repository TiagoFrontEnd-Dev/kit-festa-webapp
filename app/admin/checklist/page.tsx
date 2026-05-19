import AdminLayout from "@/components/AdminLayout";

export default function AdminChecklistPage() {
  return (
    <AdminLayout>
      <h1 className="text-4xl font-bold mb-4">Checklist</h1>

      <p className="text-gray-600 mb-8">
        Organização dos itens antes da entrega.
      </p>

      <div className="bg-white rounded-2xl shadow p-6">
        <p className="text-gray-500">Nenhum checklist criado ainda.</p>
      </div>
    </AdminLayout>
  );
}