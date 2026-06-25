import './globals.css';
import Providers from '@/components/Providers';

export const metadata = {
  title: 'DHARA AADHVIKA — Premium Organic Foods from Indian Villages',
  description: 'Wood-pressed oils, ancient grains, hand-pounded rice, traditional millets and time-tested herbs. Pure, honest and rooted.',
  keywords: 'organic food, millets, ragi, moringa, cold pressed oil, jaggery, ashwagandha, dhara aadhvika',
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
