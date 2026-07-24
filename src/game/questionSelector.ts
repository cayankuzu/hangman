import type { CharacterQuestion, Difficulty } from "../types/game";

export function shuffle<T>(items: readonly T[], random = Math.random): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function shuffleQuestionOptions(
  question: CharacterQuestion,
  random = Math.random,
): CharacterQuestion {
  return {
    ...question,
    options: shuffle(question.options, random),
  };
}

export function selectQuestionCycle(
  pool: readonly CharacterQuestion[],
  difficulty: Difficulty,
  random = Math.random,
): CharacterQuestion[] {
  const variantsBySource = new Map<string, CharacterQuestion[]>();
  const filtered = pool.filter(
    (question) => question.difficulty === difficulty,
  );

  for (const question of shuffle(filtered, random)) {
    const sourceId = question.id.replace(
      /-d[123]-(?:fact|satire)-v\d+$/,
      "",
    );
    const variants = variantsBySource.get(sourceId) ?? [];
    variants.push(question);
    variantsBySource.set(sourceId, variants);
  }

  const ordered: CharacterQuestion[] = [];
  while (ordered.length < filtered.length) {
    const activeSources = shuffle(
      [...variantsBySource.entries()].filter(([, variants]) => variants.length > 0),
      random,
    );
    for (const [, variants] of activeSources) {
      const question = variants.pop();
      if (question) ordered.push(question);
    }
  }

  return ordered.map((question) => shuffleQuestionOptions(question, random));
}

function cycleSignature(questions: readonly CharacterQuestion[]) {
  return questions
    .slice(0, 12)
    .map(
      (question) =>
        `${question.id}:${question.options.map((option) => option.id).join(",")}`,
    )
    .join("|");
}

export function selectFreshQuestionCycle(
  pool: readonly CharacterQuestion[],
  difficulty: Difficulty,
  previous: readonly CharacterQuestion[] = [],
  random = Math.random,
): CharacterQuestion[] {
  const previousSignature = cycleSignature(previous);
  let next = selectQuestionCycle(pool, difficulty, random);

  for (
    let attempt = 0;
    attempt < 12 &&
    (cycleSignature(next) === previousSignature ||
      next[0]?.id === previous[0]?.id);
    attempt += 1
  ) {
    next = selectQuestionCycle(pool, difficulty, random);
  }

  if (next.length > 1 && next[0]?.id === previous[0]?.id) {
    const replacementIndex = next.findIndex(
      (question) => question.id !== previous[0]?.id,
    );
    if (replacementIndex > 0) {
      next = [
        ...next.slice(replacementIndex),
        ...next.slice(0, replacementIndex),
      ];
    }
  }

  return next;
}
