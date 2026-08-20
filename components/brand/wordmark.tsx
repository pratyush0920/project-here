import Link from "next/link";

export function Wordmark({ href = "/", size = "md" }: { href?: string | null; size?: "sm" | "md" | "lg" }) {
  const className =
    size === "lg"
      ? "text-3xl tracking-tight"
      : size === "sm"
        ? "text-lg tracking-tight"
        : "text-xl tracking-tight";
  const inner = (
    <span className={`font-medium text-foreground ${className}`}>
      here<span className="text-accent">.</span>
    </span>
  );
  if (!href) return inner;
  return (
    <Link href={href} className="inline-flex items-center" aria-label="Here home">
      {inner}
    </Link>
  );
}
