"use client";

import { ModeToggle } from "@/components/mode-toggle";

export default function GuestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      {/* Guest Header */}
      <header className="border-b  backdrop-blur ">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold">Lap CMS</h1>
          </div>

          <div className="flex items-center space-x-4">
            <ModeToggle />
          </div>
        </div>
      </header>

      {/* Guest Content */}
      <main className="flex-1">{children}</main>

      {/* Guest Footer */}
      <footer className="border-t  backdrop-blur ">
        <div className="container flex h-16 items-center justify-center">
          <p className="text-sm text-muted-foreground">
            © 2025 Lap CMS. Tüm hakları saklıdır.
          </p>
        </div>
      </footer>
    </div>
  );
}
