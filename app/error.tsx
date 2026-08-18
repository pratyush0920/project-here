"use client";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-[560px] flex-col justify-center px-5">
      <h1 className="text-xl font-medium">Something got lost on the way.</h1>
      <p className="mt-2 text-sm text-muted">
        Couldn&apos;t save that. Your update is still here, so try once more.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 min-h-12 rounded-full bg-accent-strong px-5 text-white"
      >
        Try again
      </button>
    </div>
  );
}
