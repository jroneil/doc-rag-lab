import type { ReactNode } from 'react';

import './globals.css';

export const metadata = {
  title: 'RagLab',
  description: 'RagLab UI',
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
          {children}
        </main>
      </body>
    </html>
  );
}
