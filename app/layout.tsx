import type { Metadata } from 'next'
import { Inter, Manrope } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-body' })
const manrope = Manrope({ subsets: ['latin'], variable: '--font-display' })

export const metadata: Metadata = {
  title: 'Aklora',
  description: 'Murat Kömürcü markasına ait yapay zekâ çalışma alanı.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={`${inter.variable} ${manrope.variable}`}>{children}</body>
    </html>
  )
}
