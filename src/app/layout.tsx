import type { Metadata, Viewport } from "next"
import { Archivo, Archivo_Black } from "next/font/google"
import "./globals.css"

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
})

const archivoBlack = Archivo_Black({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-archivo-black",
})

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export const metadata: Metadata = {
  title: "bärngo",
  description:
    "Geh zu Sehenswürdigkeiten in Bern, beantworte das Quiz vor Ort.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="de">
      <body
        className={`${archivo.variable} ${archivoBlack.variable} bg-stone-950 font-sans text-stone-50 antialiased`}
      >
        {children}
      </body>
    </html>
  )
}
