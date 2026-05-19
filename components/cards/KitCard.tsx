type Props = {
  nome: string;
  preco: string;
  imagem: string;
};

export default function KitCard({
  nome,
  preco,
  imagem,
}: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden">
      
      <img
        src={imagem}
        alt={nome}
        className="w-full h-64 object-cover"
      />

      <div className="p-6">
        <h2 className="text-2xl font-bold mb-2">
          {nome}
        </h2>

        <p className="text-pink-600 text-xl font-bold mb-4">
          {preco}
        </p>

        <button className="w-full bg-pink-600 text-white py-3 rounded-xl font-bold">
          Reservar
        </button>
      </div>
    </div>
  );
}