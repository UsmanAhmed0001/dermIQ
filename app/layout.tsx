import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'DermIQ — AI Skin Analysis',
  description: 'Upload a photo of any skin lesion for instant AI-powered analysis across 7 clinical categories. Built on research-grade machine learning.',
  keywords: ['skin analysis', 'dermatology AI', 'melanoma detection', 'skin lesion classifier'],
  authors: [{ name: 'DermIQ' }],
  // PWA / mobile
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'DermIQ',
  },
}

// This makes the app feel native on mobile — sets the theme color for
// the browser chrome and optimises the viewport for mobile screens
export const viewport: Viewport = {
  themeColor: '#08091a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,   // Prevents unwanted zoom on form inputs (mobile UX)
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}
