import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AuthorizedOps',
  description: 'Secure AI Agent with Token Vault',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
