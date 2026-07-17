import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { Header } from '@/components/Header';
import { SkipToContent } from '@/components/SkipToContent';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('http://localhost:3001'),
  title: {
    default: 'IoT-DeviceShield — Smart Home Risk Assessment',
    template: '%s · IoT-DeviceShield',
  },
  description:
    'Inventory smart-home devices, correlate CVEs from NIST NVD, and generate AI-assisted threat, impact, and remediation guidance.',
  applicationName: 'IoT-DeviceShield',
  authors: [{ name: 'IoT-DeviceShield' }],
  keywords: ['IoT security', 'CVE', 'NIST NVD', 'vulnerability assessment', 'smart home', 'risk'],
  openGraph: {
    type: 'website',
    title: 'IoT-DeviceShield — Smart Home Risk Assessment',
    description:
      'Inventory smart-home devices, correlate CVEs from NIST NVD, and generate AI-assisted risk guidance.',
    siteName: 'IoT-DeviceShield',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IoT-DeviceShield — Smart Home Risk Assessment',
    description:
      'Inventory smart-home devices, correlate CVEs from NIST NVD, and generate AI-assisted risk guidance.',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f8fb' },
    { media: '(prefers-color-scheme: dark)', color: '#0b0f19' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.variable}>
        <ThemeProvider>
          <SkipToContent />
          <Header />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
