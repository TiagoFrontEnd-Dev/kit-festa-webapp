import AdminLayout from "@/components/AdminLayout";

export default function AdminRelatoriosPage() {
  return (
    <AdminLayout>
      <h1 className="text-4xl font-bold mb-4">Relatórios</h1>

      <p className="text-gray-600 mb-8">
        Resumo financeiro e desempenho do negócio.
      </p>

      <div className="bg-white rounded-2xl shadow p-6">
        <p className="text-gray-500">Nenhum relatório disponível ainda.</p>
      </div>
    </AdminLayout>
  );
}