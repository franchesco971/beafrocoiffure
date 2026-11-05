export function Logo({ className = "", decorative = false }: { className?: string; decorative?: boolean }) {
  return (
    <span
      {...(decorative ? { "aria-hidden": true } : { role: "img", "aria-label": "Be Afro" })}
      className={`mask-logo block ${className}`}
    />
  );
}

export function Mark({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={`mask-mark block ${className}`} />;
}
