import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Sunspot',
  description: 'Where the sun still reaches in Copenhagen, right now.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
