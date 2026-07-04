export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center gap-3 py-14 text-center">
      <h3 className="text-lg font-semibold text-teal-900">{title}</h3>
      <p className="max-w-sm text-sm text-ink/60">{description}</p>
      {action}
    </div>
  );
}
