import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import {
  ArrowRight,
  ChevronRight,
  Filter,
  Folder,
  FolderOpen,
  GitBranch,
  Globe,
  Lock,
  Pin,
  RefreshCw,
  Share2,
  Star,
} from "lucide-react";

const features = [
  {
    icon: Folder,
    title: "Folders for repos",
    description:
      "Group repositories into folders like Work, Clients or Learning. A repo can live in as many folders as you need.",
  },
  {
    icon: RefreshCw,
    title: "Full GitHub sync",
    description:
      "Public and private repositories are imported and kept in sync, even if you have hundreds of them.",
  },
  {
    icon: Filter,
    title: "Fast filtering",
    description:
      "Narrow down by folder, language, last update or star count, and search across names and descriptions.",
  },
  {
    icon: Star,
    title: "Favorites and pins",
    description:
      "Pin the folders you open every day and mark favorite repos so they're always one click away.",
  },
  {
    icon: Share2,
    title: "Shareable profile",
    description:
      "Turn on a public profile at /p/your-username and choose exactly which folders appear on it.",
  },
  {
    icon: Lock,
    title: "Private by default",
    description:
      "Folders start private. Private repositories never appear on public pages, even inside a shared folder.",
  },
];

const steps = [
  {
    title: "Sign in with GitHub",
    description: "One click. No passwords, no forms.",
  },
  {
    title: "Your repos sync in",
    description: "Every repository you own or collaborate on is imported automatically.",
  },
  {
    title: "Organize and share",
    description: "Create folders, pin what matters, and publish the folders you want others to see.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-white">
      {/* Navigation */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm md:flex">
            <a href="#features" className="text-gray-600 transition-colors hover:text-gray-900">
              Features
            </a>
            <a href="#how-it-works" className="text-gray-600 transition-colors hover:text-gray-900">
              How it works
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="hidden text-gray-600 hover:text-gray-900 sm:inline-flex" asChild>
              <Link href="/auth/login">Sign in</Link>
            </Button>
            <Button className="bg-gray-900 text-white hover:bg-gray-800" asChild>
              <Link href="/auth/login">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm text-gray-600">
              <GitBranch className="size-3.5 text-blue-600" />
              Folders for your GitHub repositories
            </p>
            <h1 className="mt-6 text-4xl font-bold leading-[1.1] text-gray-900 sm:text-5xl lg:text-6xl">
              Keep your GitHub repos <span className="text-blue-600">neatly organized</span>
            </h1>
            <p className="mt-6 max-w-xl text-pretty text-lg text-gray-600">
              GitHub gives you one long list. NeatRepo syncs your repositories and lets you sort
              them into folders, pin what you use every day, and share a clean public profile.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="bg-gray-900 text-white hover:bg-gray-800" asChild>
                <Link href="/auth/login">
                  Connect GitHub
                  <ArrowRight className="ml-1 size-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-gray-300 text-gray-900 hover:bg-gray-50"
                asChild
              >
                <a href="#how-it-works">See how it works</a>
              </Button>
            </div>
            <p className="mt-4 text-sm text-gray-500">Free to use. Takes about 30 seconds.</p>
          </div>

          <ProductPreview />
        </section>

        {/* Problem strip */}
        <section className="border-y border-gray-200 bg-gray-50">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
            {[
              ["No more scrolling", "Find a repo by where it belongs, not by remembering its name."],
              ["One repo, many folders", "A shared library can sit in Work and in Open source at the same time."],
              ["Public when you choose", "Share a curated set of folders. Everything else stays private."],
            ].map(([title, body]) => (
              <div key={title}>
                <h3 className="font-semibold text-gray-900">{title}</h3>
                <p className="mt-1 text-pretty text-sm text-gray-600">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6 sm:py-24">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Everything you need to stay organized
            </h2>
            <p className="mt-4 text-pretty text-lg text-gray-600">
              Built for developers with more repositories than they can keep in their head.
            </p>
          </div>

          <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-gray-200 bg-gray-200 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => (
              <div key={title} className="bg-white p-6 sm:p-8">
                <div className="flex size-10 items-center justify-center rounded-lg bg-blue-50">
                  <Icon className="size-5 text-blue-600" />
                </div>
                <h3 className="mt-5 font-semibold text-gray-900">{title}</h3>
                <p className="mt-2 text-pretty text-sm leading-relaxed text-gray-600">{description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="scroll-mt-20 border-t border-gray-200">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Up and running in 30 seconds</h2>
              <p className="mt-4 text-pretty text-lg text-gray-600">No setup. Sign in and start sorting.</p>
            </div>
            <ol className="mt-12 grid gap-8 md:grid-cols-3">
              {steps.map((step, i) => (
                <li key={step.title} className="relative border-t-2 border-gray-900 pt-6">
                  <span className="text-sm font-medium tabular-nums text-blue-600">
                    Step {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-2 text-lg font-semibold text-gray-900">{step.title}</h3>
                  <p className="mt-2 text-pretty text-gray-600">{step.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 sm:pb-24">
          <div className="rounded-2xl bg-gray-900 px-6 py-14 text-center sm:px-12">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">Ready to tidy up your GitHub?</h2>
            <p className="mx-auto mt-4 max-w-xl text-pretty text-lg text-gray-300">
              Connect your account and have your first folder set up in under a minute.
            </p>
            <Button size="lg" className="mt-8 bg-white text-gray-900 hover:bg-gray-100" asChild>
              <Link href="/auth/login">
                Connect GitHub
                <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-gray-600 sm:flex-row sm:px-6">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <span className="text-gray-400">© {new Date().getFullYear()}</span>
          </div>
          <div className="flex gap-6">
            <Link href="/auth/login" className="transition-colors hover:text-gray-900">
              Sign in
            </Link>
            <a
              href="https://github.com/zachyo/NeatRepo"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-gray-900"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

/** Static mock of the dashboard used as the hero visual. */
function ProductPreview() {
  const folders = [
    { name: "Side projects", count: 12, pinned: true, isPublic: true },
    { name: "Work", count: 8, pinned: false, isPublic: false },
    { name: "Learning", count: 24, pinned: false, isPublic: true },
  ];
  const repos = [
    { name: "portfolio-site", lang: "TypeScript", stars: 42, fav: true, priv: false },
    { name: "invoice-cli", lang: "Go", stars: 7, fav: false, priv: true },
    { name: "rust-raytracer", lang: "Rust", stars: 128, fav: false, priv: false },
  ];

  return (
    <div aria-hidden className="relative select-none">
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl shadow-gray-200/60">
        {/* Window chrome */}
        <div className="flex items-center gap-1.5 border-b border-gray-200 bg-gray-50 px-4 py-3">
          <span className="size-2.5 rounded-full bg-gray-300" />
          <span className="size-2.5 rounded-full bg-gray-300" />
          <span className="size-2.5 rounded-full bg-gray-300" />
          <span className="ml-3 flex items-center gap-1 text-xs text-gray-500">
            Folders <ChevronRight className="size-3" /> <span className="text-gray-900">Side projects</span>
          </span>
        </div>

        <div className="grid grid-cols-[9.5rem_1fr]">
          {/* Folder list */}
          <div className="space-y-0.5 border-r border-gray-200 p-2">
            {folders.map((f, i) => (
              <div
                key={f.name}
                className={
                  i === 0
                    ? "flex items-center gap-2 rounded-md bg-blue-50 px-2 py-1.5 text-xs font-medium text-blue-700"
                    : "flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-gray-600"
                }
              >
                {i === 0 ? <FolderOpen className="size-3.5 shrink-0" /> : <Folder className="size-3.5 shrink-0" />}
                <span className="truncate">{f.name}</span>
                {f.pinned && <Pin className="ml-auto size-3 shrink-0 fill-amber-400 text-amber-500" />}
              </div>
            ))}
          </div>

          {/* Repo rows */}
          <div className="divide-y divide-gray-100">
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="text-xs font-medium text-gray-900">12 repositories</span>
              <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-2 py-0.5 text-[11px] text-gray-600">
                <Globe className="size-3" /> Public
              </span>
            </div>
            {repos.map((r) => (
              <div key={r.name} className="flex items-center gap-3 px-4 py-3">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-gray-100">
                  <GitBranch className="size-3.5 text-gray-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate text-sm font-medium text-gray-900">
                    {r.name}
                    {r.priv && <Lock className="size-3 text-gray-400" />}
                  </p>
                  <p className="text-xs tabular-nums text-gray-500">
                    {r.lang} · {r.stars} stars
                  </p>
                </div>
                <Star
                  className={r.fav ? "size-4 fill-amber-400 text-amber-500" : "size-4 text-gray-300"}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
