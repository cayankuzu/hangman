import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { copy } from "../../i18n/copy";
import type { CharacterQuestion, Language } from "../../types/game";
import { parseSourceNote } from "../../utils/sourceLink";

const LETTERS = "abcdefgh";

function isTypingTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  );
}

export function QuestionCard({
  question,
  language,
  revealed,
  selectedAnswer,
  questionNumber,
  roundFinished,
  jokersLeft,
  eliminated,
  onSubmit,
  onAdvance,
  onJoker,
}: {
  question: CharacterQuestion;
  language: Language;
  revealed: boolean;
  selectedAnswer: string | string[] | null;
  questionNumber: number;
  roundFinished: boolean;
  jokersLeft: number;
  eliminated: readonly string[];
  onSubmit: (answer: string | string[]) => void;
  onAdvance: () => void;
  onJoker: () => void;
}) {
  const [order, setOrder] = useState<string[]>([]);
  const nextRef = useRef<HTMLButtonElement>(null);

  const correctIds = Array.isArray(question.correctAnswer)
    ? question.correctAnswer
    : [question.correctAnswer];
  const wasCorrect =
    revealed &&
    selectedAnswer !== null &&
    (Array.isArray(question.correctAnswer)
      ? Array.isArray(selectedAnswer) &&
        selectedAnswer.length === question.correctAnswer.length &&
        selectedAnswer.every(
          (value, index) => value === question.correctAnswer[index],
        )
      : selectedAnswer === question.correctAnswer);
  const source = parseSourceNote(question.sourceNote);
  const isOrdering = question.type === "ordering";
  const jokerApplies = !isOrdering && question.options.length > 2;
  const jokerAvailable =
    jokerApplies && jokersLeft > 0 && eliminated.length === 0 && !revealed;
  const keyRange = `A–${LETTERS[question.options.length - 1].toUpperCase()}`;

  const chooseOrderItem = (id: string) => {
    if (revealed || order.includes(id)) return;
    const nextOrder = [...order, id];
    setOrder(nextOrder);
    if (nextOrder.length === question.options.length) onSubmit(nextOrder);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;
      const key = event.key.toLowerCase();

      if (revealed) {
        if (key === "enter" || key === " " || key === "arrowright") {
          // Odak bir düğmedeyse tarayıcı zaten tıklatır; çift ilerlemeyi önle.
          if (
            event.target instanceof HTMLElement &&
            event.target.closest("button, a")
          ) {
            return;
          }
          event.preventDefault();
          onAdvance();
        }
        return;
      }

      if (key === "j") {
        event.preventDefault();
        onJoker();
        return;
      }

      const byLetter = LETTERS.indexOf(key);
      const byNumber = /^[1-8]$/.test(key) ? Number(key) - 1 : -1;
      const option = question.options[byLetter >= 0 ? byLetter : byNumber];
      if (!option) return;
      event.preventDefault();

      if (isOrdering) {
        if (order.includes(option.id)) return;
        const nextOrder = [...order, option.id];
        setOrder(nextOrder);
        if (nextOrder.length === question.options.length) onSubmit(nextOrder);
        return;
      }
      if (eliminated.includes(option.id)) return;
      onSubmit(option.id);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    eliminated,
    isOrdering,
    onAdvance,
    onJoker,
    onSubmit,
    order,
    question.options,
    revealed,
  ]);

  return (
    <AnimatePresence mode="wait">
      <motion.section
        key={question.id}
        className={`questionCard ${revealed ? (wasCorrect ? "answerCorrect" : "answerWrong") : ""}`}
        data-answer-state={
          revealed ? (wasCorrect ? "correct" : "wrong") : "waiting"
        }
        data-question-id={question.id}
        initial={{ opacity: 0, x: 18 }}
        animate={
          revealed && !wasCorrect
            ? { opacity: 1, x: [0, -7, 6, -4, 2, 0] }
            : { opacity: 1, x: 0 }
        }
        exit={{ opacity: 0, x: -14 }}
        transition={{ duration: revealed && !wasCorrect ? 0.42 : 0.24 }}
      >
        <div className="questionHeading">
          <p>
            {copy(language, "question")}{" "}
            <b>{String(questionNumber).padStart(2, "0")}</b>
          </p>
          {jokerApplies ? (
            <button
              type="button"
              className="jokerButton"
              disabled={!jokerAvailable}
              onClick={onJoker}
              title={copy(language, "jokerHint")}
              aria-keyshortcuts="J"
            >
              <span aria-hidden="true">½</span>
              {copy(language, "joker")}
              <em aria-label={`${jokersLeft}`}>×{jokersLeft}</em>
            </button>
          ) : null}
        </div>
        <h2>{question.question[language]}</h2>

        {isOrdering ? (
          <>
            <p className="orderInstruction">{copy(language, "orderInstruction")}</p>
            <div className="answerList orderingList">
              {question.options.map((option) => {
                const selectedIndex = order.indexOf(option.id);
                const isCorrect = revealed && correctIds[selectedIndex] === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    disabled={revealed || selectedIndex >= 0}
                    className={[
                      selectedIndex >= 0 ? "isSelected" : "",
                      revealed ? (isCorrect ? "isCorrect" : "isWrong") : "",
                    ].join(" ")}
                    onClick={() => chooseOrderItem(option.id)}
                  >
                    <b>{selectedIndex >= 0 ? selectedIndex + 1 : "·"}</b>
                    <span>{option.text[language]}</span>
                  </button>
                );
              })}
            </div>
            {!revealed && order.length > 0 ? (
              <button className="resetOrder" type="button" onClick={() => setOrder([])}>
                {copy(language, "resetOrder")}
              </button>
            ) : null}
          </>
        ) : (
          <div className="answerList">
            {question.options.map((option, index) => {
              const isSelected = selectedAnswer === option.id;
              const isCorrect = correctIds.includes(option.id);
              const isEliminated = !revealed && eliminated.includes(option.id);
              return (
                <button
                  key={option.id}
                  type="button"
                  disabled={revealed || isEliminated}
                  aria-keyshortcuts={LETTERS[index].toUpperCase()}
                  className={[
                    isSelected ? "isSelected" : "",
                    isEliminated ? "isEliminated" : "",
                    revealed && isCorrect ? "isCorrect" : "",
                    revealed && isSelected && !isCorrect ? "isWrong" : "",
                    revealed && !isSelected && !isCorrect ? "isDimmed" : "",
                  ].join(" ")}
                  onClick={() => onSubmit(option.id)}
                >
                  <b>{LETTERS[index].toUpperCase()}</b>
                  <span>{option.text[language]}</span>
                  {revealed && isCorrect ? <em aria-hidden="true">✓</em> : null}
                </button>
              );
            })}
          </div>
        )}

        <AnimatePresence>
          {revealed ? (
            <motion.div
              className="answerExplanation"
              data-result={wasCorrect ? "correct" : "wrong"}
              role="status"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              onAnimationComplete={() =>
                nextRef.current?.scrollIntoView({
                  block: "nearest",
                  behavior: "smooth",
                })
              }
            >
              <strong>
                <span aria-hidden="true">{wasCorrect ? "✓" : "×"}</span>
                {copy(language, wasCorrect ? "correct" : "wrong")}
              </strong>
              {source.url ? (
                <a
                  className="sourceLink"
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span>{copy(language, "source")}</span>
                  <b>{source.label}</b>
                  <em aria-hidden="true">↗</em>
                </a>
              ) : null}
              <button
                ref={nextRef}
                className="nextButton"
                type="button"
                onClick={onAdvance}
              >
                {copy(language, roundFinished ? "seeResult" : "next")}
                <span aria-hidden="true">
                  <kbd>Enter</kbd>→
                </span>
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {!revealed ? (
          <p className="keyHint" aria-hidden="true">
            <span>
              <kbd>{keyRange}</kbd> {copy(language, "keyAnswer")}
            </span>
            {jokerApplies ? (
              <span>
                <kbd>J</kbd> {copy(language, "keyJoker")}
              </span>
            ) : null}
          </p>
        ) : null}
      </motion.section>
    </AnimatePresence>
  );
}
