type Props = {
  titulo: string;
  valor: string;
};

export default function StatCard({ titulo, valor }: Props) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow dark:bg-gray-900">
      <p className="mb-2 text-gray-700 dark:text-gray-300">
        {titulo}
      </p>

      <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
        {valor}
      </h2>
    </div>
  );
}