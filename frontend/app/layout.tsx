import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { Navbar } from '@/components/layout/navbar'
import { Web3Provider } from '@/providers/web3-provider'
import { ConfigurationProvider } from '@/components/config/configuration-provider'
import { TranslationProvider } from '@/lib/i18n'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || '품앗이',
  description: process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'VeryChain 기반 P2P 서비스 마켓플레이스',
  icons: {
    icon: process.env.NEXT_PUBLIC_APP_ICON || '/logo.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          disableTransitionOnChange
        >
          <TranslationProvider>
            <ConfigurationProvider>
              <Web3Provider>
                <Navbar />
                {children}
                <Toaster />
              </Web3Provider>
            </ConfigurationProvider>
          </TranslationProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}