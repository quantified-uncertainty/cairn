import type { Metadata } from "next";
import Link from "next/link";
import { DevModeToggle } from "@/components/DevModeToggle";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cairn Wiki",
  description: "AI Safety Knowledge Base",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Restore dev mode class before paint to prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){if(localStorage.getItem('pageStatusDevMode')==='true'){document.documentElement.classList.add('page-status-dev-mode')}})()`,
          }}
        />
      </head>
      <body className="min-h-screen bg-background text-foreground">
        {/* Top nav bar */}
        <header className="border-b border-border bg-card">
          <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
            <Link href="/" className="text-lg font-bold no-underline text-foreground">
              Cairn Wiki
            </Link>
            <nav className="flex items-center gap-4">
              <Link
                href="/wiki"
                className="text-sm text-muted-foreground no-underline hover:text-foreground transition-colors"
              >
                Explore
              </Link>
              <Link
                href="/internal"
                className="text-sm text-muted-foreground no-underline hover:text-foreground transition-colors"
              >
                Internal
              </Link>
              <DevModeToggle />
            </nav>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
