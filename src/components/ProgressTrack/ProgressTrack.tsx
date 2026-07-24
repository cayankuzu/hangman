import type { RoundAnswer } from "../../types/game";

export function ProgressTrack({
  answers,
  currentIndex,
  questionCount = 9,
}: {
  answers: RoundAnswer[];
  currentIndex: number;
  questionCount?: number;
}) {
  return (
    <ol className="progressTrack" aria-label="Question progress">
      {Array.from({ length: questionCount }, (_, index) => {
        const answer = answers[index];
        const state = answer
          ? answer.correct
            ? "correct"
            : "wrong"
          : index === currentIndex
            ? "current"
            : "empty";
        return (
          <li className={state} key={index} aria-label={`${index + 1}: ${state}`}>
            <span>{answer ? (answer.correct ? "✓" : "×") : index + 1}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function MechanismTrack({
  value,
  mode,
}: {
  value: number;
  mode: "execute" | "rescue";
}) {
  return (
    <div className="mechanismTrack" aria-label={`Mechanism ${value} of 6`}>
      {Array.from({ length: 6 }, (_, index) => (
        <span
          key={index}
          className={index < value ? "isComplete" : ""}
          style={{ "--step-delay": `${index * 45}ms` } as React.CSSProperties}
        >
          {mode === "execute" ? index + 1 : 6 - index}
        </span>
      ))}
    </div>
  );
}
