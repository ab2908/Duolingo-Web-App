import type { Metadata, Viewport } from "next";
import { Noto_Color_Emoji, Nunito } from "next/font/google";
import { AppStateProvider } from "@/components/AppState";
import { themeInitScript } from "@/lib/theme";
import "./globals.css";

const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin", "latin-ext"], weight: ["400", "600", "700", "800", "900"] });
const emoji = Noto_Color_Emoji({ variable: "--font-emoji", subsets: ["emoji"], weight: "400" });

export const metadata: Metadata = {
  title: "Duolingo Clone - The best way to learn a language",
  description: "Learn Spanish with bite-sized lessons, streaks, hearts and leagues.",
};

export const viewport: Viewport = {
  themeColor: "#58cc02",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${nunito.variable} ${emoji.variable} antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen">
        <AppStateProvider>{children}</AppStateProvider>
      </body>
    </html>
  );
}
