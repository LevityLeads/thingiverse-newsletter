'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useState } from 'react';
import type { Thing, Creator } from '@/lib/types';

type NLType = 'creator-spotlight' | 'the-build';

const IMAGE_CDN = 'https://cdn.thingiverse.com';

function cdnUrl(path: string | null): string {
  if (!path) return 'https://cdn.thingiverse.com/site/img/default/G0x0.jpg';
  if (path.startsWith('http')) return path;
  return `${IMAGE_CDN}${path.startsWith('/') ? '' : '/'}${path}`;
}

interface ScheduledSend {
  id: string;
  name: string;
  scheduledAt: string;
}

function getNextTuesday(): string {
  const d = new Date();
  const day = d.getDay();
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

  // Pulled data state
  const [pulledThings, setPulledThings] = useState<Thing[] | null>(null);
  const [pulledCreators, setPulledCreators] = useState<Creator[] | null>(null);
  const [pullLoading, setPullLoading] = useState(false);
  const [pullError, setPullError] = useState('');

  // Editing state for The Build
  const [introText, setIntroText] = useState('Here are some projects that caught our eye this week.');
  const [descriptions, setDescriptions] = useState<Record<number, string>>({});

  // Editing state for Creator Spotlight
  const [taglines, setTaglines] = useState<Record<number, string>>({});
  const [bios, setBios] = useState<Record<number, string>>({});

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
    // Reset pulled data when switching type
    setPulledThings(null);
    setPulledCreators(null);
    setDescriptions({});
    setTaglines({});
    setBios({});
  }

  // Step 1a: Pull data from Metabase
  const handlePullData = useCallback(async () => {
    if (!type) return;
    setPullLoading(true);
    setPullError('');

    const filledUrls = urls.filter((u) => u.trim());
    if (filledUrls.length === 0) {
      setPullError('Enter at least one URL');
      setPullLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, urls: filledUrls }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Pull failed');
      }

      const data = await res.json();

      if (type === 'the-build') {
        const things = data.data as Thing[];
        setPulledThings(things);
        // Initialize descriptions from pulled data (empty by default)
        const descs: Record<number, string> = {};
        for (const t of things) {
          descs[t.id] = t.description || '';
        }
        setDescriptions(descs);
      } else {
        const creators = data.data as Creator[];
        setPulledCreators(creators);
        // Pre-fill bios from DB data, taglines empty
        const newBios: Record<number, string> = {};
        const newTaglines: Record<number, string> = {};
        for (const c of creators) {
          newBios[c.id] = c.bio || '';
          newTaglines[c.id] = c.tagline || '';
        }
        setBios(newBios);
        setTaglines(newTaglines);
      }
    } catch (err: unknown) {
      setPullError(err instanceof Error ? err.message : 'Pull failed');
    } finally {
      setPullLoading(false);
    }
  }, [type, urls]);

  // Step 1b: Generate preview with edited data
  const handleGeneratePreview = useCallback(async () => {
    if (!type) return;
    setPreviewLoading(true);
    setPreviewError('');

    try {
      let body: Record<string, unknown>;

      if (type === 'the-build' && pulledThings) {
        // Merge descriptions into things
        const enrichedThings = pulledThings.map((t) => ({
          ...t,
          description: descriptions[t.id] || '',
        }));
        body = { type, things: enrichedThings, introText };
      } else if (type === 'creator-spotlight' && pulledCreators) {
        // Merge taglines and bios into creators
        const enrichedCreators = pulledCreators.map((c) => ({
          ...c,
          tagline: taglines[c.id] || '',
          bio: bios[c.id] || '',
        }));
        body = { type, creators: enrichedCreators };
      } else {
        setPreviewError('No data pulled yet');
        setPreviewLoading(false);
        return;
      }

      const res = await fetch('/api/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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
  }, [type, pulledThings, pulledCreators, descriptions, taglines, bios, introText]);

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

  /* ----- Step 1: Type + URLs + Edit ----- */
  const urlLabel = type === 'the-build' ? 'Thing URL' : 'Creator Profile URL';
  const urlPlaceholder =
    type === 'the-build' ? 'thingiverse.com/thing:12345' : 'thingiverse.com/username';

  const hasPulledData = type === 'the-build' ? !!pulledThings : !!pulledCreators;

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

          {pullError && <p className="mb-4 text-sm text-tv-red">{pullError}</p>}

          {/* Pull Data button (only show if no data yet) */}
          {!hasPulledData && (
            <button
              onClick={handlePullData}
              disabled={pullLoading}
              className="w-full rounded-lg bg-tv-blue px-6 py-3 font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {pullLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                    <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                  </svg>
                  Pulling data...
                </span>
              ) : (
                'Pull Data'
              )}
            </button>
          )}

          {/* ---- Editing Section: The Build ---- */}
          {type === 'the-build' && pulledThings && (
            <div className="mt-8 space-y-6">
              <h2 className="text-lg font-bold text-tv-dark">Edit Content</h2>

              {/* Intro text */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Intro Text
                </label>
                <textarea
                  value={introText}
                  onChange={(e) => setIntroText(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-tv-blue focus:outline-none focus:ring-2 focus:ring-tv-blue/30"
                />
              </div>

              {/* Thing editing cards */}
              {pulledThings.map((thing) => (
                <div
                  key={thing.id}
                  className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
                >
                  <div className="flex gap-4">
                    {/* Thumbnail */}
                    <div className="flex-shrink-0">
                      <img
                        src={cdnUrl(thing.imagePath)}
                        alt={thing.name}
                        className="h-20 w-20 rounded-lg object-cover"
                      />
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-tv-dark truncate">{thing.name}</p>
                      <p className="text-xs text-gray-500">
                        by {thing.creator.firstName || thing.creator.username} {thing.creator.lastName}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mt-4">
                    <label className="mb-1 block text-xs font-medium text-gray-500">
                      Description
                    </label>
                    <textarea
                      value={descriptions[thing.id] || ''}
                      onChange={(e) =>
                        setDescriptions((prev) => ({
                          ...prev,
                          [thing.id]: e.target.value,
                        }))
                      }
                      rows={3}
                      placeholder="Write an editorial description for this thing..."
                      className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-tv-blue focus:outline-none focus:ring-2 focus:ring-tv-blue/30"
                    />
                  </div>

                  {/* Secondary images */}
                  {thing.secondaryImages.length > 0 && (
                    <div className="mt-3">
                      <label className="mb-1 block text-xs font-medium text-gray-500">
                        Secondary Images ({thing.secondaryImages.length})
                      </label>
                      <div className="flex gap-2">
                        {thing.secondaryImages.map((img, idx) => (
                          <img
                            key={idx}
                            src={cdnUrl(img)}
                            alt=""
                            className="h-16 w-24 rounded-md object-cover border border-gray-100"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {previewError && <p className="text-sm text-tv-red">{previewError}</p>}

              <button
                onClick={handleGeneratePreview}
                disabled={previewLoading}
                className="w-full rounded-lg bg-tv-blue px-6 py-3 font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                {previewLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                      <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                    </svg>
                    Generating preview...
                  </span>
                ) : (
                  'Generate Preview'
                )}
              </button>
            </div>
          )}

          {/* ---- Editing Section: Creator Spotlight ---- */}
          {type === 'creator-spotlight' && pulledCreators && (
            <div className="mt-8 space-y-6">
              <h2 className="text-lg font-bold text-tv-dark">Edit Content</h2>

              {/* Creator editing cards */}
              {pulledCreators.map((creator) => {
                const fullName = `${creator.firstName} ${creator.lastName}`.trim() || creator.username;
                return (
                  <div
                    key={creator.id}
                    className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
                  >
                    <div className="flex gap-4">
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        <img
                          src={cdnUrl(creator.avatarPath)}
                          alt={fullName}
                          className="h-16 w-16 rounded-full object-cover border-2 border-[#2b52fe]"
                        />
                      </div>
                      {/* Name */}
                      <div className="flex-1 min-w-0 flex items-center">
                        <p className="text-sm font-semibold text-tv-dark">{fullName}</p>
                      </div>
                    </div>

                    {/* Tagline */}
                    <div className="mt-4">
                      <label className="mb-1 block text-xs font-medium text-gray-500">
                        Tagline
                      </label>
                      <input
                        type="text"
                        value={taglines[creator.id] || ''}
                        onChange={(e) =>
                          setTaglines((prev) => ({
                            ...prev,
                            [creator.id]: e.target.value,
                          }))
                        }
                        placeholder="Custom tagline, e.g. 'Master of miniatures' (leave blank for auto-generated)"
                        className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-tv-blue focus:outline-none focus:ring-2 focus:ring-tv-blue/30"
                      />
                    </div>

                    {/* Bio */}
                    <div className="mt-3">
                      <label className="mb-1 block text-xs font-medium text-gray-500">
                        Bio
                      </label>
                      <textarea
                        value={bios[creator.id] || ''}
                        onChange={(e) =>
                          setBios((prev) => ({
                            ...prev,
                            [creator.id]: e.target.value,
                          }))
                        }
                        rows={3}
                        placeholder="Creator bio..."
                        className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-tv-blue focus:outline-none focus:ring-2 focus:ring-tv-blue/30"
                      />
                    </div>

                    {/* Designs preview */}
                    {creator.designs.length > 0 && (
                      <div className="mt-3">
                        <label className="mb-1 block text-xs font-medium text-gray-500">
                          Designs ({creator.designs.length})
                        </label>
                        <div className="flex gap-2">
                          {creator.designs.map((d) => (
                            <img
                              key={d.id}
                              src={cdnUrl(d.imagePath)}
                              alt={d.name}
                              className="h-16 w-24 rounded-md object-cover border border-gray-100"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {previewError && <p className="text-sm text-tv-red">{previewError}</p>}

              <button
                onClick={handleGeneratePreview}
                disabled={previewLoading}
                className="w-full rounded-lg bg-tv-blue px-6 py-3 font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                {previewLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                      <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                    </svg>
                    Generating preview...
                  </span>
                ) : (
                  'Generate Preview'
                )}
              </button>
            </div>
          )}
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
