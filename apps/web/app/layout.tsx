import React from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import { TrpcProvider } from './trpc-provider';
import './globals.css';

export const metadata = {
  title: 'Lumina',
  description: 'Enterprise AI Knowledge Hub',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <TrpcProvider children={children} />
        </body>
      </html>
    </ClerkProvider>
  );
}