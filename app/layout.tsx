import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "./providers";

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: {
    default: "NeatRepo – Folders for your GitHub repositories",
    template: "%s · NeatRepo",
  },
  description:
    "NeatRepo syncs your GitHub repositories and lets you organize them into folders, pin favorites, and share a clean public profile.",
  keywords: ["GitHub", "repositories", "organize", "folders", "developer tools"],
  openGraph: {
    type: "website",
    title: "NeatRepo – Folders for your GitHub repositories",
    description:
      "Organize your GitHub repositories into folders and share the ones you choose.",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
        <Toaster richColors />
      </body>
    </html>
  );
}
