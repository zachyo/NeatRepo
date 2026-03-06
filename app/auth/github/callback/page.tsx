"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Github, Loader2 } from "lucide-react";

export default function GitHubCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          Loading...
        </div>
      }
    >
      <GitHubCallbackContent />
    </Suspense>
  );
}

function GitHubCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const isProcessing = useRef(false);

  useEffect(() => {
    const code = searchParams.get("code");
    const errParam = searchParams.get("error");

    if (errParam) {
      setError(errParam);
      return;
    }

    if (!code) {
      setError("No authorization code provided by GitHub.");
      return;
    }

    if (isProcessing.current) return;
    isProcessing.current = true;

    const authenticate = async () => {
      try {
        const response = await fetch("/api/auth/callback", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code }),
        });

        if (response.ok) {
          router.push("/dashboard");
        } else {
          const data = await response.json();
          setError(data.error || "Authentication failed");
        }
      } catch (err) {
        console.error("Auth error:", err);
        setError("An unexpected error occurred during authentication.");
      }
    };

    authenticate();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col items-center text-center">
        <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 relative">
          <Github className="w-8 h-8 text-blue-600" />
          {!error && (
            // <div className="absolute inset-0 border-4 border-gradient-to-r from-blue-500 to-transparent rounded-2xl animate-spin" />
            <Loader2
              className="w-20 h-20 text-blue-600 animate-spin absolute inset-0"
              strokeWidth={1}
            />
          )}
        </div>

        {error ? (
          <>
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              Authentication Failed
            </h1>
            <p className="text-gray-500 text-sm mb-6">{error}</p>
            <button
              onClick={() => router.push("/auth/login")}
              className="w-full py-2.5 px-4 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
              Back to Login
            </button>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              Authenticating...
            </h1>
            <p className="text-gray-500 text-sm flex items-center justify-center gap-2">
              {/* <Loader2 className="w-4 h-4 animate-spin text-gray-400" /> */}
              Setting up your workspace
            </p>
          </>
        )}
      </div>
    </div>
  );
}
