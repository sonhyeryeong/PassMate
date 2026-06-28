import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'PassMate - Personal Learning Platform',
  description: 'Study materials organized as flashcards',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
