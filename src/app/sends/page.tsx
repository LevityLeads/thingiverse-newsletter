'use client';

import { useEffect, useState } from 'react';
import StatusBadge from '@/components/StatusBadge';

interface Send {
  id: string;
  name: string;
  status: string;
  send_at?: string;
  created_at: string;
}

interface Stats {
  delivered: number;
  opens: number;
  unique_opens: number;
  clicks: number;
  unique_clicks: number;
  bounces: number;
  spam_reports: number;
  unsubscribes: number;
  requests: number;
}

// Hardcoded from config (client-side component can't import server config)
const THRESHOLDS = {
  deliveryMin: 0.95,
  opensMin: 0.15,
  bouncesMax: 0.02,
  spamMax: 0.0005,
  unsubsMax: 0.003,
};

function pct(n: number): string {
  return (n * 100).toFixed(2) + '%';
}

function StatRow({ label, value, good }: { label: string; value: string; good: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-2.5">
      <span className="text-sm text-gray-700">{label}</span>
      <span className={`text-sm font-semibold ${good ? 'text-tv-green' : 'text-tv-red'}`}>
        {value}
      </span>
    </div>
  );
}

function SendRow({ send }: { send: Send }) {
  const [expanded, setExpanded] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState('');

  function toggleExpand() {
    const willExpand = !expanded;
    setExpanded(willExpand);

    if (willExpand && !stats && !statsLoading) {
      setStatsLoading(true);
      setStatsError('');
      fetch(`/api/stats?sendId=${send.id}`)
        .then((r) => {
          if (!r.ok) throw new Error('Failed to load stats');
          return r.json();
        })
        .then((data) => setStats(data.stats))
        .catch((err) => setStatsError(err.message))
        .finally(() => setStatsLoading(false));
    }
  }

  const deliveryRate = stats && stats.requests > 0 ? stats.delivered / stats.requests : 0;
  const openRate = stats && stats.delivered > 0 ? stats.unique_opens / stats.delivered : 0;
  const clickRate = stats && stats.delivered > 0 ? stats.unique_clicks / stats.delivered : 0;
  const bounceRate = stats && stats.requests > 0 ? stats.bounces / stats.requests : 0;
  const spamRate = stats && stats.delivered > 0 ? stats.spam_reports / stats.delivered : 0;
  const unsubRate = stats && stats.delivered > 0 ? stats.unsubscribes / stats.delivered : 0;

  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={toggleExpand}
        className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-gray-50"
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
        <div className="ml-4 flex items-center gap-3">
          <StatusBadge status={send.status} />
          <svg
            className={`h-4 w-4 text-gray-400 transition ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="px-6 pb-5">
          {statsLoading && <p className="text-sm text-gray-500">Loading stats...</p>}
          {statsError && <p className="text-sm text-tv-red">{statsError}</p>}
          {stats && (
            <div className="space-y-2">
              <StatRow label="Delivery Rate" value={pct(deliveryRate)} good={deliveryRate >= THRESHOLDS.deliveryMin} />
              <StatRow label="Open Rate" value={pct(openRate)} good={openRate >= THRESHOLDS.opensMin} />
              <StatRow label="Click Rate" value={pct(clickRate)} good={true} />
              <StatRow label="Bounce Rate" value={pct(bounceRate)} good={bounceRate <= THRESHOLDS.bouncesMax} />
              <StatRow label="Spam Rate" value={pct(spamRate)} good={spamRate <= THRESHOLDS.spamMax} />
              <StatRow label="Unsub Rate" value={pct(unsubRate)} good={unsubRate <= THRESHOLDS.unsubsMax} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SendsPage() {
  const [sends, setSends] = useState<Send[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/sends')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load sends');
        return r.json();
      })
      .then((data) => setSends(data.sends ?? []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="mb-6 text-2xl font-bold text-tv-dark">Send History</h1>

      {loading && <p className="text-sm text-gray-500">Loading...</p>}
      {error && <p className="text-sm text-tv-red">{error}</p>}

      {!loading && !error && sends.length === 0 && (
        <p className="text-sm text-gray-500">No sends found.</p>
      )}

      {!loading && sends.length > 0 && (
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
          {sends.map((send) => (
            <SendRow key={send.id} send={send} />
          ))}
        </div>
      )}
    </div>
  );
}
