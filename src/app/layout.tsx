import type { Metadata } from 'next';
import { Prompt } from 'next/font/google';
import './globals.css';

const prompt = Prompt({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['thai', 'latin'],
  display: 'swap',
  variable: '--font-prompt',
});

export const metadata: Metadata = {
  title: 'ระบบวิเคราะห์ข้อมูลผู้ป่วยเข้ารับการบำบัดรักษา | จ.ศรีสะเกษ',
  description: 'แดชบอร์ดประมวลผลสถิติผู้ป่วยเข้ารับการบำบัดยาเสพติดและหมู่บ้าน/ชุมชน เชื่อมต่อ Google Sheets แบบ Real-time',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className="dark">
      <body className={`${prompt.className} min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
