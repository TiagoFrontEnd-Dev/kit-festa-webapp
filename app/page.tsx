import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-rose-50 text-gray-900 dark:bg-gray-950 dark:text-rose-50">
      <section className="relative overflow-hidden bg-gradient-to-br from-rose-100 via-pink-100 to-purple-100 py-24 dark:from-gray-950 dark:via-rose-950/40 dark:to-gray-900">
        <div className="absolute left-10 top-10 h-32 w-32 rounded-full bg-rose-300/40 blur-3xl" />
        <div className="absolute bottom-10 right-10 h-40 w-40 rounded-full bg-pink-300/40 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 text-center">
          <p className="mb-4 inline-block rounded-full bg-white/70 px-5 py-2 font-bold text-rose-500 shadow-sm dark:bg-gray-900 dark:text-rose-300">
            Festas delicadas, criativas e memoráveis
          </p>

          <h1 className="mb-6 text-5xl font-black leading-tight text-gray-900 dark:text-white md:text-7xl">
            ArtePinte
          </h1>

          <p className="mx-auto mb-8 max-w-3xl text-xl leading-8 text-gray-700 dark:text-rose-100">
            Kits de festa personalizados com carinho, cor e criatividade para
            transformar momentos especiais em lembranças inesquecíveis.
          </p>

          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/kits"
              className="rounded-2xl bg-rose-400 px-8 py-4 text-lg font-bold text-white shadow-lg transition hover:bg-rose-500"
            >
              Ver Kits
            </Link>

            <Link
              href="/contato"
              className="rounded-2xl bg-white px-8 py-4 text-lg font-bold text-rose-500 shadow-lg transition hover:bg-rose-50 dark:bg-gray-900 dark:text-rose-200 dark:hover:bg-gray-800"
            >
              Falar Conosco
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <h2 className="mb-4 text-center text-4xl font-black text-gray-900 dark:text-white">
          Por que escolher a ArtePinte?
        </h2>

        <p className="mx-auto mb-14 max-w-2xl text-center text-gray-700 dark:text-rose-100">
          Cada detalhe é pensado para deixar sua comemoração mais bonita,
          organizada e cheia de personalidade.
        </p>

        <div className="grid gap-8 md:grid-cols-3">
          <div className="rounded-3xl border border-rose-100 bg-white p-8 shadow-lg dark:border-rose-900/40 dark:bg-gray-900">
            <h3 className="mb-4 text-2xl font-bold text-rose-500">
              Kits Encantadores
            </h3>

            <p className="leading-7 text-gray-700 dark:text-gray-200">
              Composições delicadas, criativas e prontas para deixar sua festa
              mais especial.
            </p>
          </div>

          <div className="rounded-3xl border border-rose-100 bg-white p-8 shadow-lg dark:border-rose-900/40 dark:bg-gray-900">
            <h3 className="mb-4 text-2xl font-bold text-rose-500">
              Reserva Online
            </h3>

            <p className="leading-7 text-gray-700 dark:text-gray-200">
              Escolha o kit, veja a disponibilidade e solicite sua reserva de
              forma rápida.
            </p>
          </div>

          <div className="rounded-3xl border border-rose-100 bg-white p-8 shadow-lg dark:border-rose-900/40 dark:bg-gray-900">
            <h3 className="mb-4 text-2xl font-bold text-rose-500">
              Organização Completa
            </h3>

            <p className="leading-7 text-gray-700 dark:text-gray-200">
              Controle de itens, datas, reservas e atendimento direto pelo
              WhatsApp.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}