import type { Metadata, Viewport } from "next"
import { Press_Start_2P, VT323 } from "next/font/google"
import "./globals.css"

const pixel = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
})

const vt = VT323({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-vt",
})

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export const metadata: Metadata = {
  title: "bärngo",
  description:
    "Geh zu Sehenswürdigkeiten in Bern, löse das Quiz und sammle Minecraft-Ressourcen.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="de">
      <body className={`${pixel.variable} ${vt.variable} mc-body`}>
        {children}
      </body>
    </html>
  )
}
