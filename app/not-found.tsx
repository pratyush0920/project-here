import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-[560px] flex-col justify-center px-5">
      <h1 className="text-xl font-medium">Nothing here.</h1>
      <p className="mt-2 text-sm text-muted">That page isn&apos;t part of this space.</p>
      <Link href="/" className="mt-6 text-accent-strong">
        Back to here.
      </Link>
    </div>
  );
}
