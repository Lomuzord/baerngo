import type { Metadata, Viewport } from "next"
import { Press_Start_2P, VT323 } from "next/font/google"
import { SpielTabBar } from "./SpielTabBar"
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
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#2b2118",
}

export const metadata: Metadata = {
  title: "bärngo",
  description:
    "Geh zu Sehenswürdigkeiten in Bern, löse das Quiz und sammle Minecraft-Ressourcen.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "bärngo",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
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
        <SpielTabBar />
      </body>
    </html>
  )
}
