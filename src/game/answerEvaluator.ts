import type { CharacterQuestion } from "../types/game";

export function isAnswerCorrect(
  question: CharacterQuestion,
  answer: string | string[],
): boolean {
  if (Array.isArray(question.correctAnswer)) {
    return (
      Array.isArray(answer) &&
      answer.length === question.correctAnswer.length &&
      answer.every((value, index) => value === question.correctAnswer[index])
    );
  }

  return typeof answer === "string" && answer === question.correctAnswer;
}
