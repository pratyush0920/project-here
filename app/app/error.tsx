"use client";

export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="py-10">
      <h1 className="text-lg font-medium">Couldn&apos;t load this just now.</h1>
      <p className="mt-2 text-sm text-muted">
        Couldn&apos;t save that. Your update is still here, so try once more.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 text-sm text-accent-strong"
      >
        Try again
      </button>
    </div>
  );
}
