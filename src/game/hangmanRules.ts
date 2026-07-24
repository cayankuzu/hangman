import type { RoundAnswer } from "../types/game";

export const MECHANISM_STEPS = 6;
export const QUESTIONS_PER_ROUND = 99;

export function resolveMechanismAnswer(progress: number, correct: boolean) {
  if (correct) {
    const nextProgress = Math.min(progress + 1, MECHANISM_STEPS);
    return {
      progress: nextProgress,
      outcome: nextProgress === MECHANISM_STEPS ? ("won" as const) : null,
    };
  }

  if (progress === 0) {
    return { progress: 0, outcome: "lost" as const };
  }

  return { progress: progress - 1, outcome: null };
}

export function resolveQuestionLimit(
  questionIndex: number,
  progress: number,
  outcome: "won" | "lost" | null,
) {
  if (outcome || questionIndex < QUESTIONS_PER_ROUND - 1) return outcome;
  return progress >= Math.ceil(MECHANISM_STEPS / 2) ? "won" : "lost";
}

export function getRoundCounts(answers: readonly RoundAnswer[]) {
  let correct = 0;
  let wrong = 0;
  for (const answer of answers) {
    if (answer.correct) correct += 1;
    else wrong += 1;
  }
  return { correct, wrong };
}

export function getRoundStats(answers: readonly RoundAnswer[]) {
  const { correct, wrong } = getRoundCounts(answers);
  let streak = 0;
  let bestStreak = 0;
  for (const answer of answers) {
    if (answer.correct) {
      streak += 1;
      bestStreak = Math.max(bestStreak, streak);
    } else {
      streak = 0;
    }
  }

  return {
    correct,
    wrong,
    total: answers.length,
    accuracy:
      answers.length === 0 ? 0 : Math.round((correct / answers.length) * 100),
    bestStreak,
  };
}
