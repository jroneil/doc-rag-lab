import type { ReactNode } from 'react';

import './globals.css';

export const metadata = {
  title: 'RagLab',
  description: 'RAG demo UI for Python + Java backends',
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen">
          <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
