import type { Metadata } from "next";
import Script from "next/script";
import Footer from "@/components/footer";
import PatternBackground from "@/components/pattern-background";
import Navbar from "@/components/navbar";
import { PRIMARY_NAV_ITEMS } from "@/data/navigation";

export const metadata: Metadata = {
  title: "Coh Music",
  description: "Creature of Habit crafts cinematic pop and electronic projects."
};

export default function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <PatternBackground />
      <Script id="theme-init" strategy="beforeInteractive">
        {`
          (function(){
            try {
              var stored = localStorage.getItem('theme');
              var prefers = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
              var dark = stored ? stored === 'dark' : prefers;
              document.documentElement.classList.toggle('dark', dark);
            } catch (e) {}
          })();
        `}
      </Script>
      <div className="app-root">
        <Navbar items={PRIMARY_NAV_ITEMS} />
        <div className="app-content">{children}</div>
        <Footer />
      </div>
    </>
  );
}
