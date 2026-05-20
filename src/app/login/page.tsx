'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? 'Invalid password');
        return;
      }

      router.push('/');
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm rounded-xl border border-gray-100 bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-center text-2xl font-bold text-tv-blue">
          Thingiverse Newsletter
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:border-tv-blue focus:outline-none focus:ring-2 focus:ring-tv-blue/30"
            autoFocus
          />

          {error && <p className="text-sm text-tv-red">{error}</p>}

          <button
            type="submit"
            disabled={loading || !password}
            className="rounded-lg bg-tv-blue px-6 py-3 font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
      </div>
    </div>
  );
}
