'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import StatusBadge from '@/components/StatusBadge';

interface Send {
  id: string;
  name: string;
  status: string;
  send_at?: string;
  created_at: string;
}

export default function DashboardPage() {
  const [sends, setSends] = useState<Send[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/sends')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load sends');
        return r.json();
      })
      .then((data) => setSends((data.sends ?? []).slice(0, 5)))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      {/* Hero */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-tv-dark">Newsletter Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Create, schedule, and track your Thingiverse newsletters
        </p>
      </div>

      {/* Action cards */}
      <div className="mb-12 grid gap-6 sm:grid-cols-2">
        <Link
          href="/create?type=creator-spotlight"
          className="group rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition hover:shadow-md"
        >
          <div className="mb-1 flex items-center gap-2 border-l-4 border-tv-blue pl-4">
            <span className="text-2xl" role="img" aria-label="star">
              &#11088;
            </span>
            <h2 className="text-xl font-semibold text-tv-dark group-hover:text-tv-blue">
              Creator Spotlight
            </h2>
          </div>
          <p className="mt-3 pl-5 text-sm text-gray-600">
            Feature 3 creators with their top designs
          </p>
        </Link>

        <Link
          href="/create?type=the-build"
          className="group rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition hover:shadow-md"
        >
          <div className="mb-1 flex items-center gap-2 border-l-4 border-tv-blue pl-4">
            <span className="text-2xl" role="img" aria-label="wrench">
              &#128295;
            </span>
            <h2 className="text-xl font-semibold text-tv-dark group-hover:text-tv-blue">
              The Build
            </h2>
          </div>
          <p className="mt-3 pl-5 text-sm text-gray-600">
            Highlight specific projects and things
          </p>
        </Link>
      </div>

      {/* Recent sends */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-tv-dark">Recent Sends</h2>

        {loading && <p className="text-sm text-gray-500">Loading...</p>}
        {error && <p className="text-sm text-tv-red">{error}</p>}

        {!loading && !error && sends.length === 0 && (
          <p className="text-sm text-gray-500">No sends yet. Create your first newsletter above.</p>
        )}

        {!loading && sends.length > 0 && (
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
            {sends.map((send, i) => (
              <div
                key={send.id}
                className={`flex items-center justify-between px-6 py-4 ${
                  i < sends.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-tv-dark">{send.name}</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {send.send_at
                      ? new Date(send.send_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : new Date(send.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                  </p>
                </div>
                <StatusBadge status={send.status} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
