import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Admin • Coh Music",
};

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <Script id="admin-theme-init" strategy="beforeInteractive">{`
        (function(){
          try {
            var stored = localStorage.getItem('theme');
            var prefers = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            var dark = stored ? stored === 'dark' : prefers;
            document.documentElement.classList.toggle('dark', dark);
          } catch (e) {}
        })();
      `}</Script>
      {children}
    </div>
  );
}
