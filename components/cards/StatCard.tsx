type Props = {
  titulo: string;
  valor: string;
};

export default function StatCard({
  titulo,
  valor,
}: Props) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow">
      <p className="text-gray-500 mb-2">
        {titulo}
      </p>

      <h2 className="text-3xl font-bold">
        {valor}
      </h2>
    </div>
  );
}