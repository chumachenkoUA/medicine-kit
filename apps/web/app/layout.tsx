import type { Metadata } from "next"
import "./globals.css"
import { AppProviders } from "@/components/app-providers"

export const metadata: Metadata = {
  title: "Medicine Kit",
  description: "Зручний застосунок для керування ліками та курсами прийому.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="uk" suppressHydrationWarning>
      <body className="antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
