// Contour « afro » : cercle festonné, écho de la silhouette du logo.
function scallopPath(bumps: number, radius = 100) {
  const f = (v: number) => v.toFixed(3);
  const points = Array.from({ length: bumps }, (_, i) => {
    const angle = (i / bumps) * Math.PI * 2 - Math.PI / 2;
    return [radius * Math.cos(angle), radius * Math.sin(angle)] as const;
  });
  const arc = f(radius * Math.sin(Math.PI / bumps));

  let d = `M${f(points[0][0])} ${f(points[0][1])}`;
  for (let i = 1; i <= bumps; i++) {
    const [x, y] = points[i % bumps];
    d += `A${arc} ${arc} 0 0 1 ${f(x)} ${f(y)}`;
  }
  return `${d}Z`;
}

type Props = {
  bumps?: number;
  strokeWidth?: number;
  className?: string;
};

export function ScallopRing({ bumps = 44, strokeWidth = 1.25, className }: Props) {
  return (
    <svg
      viewBox="-112 -112 224 224"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      className={className}
      aria-hidden="true"
    >
      <path d={scallopPath(bumps)} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}
