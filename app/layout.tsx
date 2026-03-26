import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/components/CartContext";
import { CartDrawer } from "@/components/CartDrawer";

export const metadata: Metadata = {
  title: "PXG Ísland — Kylfur í Heimsklassa",
  description: "PXG golf kylfur, klæðnaður og aukahlutir — hannaðar fyrir þá sem krefjast hins besta. Kauptu PXG vörur á Íslandi.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="is" className="h-full">
      <body className="min-h-full flex flex-col">
        <CartProvider>
          {children}
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
