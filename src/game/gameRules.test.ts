import { describe, expect, it } from "vitest";
import { questionsByCharacter } from "../data/questions";
import { isAnswerCorrect } from "./answerEvaluator";
import {
  selectFreshQuestionCycle,
  selectQuestionCycle,
  shuffleQuestionOptions,
} from "./questionSelector";
import {
  resolveMechanismAnswer,
  resolveQuestionLimit,
} from "./hangmanRules";

describe("question data", () => {
  it("contains 99 complete questions per difficulty for every character", () => {
    for (const pool of Object.values(questionsByCharacter)) {
      expect(pool).toHaveLength(297);
      expect(new Set(pool.map((question) => question.id)).size).toBe(297);

      for (const difficulty of [1, 2, 3] as const) {
        const difficultyPool = pool.filter(
          (question) => question.difficulty === difficulty,
        );
        expect(difficultyPool).toHaveLength(99);
        expect(
          difficultyPool.filter((question) => question.tone === "fact"),
        ).toHaveLength(33);
        expect(
          difficultyPool.filter((question) => question.tone === "satire"),
        ).toHaveLength(66);
      }

      for (const question of pool) {
        expect(question.question.tr.length).toBeGreaterThan(4);
        expect(question.question.en.length).toBeGreaterThan(4);
        expect(question.question.tr).not.toContain(":");
        expect(question.question.en).not.toContain(":");
        expect(question.explanation.tr.length).toBeGreaterThan(4);
        expect(question.explanation.en.length).toBeGreaterThan(4);
        expect(question.options.length).toBeGreaterThanOrEqual(2);
        expect(
          question.options.every(
            (option) =>
              !/PR mas|Komplo grubu|Kahvehane jürisi/i.test(option.text.tr) &&
              !/PR desk|Conspiracy group|Coffeehouse jury/i.test(option.text.en),
          ),
        ).toBe(true);
        expect(question.sourceNote).toMatch(/^.+https?:\/\//);
      }
    }
  });

  it("builds a randomized 99-question cycle for the selected difficulty", () => {
    for (const pool of Object.values(questionsByCharacter)) {
      const selected = selectQuestionCycle(pool, 2, () => 0.42);
      expect(selected).toHaveLength(99);
      expect(new Set(selected.map((question) => question.id)).size).toBe(99);
      expect(selected.every((question) => question.difficulty === 2)).toBe(true);

      for (const question of selected) {
        const optionIds = new Set(question.options.map((option) => option.id));
        const answers = Array.isArray(question.correctAnswer)
          ? question.correctAnswer
          : [question.correctAnswer];
        expect(answers.every((answer) => optionIds.has(answer))).toBe(true);
        expect(isAnswerCorrect(question, question.correctAnswer)).toBe(true);
      }
    }
  });

  it("can move a correct answer to different option positions", () => {
    const question = questionsByCharacter.einstein.find(
      (item) => !Array.isArray(item.correctAnswer) && item.options.length > 2,
    );
    expect(question).toBeDefined();
    if (!question || Array.isArray(question.correctAnswer)) return;

    const first = shuffleQuestionOptions(question, () => 0);
    const second = shuffleQuestionOptions(question, () => 0.999);
    const firstPosition = first.options.findIndex(
      (option) => option.id === first.correctAnswer,
    );
    const secondPosition = second.options.findIndex(
      (option) => option.id === second.correctAnswer,
    );
    expect(firstPosition).not.toBe(secondPosition);
  });

  it("does not repeat the opening question on a fresh round", () => {
    const pool = questionsByCharacter.hawking;
    const first = selectQuestionCycle(pool, 2, () => 0.42);
    const second = selectFreshQuestionCycle(pool, 2, first, () => 0.42);
    expect(second).toHaveLength(99);
    expect(second[0].id).not.toBe(first[0].id);
  });
});

describe("mechanism rules", () => {
  it("moves one step forward for a correct answer", () => {
    expect(resolveMechanismAnswer(2, true)).toEqual({
      progress: 3,
      outcome: null,
    });
  });

  it("moves one step backward for a wrong answer", () => {
    expect(resolveMechanismAnswer(2, false)).toEqual({
      progress: 1,
      outcome: null,
    });
  });

  it("wins at step six", () => {
    expect(resolveMechanismAnswer(5, true)).toEqual({
      progress: 6,
      outcome: "won",
    });
  });

  it("loses only when answering wrong at step zero", () => {
    expect(resolveMechanismAnswer(0, false)).toEqual({
      progress: 0,
      outcome: "lost",
    });
  });

  it("closes the round at question 99 using the current mechanism position", () => {
    expect(resolveQuestionLimit(98, 4, null)).toBe("won");
    expect(resolveQuestionLimit(98, 2, null)).toBe("lost");
    expect(resolveQuestionLimit(97, 4, null)).toBeNull();
    expect(resolveQuestionLimit(98, 0, "lost")).toBe("lost");
  });
});
