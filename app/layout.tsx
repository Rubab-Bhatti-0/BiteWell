import React from 'react';
import './globals.css';
import { Toaster } from 'sonner';

export const metadata = {
  title: 'Dental SaaS – AI Agent Management',
  description: 'AI Agent catalog and analytics for dental SaaS platform.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased min-h-screen selection:bg-sky-200 selection:text-blue-900">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}

