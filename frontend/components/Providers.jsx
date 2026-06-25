'use client';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { SWRConfig } from 'swr';

const fetcher = (url) => fetch(url).then(r => r.json());

export default function Providers({ children }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <SWRConfig value={{ fetcher, revalidateOnFocus: false }}>
        {children}
        <Toaster position="top-right" richColors />
      </SWRConfig>
    </ThemeProvider>
  );
}
