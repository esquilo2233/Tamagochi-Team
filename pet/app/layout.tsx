import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ReportBugButton from "@/components/ReportBugButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Samurai",
  description: "Cuida do Samurai",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      style={{ width: "100%", margin: 0, padding: 0 }}
      suppressHydrationWarning
    >
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{ width: "100%", margin: 0, padding: 0 }}
      >
        <script
          dangerouslySetInnerHTML={{
            __html: `
          (function(){
            try {
              var stored = localStorage.getItem('theme');
              if (stored === 'dark' || stored === 'light') {
                document.documentElement.setAttribute('data-theme', stored);
              } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                document.documentElement.setAttribute('data-theme', 'dark');
              } else {
                document.documentElement.setAttribute('data-theme', 'light');
              }
              // respond to system changes unless the user fixed a preference
              if (window.matchMedia) {
                var mq = window.matchMedia('(prefers-color-scheme: dark)');
                if (mq.addEventListener) {
                  mq.addEventListener('change', function(e){ if (!localStorage.getItem('theme')) { document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light'); } });
                } else if (mq.addListener) {
                  mq.addListener(function(e){ if (!localStorage.getItem('theme')) { document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light'); } });
                }
              }
            } catch (e) { /* ignore */ }
          })();
        `,
          }}
        />
        {children}
        <ReportBugButton />
      </body>
    </html>
  );
}
