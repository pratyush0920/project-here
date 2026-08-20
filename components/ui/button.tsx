import type { ButtonHTMLAttributes, ReactNode } from "react";

const variants = {
  primary:
    "bg-accent-strong text-white hover:bg-accent disabled:opacity-60",
  secondary:
    "bg-surface-warm text-foreground hover:bg-border disabled:opacity-60",
  ghost: "bg-transparent text-muted hover:text-foreground disabled:opacity-60",
  danger: "bg-danger text-white hover:opacity-90 disabled:opacity-60",
};

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  children: ReactNode;
}) {
  return (
    <button
      className={`inline-flex min-h-12 items-center justify-center rounded-full px-5 text-[15px] font-medium transition-colors ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
      {hint ? <span className="text-sm text-muted">{hint}</span> : null}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`min-h-12 rounded-2xl border border-border bg-surface px-4 text-[16px] text-foreground placeholder:text-muted/70 ${props.className ?? ""}`}
    />
  );
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`rounded-2xl border border-border bg-surface px-4 py-3 text-[16px] text-foreground placeholder:text-muted/70 ${props.className ?? ""}`}
    />
  );
}
