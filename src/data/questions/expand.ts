import type {
  CharacterQuestion,
  Difficulty,
  LocalizedText,
  QuestionTone,
} from "../../types/game";

const FACTS_PER_DIFFICULTY = 33;
const SATIRE_PER_DIFFICULTY = 66;

function cleanPunctuation(value: string) {
  return value
    .replace(/\s*:\s*/g, ". ")
    .replace(/\s+/g, " ")
    .trim();
}

function localizedPrompt(
  question: CharacterQuestion,
): LocalizedText {
  return {
    tr: cleanPunctuation(question.question.tr),
    en: cleanPunctuation(question.question.en),
  };
}

function buildTonePool(
  source: readonly CharacterQuestion[],
  difficulty: Difficulty,
  tone: QuestionTone,
  count: number,
): CharacterQuestion[] {
  return Array.from({ length: count }, (_, index) => {
    const original = source[index % source.length];
    const variantIndex = Math.floor(index / source.length);
    const variantId = `${original.id}-d${difficulty}-${tone}-v${variantIndex + 1}`;

    return {
      ...original,
      id: variantId,
      tone,
      question: localizedPrompt(original),
      options: original.options.map((option) => ({
        ...option,
        id: `${variantId}-${option.id}`,
      })),
      correctAnswer: Array.isArray(original.correctAnswer)
        ? original.correctAnswer.map((answer) => `${variantId}-${answer}`)
        : `${variantId}-${original.correctAnswer}`,
      difficulty,
    };
  });
}

function buildDifficultyPool(
  baseQuestions: readonly CharacterQuestion[],
  difficulty: Difficulty,
): CharacterQuestion[] {
  const source = baseQuestions.filter(
    (question) => question.difficulty === difficulty,
  );
  if (source.length === 0) {
    throw new Error(`Difficulty ${difficulty} has no source questions.`);
  }

  return [
    ...buildTonePool(source, difficulty, "fact", FACTS_PER_DIFFICULTY),
    ...buildTonePool(source, difficulty, "satire", SATIRE_PER_DIFFICULTY),
  ];
}

export function expandQuestionBank(
  baseQuestions: readonly CharacterQuestion[],
): CharacterQuestion[] {
  return ([1, 2, 3] as const).flatMap((difficulty) =>
    buildDifficultyPool(baseQuestions, difficulty),
  );
}
