import type {
  CharacterId,
  CharacterQuestion,
  LocalizedText,
  QuestionType,
} from "../../types/game";

export type Pair = readonly [tr: string, en: string];

export const pair = (tr: string, en: string): LocalizedText => ({ tr, en });

export function q(
  id: string,
  characterId: CharacterId,
  type: Exclude<QuestionType, "ordering">,
  prompt: Pair,
  options: Pair[],
  correctIndex: number,
  explanation: Pair,
  category: string,
  difficulty: 1 | 2 | 3,
  sourceNote: string,
): CharacterQuestion {
  const answerOptions = options.map(([tr, en], index) => ({
    id: `${id}-${index}`,
    text: pair(tr, en),
  }));

  return {
    id,
    characterId,
    type,
    question: pair(...prompt),
    options: answerOptions,
    correctAnswer: answerOptions[correctIndex].id,
    explanation: pair(...explanation),
    category,
    difficulty,
    tone: "fact",
    sourceNote,
  };
}

export function orderQ(
  id: string,
  characterId: CharacterId,
  prompt: Pair,
  orderedOptions: Pair[],
  explanation: Pair,
  category: string,
  difficulty: 1 | 2 | 3,
  sourceNote: string,
): CharacterQuestion {
  const options = orderedOptions.map(([tr, en], index) => ({
    id: `${id}-${index}`,
    text: pair(tr, en),
  }));

  return {
    id,
    characterId,
    type: "ordering",
    question: pair(...prompt),
    options,
    correctAnswer: options.map((option) => option.id),
    explanation: pair(...explanation),
    category,
    difficulty,
    tone: "fact",
    sourceNote,
  };
}
