// Note sur 5 ; `rating` est arrondie à l'étoile entière la plus proche.
export function Stars({ rating, className = "" }: { rating: number; className?: string }) {
  const filled = Math.round(rating);

  return (
    <span
      role="img"
      aria-label={`Note : ${rating.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} sur 5`}
      className={className}
    >
      <span aria-hidden="true" className="text-gold">
        {"★".repeat(filled)}
      </span>
      <span aria-hidden="true" className="text-bone/20">
        {"★".repeat(5 - filled)}
      </span>
    </span>
  );
}
