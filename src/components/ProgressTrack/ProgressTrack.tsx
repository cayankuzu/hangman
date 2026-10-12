export function MechanismTrack({
  value,
  mode,
  compact = false,
}: {
  value: number;
  mode: "execute" | "rescue";
  compact?: boolean;
}) {
  return (
    <div
      className={`mechanismTrack${compact ? " isCompact" : ""}`}
      aria-label={`Mechanism ${value} of 6`}
    >
      {Array.from({ length: 6 }, (_, index) => (
        <span
          key={index}
          className={[
            index < value ? "isComplete" : "",
            index === value ? "isNext" : "",
          ].join(" ")}
          style={{ "--step-delay": `${index * 45}ms` } as React.CSSProperties}
        >
          {compact ? null : mode === "execute" ? index + 1 : 6 - index}
        </span>
      ))}
    </div>
  );
}
