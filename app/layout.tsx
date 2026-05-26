import "./globals.css";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: "ArtePinte",
  description: "Kits criativos e personalizados para festas inesquecíveis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="bg-rose-50 text-gray-900 transition-colors duration-300 dark:bg-gray-950 dark:text-rose-50"
      >
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}