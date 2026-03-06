"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Lock,
  Folder,
  GitBranch,
  Star,
  Share2,
  Zap,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                <span className="text-white font-bold text-lg">N</span>
              </div>
              <span className="text-xl font-bold text-gray-900">NeatRepo</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <Link
                href="#features"
                className="text-gray-600 hover:text-gray-900 transition"
              >
                Features
              </Link>
              <Link
                href="#how-it-works"
                className="text-gray-600 hover:text-gray-900 transition"
              >
                How it works
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/auth/login">
                <Button
                  variant="ghost"
                  className="text-gray-600 hover:text-gray-900"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button className="bg-gray-900 text-white hover:bg-gray-800">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 border border-blue-200">
                <GitBranch className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-600 font-medium">
                  GitHub repository organizer
                </span>
              </div>
              <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-tight">
                Keep your GitHub repos{" "}
                <span className="text-blue-600">neatly organized</span>
              </h1>
            </div>
            <p className="text-lg text-gray-600">
              NeatRepo connects to your GitHub account and lets you group
              repositories into folders, mark favorites, and share a clean
              public profile — so you always know where everything is.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/auth/login" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full bg-gray-900 text-white hover:bg-gray-800"
                >
                  Connect GitHub <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-gray-300 text-gray-900 hover:bg-gray-50"
                asChild
              >
                <a href="#how-it-works">See how it works</a>
              </Button>
            </div>
          </div>

          {/* Hero Visual — mock dashboard */}
          <div className="relative">
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 shadow-lg space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              {/* Folder rows */}
              {[
                { icon: "🚀", name: "Side Projects", count: 12, pinned: true },
                { icon: "💼", name: "Work", count: 8, pinned: false },
                { icon: "📚", name: "Learning", count: 24, pinned: false },
              ].map((folder) => (
                <div
                  key={folder.name}
                  className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg p-3"
                >
                  <span className="text-xl">{folder.icon}</span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">
                      {folder.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {folder.count} repos
                    </p>
                  </div>
                  {folder.pinned && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                      Pinned
                    </span>
                  )}
                </div>
              ))}
              {/* Repo row */}
              <div className="mt-2 flex items-center gap-3 bg-white border border-gray-200 rounded-lg p-3">
                <div className="w-7 h-7 rounded bg-blue-100 flex items-center justify-center">
                  <GitBranch className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">
                    my-nextjs-app
                  </p>
                  <p className="text-xs text-gray-400">TypeScript · ⭐ 42</p>
                </div>
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 pt-20 border-t border-gray-200">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">∞</div>
            <p className="text-gray-600 text-sm mt-2">Repositories</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">Free</div>
            <p className="text-gray-600 text-sm mt-2">Forever</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">OAuth</div>
            <p className="text-gray-600 text-sm mt-2">Secure Auth</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">1-click</div>
            <p className="text-gray-600 text-sm mt-2">Setup</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-gray-200"
      >
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Everything you need to stay organized
          </h2>
          <p className="text-lg text-gray-600">
            Stop scrolling through hundreds of repos. Start working with
            structure.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: Folder,
              title: "Custom Folders",
              description:
                "Group repositories into named folders with emoji icons. Pin your most important ones to the top.",
            },
            {
              icon: Star,
              title: "Favorites",
              description:
                "Mark repositories as favorites and quickly surface them on your profile and across the app.",
            },
            {
              icon: Share2,
              title: "Shareable Profile",
              description:
                "Enable a public profile at /p/your-username to showcase your folders and starred repos to anyone.",
            },
            {
              icon: GitBranch,
              title: "Full GitHub Sync",
              description:
                "Automatically syncs all your repositories from GitHub — even if you have hundreds of them.",
            },
            {
              icon: Zap,
              title: "Smart Filtering",
              description:
                "Filter your repos by folder, language, update date, or star count in seconds.",
            },
            {
              icon: Lock,
              title: "Private by Default",
              description:
                "Your data is yours. Everything is private unless you choose to share it. No tracking, no ads.",
            },
          ].map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="group p-8 rounded-xl bg-gray-50 border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition"
              >
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4 group-hover:bg-blue-200 transition">
                  <Icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it Works */}
      <section
        id="how-it-works"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-gray-200"
      >
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Up and running in 30 seconds
          </h2>
          <p className="text-lg text-gray-600">
            No config, no setup. Just click and organize.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: "01",
              title: "Sign in with GitHub",
              desc: "One click OAuth — no passwords, no forms.",
            },
            {
              step: "02",
              title: "Your repos are synced",
              desc: "All your GitHub repositories are imported automatically and kept up to date.",
            },
            {
              step: "03",
              title: "Organize and share",
              desc: "Create folders, pin favorites, and optionally share your profile with others.",
            },
          ].map((s) => (
            <div key={s.step} className="flex gap-5">
              <div className="shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                {s.step}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">{s.title}</h3>
                <p className="text-gray-600 text-sm">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-gray-200">
        <div className="rounded-2xl overflow-hidden bg-blue-50 border border-blue-200">
          <div className="p-12 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Ready to tidy up your GitHub?
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Connect your GitHub account for free and start organizing your
              repositories in under a minute.
            </p>
            <Link href="/auth/login">
              <Button
                size="lg"
                className="bg-gray-900 text-white hover:bg-gray-800"
              >
                Connect GitHub <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col sm:flex-row justify-between items-center text-gray-600 text-sm gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-blue-500 flex items-center justify-center">
                <span className="text-white text-xs font-bold">N</span>
              </div>
              <span className="font-semibold text-gray-900">NeatRepo</span>
              <span className="text-gray-400">·</span>
              <span>© 2026</span>
            </div>
            <div className="flex gap-6">
              <Link
                href="/auth/login"
                className="hover:text-gray-900 transition"
              >
                Sign In
              </Link>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-900 transition"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
