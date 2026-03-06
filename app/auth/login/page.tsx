"use client";

import Link from "next/link";
import {
  Github,
  Code2,
  FolderGit2,
  Zap,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleGitHubLogin = () => {
    setLoading(true);
    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
    const redirectUri = `${window.location.origin}/auth/github/callback`;
    const scope = "user:email";

    window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-4 selection:bg-blue-100">
      <div
        className={`w-full max-w-[1000px] grid grid-cols-1 md:grid-cols-2 bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-[0_8px_40px_rgba(0,0,0,0.04)] transition-all duration-1000 ease-out transform ${
          mounted ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
        }`}
      >
        {/* Left Side - Content/Branding */}
        <div className="p-10 lg:p-14 bg-[#FAFAFA] flex flex-col justify-between border-r border-gray-100 relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center transform group-hover:scale-105 transition-transform duration-500 ease-out shadow-sm">
                <Code2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-gray-900">
                NeatRepo
              </span>
            </div>

            <h1 className="text-3xl lg:text-4xl font-semibold text-gray-900 leading-tight tracking-tight mb-6 relative">
              Organize your GitHub chaos. <br />
              <span className="text-gray-400 font-normal">Effortlessly.</span>
            </h1>

            <p className="text-base text-gray-500 leading-relaxed max-w-sm mb-12">
              Group repositories into folders, pin your favorites, and share
              your pristine workspace with the world.
            </p>
          </div>

          <div className="space-y-6 relative z-10">
            <div className="flex items-center gap-4 text-gray-600 group/item">
              <div className="w-10 h-10 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center group-hover/item:border-blue-200 group-hover/item:text-blue-600 transition-colors">
                <FolderGit2 className="w-4 h-4" />
              </div>
              <span className="font-medium text-sm">Smart Folders</span>
            </div>
            <div className="flex items-center gap-4 text-gray-600 group/item">
              <div className="w-10 h-10 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center group-hover/item:border-blue-200 group-hover/item:text-blue-600 transition-colors">
                <Zap className="w-4 h-4" />
              </div>
              <span className="font-medium text-sm">
                Real-time Background Sync
              </span>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="p-10 lg:p-14 flex flex-col justify-center items-center relative">
          <div className="w-full max-w-sm">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-semibold tracking-tight text-gray-900 mb-2">
                Welcome back
              </h2>
              <p className="text-sm text-gray-500">
                Sign in to your account to continue
              </p>
            </div>

            <button
              onClick={handleGitHubLogin}
              disabled={loading}
              className="group relative w-full flex items-center justify-center gap-3 bg-[#181717] hover:bg-[#2D2C2C] disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-4 rounded-2xl font-medium transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(0,0,0,0.1)] focus:outline-none focus:ring-2 focus:ring-[#181717] focus:ring-offset-2"
            >
              <Github className="w-5 h-5 transition-transform group-hover:-rotate-6" />
              <span>Continue with GitHub</span>
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4 absolute right-6 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 delay-75 ease-out text-gray-300" />
              )}
            </button>

            <div className="mt-8 flex items-center justify-center gap-2">
              <div className="h-[1px] flex-1 bg-gray-100"></div>
              <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                Or
              </span>
              <div className="h-[1px] flex-1 bg-gray-100"></div>
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500">
                Don&apos;t have an account?{" "}
                <button
                  onClick={handleGitHubLogin}
                  className="text-blue-600 hover:text-blue-700 font-medium hover:underline underline-offset-4 transition-all"
                >
                  Sign up with GitHub
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
