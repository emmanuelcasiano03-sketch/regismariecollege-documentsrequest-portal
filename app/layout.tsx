import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Regis Marie College | Document Request System",
    template: "%s — Regis Marie College",
  },
  description: "Web-based academic document request and analytics system for Regis Marie College.",
  icons: {
    icon: "/rmclogo.jpg",
    shortcut: "/rmclogo.jpg",
    apple: "/rmclogo.jpg",
  },
};

export const viewport: Viewport = {
  themeColor: "#0B3068",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}