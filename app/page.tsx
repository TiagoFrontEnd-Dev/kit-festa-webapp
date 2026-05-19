import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <section className="bg-pink-600 py-24 text-white dark:bg-pink-700">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <h1 className="mb-6 text-5xl font-bold md:text-6xl">
            Transforme Festas em Momentos Inesquecíveis
          </h1>

          <p className="mb-8 text-xl text-pink-50">
            Sistema completo para venda e locação de kits de festa.
          </p>

          <Link
            href="/kits"
            className="inline-block rounded-xl bg-white px-8 py-4 text-lg font-bold text-pink-600 shadow hover:bg-pink-50"
          >
            Ver Kits
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <h2 className="mb-14 text-center text-4xl font-bold text-gray-900 dark:text-white">
          Nossos Diferenciais
        </h2>

        <div className="grid gap-8 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-8 shadow dark:bg-gray-900">
            <h3 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
              Kits Completos
            </h3>

            <p className="text-gray-700 dark:text-gray-300">
              Tudo organizado para sua festa ficar perfeita.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-8 shadow dark:bg-gray-900">
            <h3 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
              Reserva Online
            </h3>

            <p className="text-gray-700 dark:text-gray-300">
              Reserve kits facilmente pelo sistema.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-8 shadow dark:bg-gray-900">
            <h3 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
              Gestão Completa
            </h3>

            <p className="text-gray-700 dark:text-gray-300">
              Controle vendas, locações e clientes.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}