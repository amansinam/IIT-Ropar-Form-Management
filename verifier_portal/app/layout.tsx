import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/lib/theme';
import { AppProvider }   from '@/lib/app-context';

export const metadata: Metadata = {
  title:       'IIT Ropar - Form Verification Portal',
  description: 'Centralized Form Verification Portal for IIT Ropar Administration',
  icons: {
    icon:     '/favicon.png',
    shortcut: '/favicon.png',
    apple:    '/favicon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <AppProvider>   {/* SessionProvider + context all in one */}
            {children}
          </AppProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}