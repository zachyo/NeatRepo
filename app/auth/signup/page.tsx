'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Github } from 'lucide-react';
import { Logo } from '@/components/brand/logo';

export default function SignupPage() {
  const handleGitHubLogin = () => {
    window.location.href = '/api/auth/github';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
      <div className="mb-8">
        <Logo className="mb-6" />
        <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
        <p className="text-gray-600 mt-2">Join teams organizing files better</p>
      </div>

      <Button
        onClick={handleGitHubLogin}
        className="w-full bg-gray-900 text-white hover:bg-gray-800 flex items-center justify-center gap-2"
        size="lg"
      >
        <Github className="w-4 h-4" />
        Sign up with GitHub
      </Button>

      <p className="text-center text-gray-600 text-sm mt-6">
        Already have an account?{' '}
        <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}
