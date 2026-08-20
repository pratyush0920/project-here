import { Wordmark } from "@/components/brand/wordmark";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[560px] flex-col px-5 pb-10 pt-[max(1.25rem,env(safe-area-inset-top))]">
      {children}
    </div>
  );
}

export function PublicHeader() {
  return (
    <header className="flex items-center justify-between py-2">
      <Wordmark />
    </header>
  );
}
