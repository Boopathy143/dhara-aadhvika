import './globals.css';
import Providers from '@/components/Providers';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://dharaaadhvika.in';

export const metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'DHARA AADHVIKA — Premium Organic Foods from Indian Villages',
    template: '%s · Dhara Aadhvika',
  },
  description: 'Wood-pressed oils, ancient grains, hand-pounded rice, traditional millets and time-tested herbs. Pure, honest and rooted.',
  keywords: ['organic food', 'millets', 'ragi', 'moringa', 'cold pressed oil', 'jaggery', 'ashwagandha', 'palm sprout powder', 'dhara aadhvika', 'erode', 'tamil nadu organic'],
  authors: [{ name: 'Dhara Aadhvika' }],
  creator: 'Dhara Aadhvika',
  publisher: 'Dhara Aadhvika',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: BASE_URL,
    siteName: 'Dhara Aadhvika',
    title: 'DHARA AADHVIKA — Premium Organic Foods from Indian Villages',
    description: 'Wood-pressed oils, ancient grains, hand-pounded rice, traditional millets and time-tested herbs.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DHARA AADHVIKA — Pure. Honest. Rooted.',
    description: 'Premium organic foods sourced directly from Indian villages.',
    creator: '@DharaAadhvika',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  icons: { icon: '/favicon.ico', apple: '/favicon.ico' },
};

export const viewport = {
  themeColor: '#15803d',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
