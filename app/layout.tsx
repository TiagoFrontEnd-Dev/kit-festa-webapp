import "./globals.css";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Kit Festa WebApp",
  description: "Sistema para gestão de kits de festa",
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
        className="bg-gray-100 text-gray-900 transition-colors duration-300 dark:bg-gray-950 dark:text-gray-100"
      >
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}