import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Fintech Mini Wallet',
  description: 'A secure fintech wallet application with live Vulnerable vs Secure before-and-after vulnerability demonstrations.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-fintech-dark text-white antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
