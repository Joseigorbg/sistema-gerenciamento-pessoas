import { AuthProvider } from "@/lib/authContext";
import { ThemeProvider } from "@/components/theme-provider";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sistema de Gerenciamento de Pessoas",
  description: "Gerencie informações de pessoas de forma eficiente",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* Leaflet CSS via CDN */}
        <link 
          rel="stylesheet" 
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
        {/* Leaflet MarkerCluster CSS via CDN */}
        <link 
          rel="stylesheet" 
          href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css" 
          crossOrigin=""
        />
        <link 
          rel="stylesheet" 
          href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css" 
          crossOrigin=""
        />
        {/* Leaflet JS via CDN */}
        <script 
          src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
          integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
          crossOrigin=""
        ></script>
        {/* Leaflet MarkerCluster JS via CDN */}
        <script 
          src="https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js" 
          crossOrigin=""
        ></script>
        {/* Chart.js via CDN */}
        <script 
          src="https://cdn.jsdelivr.net/npm/chart.js"
          crossOrigin=""
        ></script>
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
