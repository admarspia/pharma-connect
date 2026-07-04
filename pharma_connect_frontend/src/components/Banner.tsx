export function Banner({
  tone = "error",
  children,
}: {
  tone?: "error" | "success" | "info";
  children: React.ReactNode;
}) {
  const styles = {
    error: "bg-clay-500/8 text-clay-600 border-clay-500/25",
    success: "bg-sage-500/8 text-sage-600 border-sage-500/25",
    info: "bg-teal-50 text-teal-700 border-teal-300/40",
  }[tone];

  return <div className={`rounded-lg border px-4 py-3 text-sm ${styles}`}>{children}</div>;
}
