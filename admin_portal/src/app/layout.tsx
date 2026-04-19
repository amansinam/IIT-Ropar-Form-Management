import type { Metadata } from 'next';
import '../styles/globals.css';
import { AppProvider } from '@/context/AppContext';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'IIT Ropar Form Portal Admin',
  description: 'Form Verification Admin Portal for IIT Ropar',
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppProvider>
          {children}
          <Toaster
            position="top-right"
            richColors
            closeButton={true}
            toastOptions={{
              style: {
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                borderRadius: '12px',
              },
            }}
          />
        </AppProvider>
      </body>
    </html>
  );
}
