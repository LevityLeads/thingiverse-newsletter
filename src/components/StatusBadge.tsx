const styles: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  scheduled: 'bg-yellow-100 text-yellow-800',
  triggered: 'bg-green-600 text-white',
};

export default function StatusBadge({ status }: { status: string }) {
  const cls = styles[status] ?? styles.draft;
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${cls}`}>
      {status}
    </span>
  );
}
