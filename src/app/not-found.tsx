import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-6xl font-bold text-tv-dark">404</h1>
      <p className="text-lg text-gray-600">Page not found</p>
      <Link
        href="/"
        className="mt-2 rounded-lg bg-tv-blue px-6 py-3 font-semibold text-white hover:opacity-90"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
