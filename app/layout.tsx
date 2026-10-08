import type { Metadata } from 'next';
import './globals.css';
import { BranchProvider } from '@/context/BranchContext';
import TopNavbarClient from '@/components/TopNavbarClient';

export const metadata: Metadata = {
  title: 'منظومة شركة البرج المتألق | RTCO ERP',
  description: 'نظام إدارة موارد المؤسسة الموحد - المقاولات، التجارة، النقل، والعقارات',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body className="bg-[#060a12] text-slate-100 antialiased font-['Cairo',sans-serif] min-h-screen flex flex-col selection:bg-amber-500 selection:text-black">
        <BranchProvider>
          <TopNavbarClient />
          <main className="flex-1 w-full">
            {children}
          </main>
        </BranchProvider>
      </body>
    </html>
  );
}