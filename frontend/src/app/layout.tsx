import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'PatchGuard — Security Patch Automation',
  description: 'Proactive vulnerability scanning and automated patch deployment',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#161B22',
              color: '#E6EDF3',
              border: '1px solid #30363D',
            },
          }}
        />
      </body>
    </html>
  )
}