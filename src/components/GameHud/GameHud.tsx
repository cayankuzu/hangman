import { copy } from "../../i18n/copy";
import { MECHANISM_STEPS } from "../../game/hangmanRules";
import type {
  CharacterProfile,
  Difficulty,
  Language,
  StageMode,
} from "../../types/game";
import { MechanismTrack } from "../ProgressTrack/ProgressTrack";

export function GameHud({
  character,
  mode,
  difficulty,
  language,
  progress,
  streak,
  accuracy,
  answered,
}: {
  character: CharacterProfile;
  mode: StageMode;
  difficulty: Difficulty;
  language: Language;
  progress: number;
  streak: number;
  accuracy: number;
  answered: number;
}) {
  const remaining = MECHANISM_STEPS - progress;
  const danger = progress === 0;
  const status = danger
    ? copy(language, "hudNoMargin")
    : remaining === 1
      ? copy(language, "hudLastStep")
      : copy(language, "hudRemaining").replace("{n}", String(remaining));

  return (
    <section
      className={`gameHud mode-${mode}`}
      aria-label={copy(language, "mechanism")}
    >
      <div className="hudIdentity">
        <img src={character.avatar} alt="" />
        <div>
          <strong>{character.name}</strong>
          <span>
            {copy(language, mode)} ·{" "}
            {copy(
              language,
              difficulty === 1 ? "easy" : difficulty === 2 ? "medium" : "hard",
            )}
          </span>
        </div>
      </div>

      <div
        className={`hudMechanism${danger ? " isDanger" : ""}${remaining === 1 ? " isFinal" : ""}`}
      >
        <div className="hudMechanismHead">
          <span>
            {copy(language, mode === "execute" ? "stageExecute" : "stageRescue")}
          </span>
          <strong>
            {progress}
            <small>/{MECHANISM_STEPS}</small>
          </strong>
        </div>
        <MechanismTrack value={progress} mode={mode} compact />
        <p role="status">{status}</p>
      </div>

      <dl className="hudStats">
        <div className={streak >= 3 ? "isHot" : ""}>
          <dt>{copy(language, "hudStreak")}</dt>
          <dd>{streak > 0 ? `×${streak}` : "—"}</dd>
        </div>
        <div>
          <dt>{copy(language, "hudAccuracy")}</dt>
          <dd>{answered > 0 ? `%${accuracy}` : "—"}</dd>
        </div>
      </dl>
    </section>
  );
}
