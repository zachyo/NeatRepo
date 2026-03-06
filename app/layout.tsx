"use client";

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

const metadata: Metadata = {
  title: "RepoFolders - Organize Files, Collaborate Seamlessly",
  description:
    "RepoFolders makes team file management effortless. Create workspaces, organize with folders, share securely, and collaborate in real-time.",
  generator: "v0.app",
  keywords:
    "file management, collaboration, workspace, secure sharing, team productivity",
  authors: [{ name: "RepoFolders" }],
  openGraph: {
    type: "website",
    url: "https://repofolders.com",
    title: "RepoFolders - Organize Files, Collaborate Seamlessly",
    description: "Team file management made simple",
    images: [{ url: "https://repofolders.com/og-image.png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 min cache
            refetchOnWindowFocus: false,
          },
        },
      }),
  );
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
        <Toaster richColors />
      </body>
    </html>
  );
}
