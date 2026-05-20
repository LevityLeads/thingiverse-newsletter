'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useState } from 'react';

type NLType = 'creator-spotlight' | 'the-build';

interface ScheduledSend {
  id: string;
  name: string;
  scheduledAt: string;
}

function getNextTuesday(): string {
  const d = new Date();
  const day = d.getDay();
  // Advance to next Tuesday (2) or Wednesday (3), whichever is soonest and > today
  const daysUntilTue = ((2 - day + 7) % 7) || 7;
  d.setDate(d.getDate() + daysUntilTue);
  return d.toISOString().slice(0, 10);
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function formatScheduleDate(dateStr: string): string {
  const d = new Date(dateStr + 'T17:00:00Z');
  return d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }) + ' at 5pm UTC';
}

function CreatePageInner() {
  const searchParams = useSearchParams();
  const initialType = (searchParams.get('type') as NLType) || null;

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [type, setType] = useState<NLType | null>(initialType);
  const [urls, setUrls] = useState<string[]>(['', '', '']);
  const [subject, setSubject] = useState(
    initialType === 'the-build'
      ? 'The Build: '
      : 'Creator Spotlight: Meet This Week\'s Featured Makers'
  );
  const [html, setHtml] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');

  const [testEmail, setTestEmail] = useState('');
  const [testStatus, setTestStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [testError, setTestError] = useState('');

  const [startDate, setStartDate] = useState(getNextTuesday);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState('');
  const [scheduledSends, setScheduledSends] = useState<ScheduledSend[]>([]);

  const batchDates = [startDate, addDays(startDate, 1), addDays(startDate, 2)];
  const batchSizes = ['~35K', '~34K', '~28K'];

  function updateUrl(i: number, val: string) {
    setUrls((prev) => {
      const next = [...prev];
      next[i] = val;
      return next;
    });
  }

  function handleTypeChange(t: NLType) {
    setType(t);
    setSubject(
      t === 'the-build'
        ? 'The Build: '
        : 'Creator Spotlight: Meet This Week\'s Featured Makers'
    );
  }

  const handlePreview = useCallback(async () => {
    if (!type) return;
    setPreviewLoading(true);
    setPreviewError('');

    const filledUrls = urls.filter((u) => u.trim());
    if (filledUrls.length === 0) {
      setPreviewError('Enter at least one URL');
      setPreviewLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, urls: filledUrls }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Preview failed');
      }

      const data = await res.json();
      setHtml(data.html);
      setStep(2);
    } catch (err: unknown) {
      setPreviewError(err instanceof Error ? err.message : 'Preview failed');
    } finally {
      setPreviewLoading(false);
    }
  }, [type, urls]);

  async function handleTestSend() {
    if (!testEmail.trim()) return;
    setTestStatus('sending');
    setTestError('');

    try {
      const res = await fetch('/api/test-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: testEmail.trim(), subject, html }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Test send failed');
      }

      setTestStatus('sent');
    } catch (err: unknown) {
      setTestStatus('error');
      setTestError(err instanceof Error ? err.message : 'Test send failed');
    }
  }

  async function handleSchedule() {
    if (!type) return;
    setScheduleLoading(true);
    setScheduleError('');

    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          name: subject,
          subject,
          html,
          startDate,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Scheduling failed');
      }

      const data = await res.json();
      setScheduledSends(data.sends ?? []);
      setStep(3);
    } catch (err: unknown) {
      setScheduleError(err instanceof Error ? err.message : 'Scheduling failed');
    } finally {
      setScheduleLoading(false);
    }
  }

  /* ----- Step 3: Success ----- */
  if (step === 3) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20 text-center">
        <div className="mb-4 text-5xl">&#9989;</div>
        <h1 className="mb-2 text-2xl font-bold text-tv-dark">
          All {scheduledSends.length} batches scheduled!
        </h1>
        <div className="mt-6 rounded-xl border border-gray-100 bg-white p-6 text-left shadow-sm">
          {scheduledSends.map((s) => (
            <div key={s.id} className="border-b border-gray-50 py-3 last:border-0">
              <p className="text-sm font-medium text-tv-dark">{s.name}</p>
              <p className="mt-0.5 text-xs text-gray-500">
                {new Date(s.scheduledAt).toLocaleString('en-GB', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZoneName: 'short',
                })}
              </p>
            </div>
          ))}
        </div>
        <Link
          href="/"
          className="mt-8 inline-block rounded-lg bg-tv-blue px-6 py-3 font-semibold text-white hover:opacity-90"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  /* ----- Step 2: Preview + Schedule ----- */
  if (step === 2) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-8">
        <button
          onClick={() => setStep(1)}
          className="mb-4 text-sm text-gray-500 hover:text-tv-blue"
        >
          &larr; Back to editor
        </button>

        <div className="flex gap-6">
          {/* Left: Preview */}
          <div className="flex-[3] rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Email Preview
            </h2>
            <div className="flex justify-center overflow-auto bg-gray-50 p-4" style={{ maxHeight: '80vh' }}>
              <iframe
                srcDoc={html}
                title="Email preview"
                className="border-0 bg-white"
                style={{ width: 600, minHeight: 800 }}
                sandbox="allow-same-origin"
              />
            </div>
          </div>

          {/* Right: Controls */}
          <div className="flex-[2] space-y-6">
            {/* Test send */}
            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Send Test
              </h3>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="Enter your email to receive a test"
                  className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-tv-blue focus:outline-none focus:ring-2 focus:ring-tv-blue/30"
                />
                <button
                  onClick={handleTestSend}
                  disabled={testStatus === 'sending' || !testEmail.trim()}
                  className="rounded-lg bg-tv-dark px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                >
                  {testStatus === 'sending' ? 'Sending...' : 'Send Test'}
                </button>
              </div>
              {testStatus === 'sent' && (
                <p className="mt-2 text-sm text-tv-green">Test sent!</p>
              )}
              {testStatus === 'error' && (
                <p className="mt-2 text-sm text-tv-red">{testError}</p>
              )}
            </div>

            {/* Subject */}
            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Subject Line
              </h3>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-tv-blue focus:outline-none focus:ring-2 focus:ring-tv-blue/30"
              />
            </div>

            {/* Schedule */}
            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Schedule
              </h3>

              <label className="mb-1 block text-xs font-medium text-gray-500">
                Batch 1 date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mb-4 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-tv-blue focus:outline-none focus:ring-2 focus:ring-tv-blue/30"
              />

              <div className="space-y-2">
                {batchDates.map((d, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-2.5">
                    <span className="text-sm font-medium text-tv-dark">Batch {i + 1}</span>
                    <span className="text-xs text-gray-500">
                      {batchSizes[i]} &middot; {formatScheduleDate(d)}
                    </span>
                  </div>
                ))}
              </div>

              {scheduleError && (
                <p className="mt-3 text-sm text-tv-red">{scheduleError}</p>
              )}

              <button
                onClick={handleSchedule}
                disabled={scheduleLoading}
                className="mt-4 w-full rounded-lg bg-tv-green px-6 py-3 font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                {scheduleLoading ? 'Scheduling...' : 'Schedule All 3 Batches'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ----- Step 1: Type + URLs ----- */
  const urlLabel = type === 'the-build' ? 'Thing URL' : 'Creator Profile URL';
  const urlPlaceholder =
    type === 'the-build' ? 'thingiverse.com/thing:12345' : 'thingiverse.com/username';

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="mb-8 text-2xl font-bold text-tv-dark">Create Newsletter</h1>

      {/* Type selector */}
      <div className="mb-8">
        <label className="mb-3 block text-sm font-medium text-gray-700">Newsletter type</label>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleTypeChange('creator-spotlight')}
            className={`rounded-xl border-2 p-4 text-left transition ${
              type === 'creator-spotlight'
                ? 'border-tv-blue bg-tv-blue-light'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <span className="text-xl">&#11088;</span>
            <p className="mt-1 text-sm font-semibold text-tv-dark">Creator Spotlight</p>
            <p className="mt-0.5 text-xs text-gray-500">Feature 3 creators</p>
          </button>
          <button
            onClick={() => handleTypeChange('the-build')}
            className={`rounded-xl border-2 p-4 text-left transition ${
              type === 'the-build'
                ? 'border-tv-blue bg-tv-blue-light'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <span className="text-xl">&#128295;</span>
            <p className="mt-1 text-sm font-semibold text-tv-dark">The Build</p>
            <p className="mt-0.5 text-xs text-gray-500">Highlight specific things</p>
          </button>
        </div>
      </div>

      {/* URLs */}
      {type && (
        <>
          <div className="mb-6 space-y-4">
            {urls.map((url, i) => (
              <div key={i}>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {urlLabel} {i + 1}
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => updateUrl(i, e.target.value)}
                  placeholder={urlPlaceholder}
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:border-tv-blue focus:outline-none focus:ring-2 focus:ring-tv-blue/30"
                />
              </div>
            ))}

            {type === 'the-build' && urls.length < 4 && (
              <button
                onClick={() => setUrls((prev) => [...prev, ''])}
                className="text-sm font-medium text-tv-blue hover:underline"
              >
                + Add another
              </button>
            )}
          </div>

          {/* Subject */}
          <div className="mb-8">
            <label className="mb-1 block text-sm font-medium text-gray-700">Subject line</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:border-tv-blue focus:outline-none focus:ring-2 focus:ring-tv-blue/30"
            />
          </div>

          {previewError && <p className="mb-4 text-sm text-tv-red">{previewError}</p>}

          <button
            onClick={handlePreview}
            disabled={previewLoading}
            className="w-full rounded-lg bg-tv-blue px-6 py-3 font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {previewLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                  <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                </svg>
                Pulling data...
              </span>
            ) : (
              'Pull Data and Preview'
            )}
          </button>
        </>
      )}
    </div>
  );
}

export default function CreatePage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-2xl px-6 py-12"><p className="text-gray-500">Loading...</p></div>}>
      <CreatePageInner />
    </Suspense>
  );
}
