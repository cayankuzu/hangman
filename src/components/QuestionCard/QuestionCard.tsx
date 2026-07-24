import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { copy } from "../../i18n/copy";
import type { CharacterQuestion, Language } from "../../types/game";

const categoryLabels: Record<string, { tr: string; en: string }> = {
  life: { tr: "Yaşam", en: "Life" },
  chronology: { tr: "Kronoloji", en: "Chronology" },
  education: { tr: "Eğitim", en: "Education" },
  career: { tr: "Kariyer", en: "Career" },
  science: { tr: "Bilim", en: "Science" },
  awards: { tr: "Ödüller", en: "Awards" },
  misconceptions: { tr: "Yanlış bilinenler", en: "Misconceptions" },
  history: { tr: "Tarih", en: "History" },
  culture: { tr: "Kültür", en: "Culture" },
  cosmology: { tr: "Kozmoloji", en: "Cosmology" },
  works: { tr: "Eserler", en: "Works" },
  politics: { tr: "Siyaset", en: "Politics" },
  law: { tr: "Hukuk", en: "Law" },
  media: { tr: "Medya", en: "Media" },
  character: { tr: "Karakter", en: "Character" },
  family: { tr: "Aile", en: "Family" },
  "legal-history": { tr: "Hukuk tarihi", en: "Legal history" },
  "legal-literacy": { tr: "Hukuk okuryazarlığı", en: "Legal literacy" },
  historiography: { tr: "Tarih yazımı", en: "Historiography" },
  government: { tr: "Yönetim", en: "Government" },
  events: { tr: "Olaylar", en: "Events" },
  institutions: { tr: "Kurumlar", en: "Institutions" },
  technology: { tr: "Teknoloji", en: "Technology" },
};

export function QuestionCard({
  question,
  language,
  revealed,
  selectedAnswer,
  questionNumber,
  questionTotal,
  roundFinished,
  onSubmit,
  onAdvance,
}: {
  question: CharacterQuestion;
  language: Language;
  revealed: boolean;
  selectedAnswer: string | string[] | null;
  questionNumber: number;
  questionTotal: number;
  roundFinished: boolean;
  onSubmit: (answer: string | string[]) => void;
  onAdvance: () => void;
}) {
  const [order, setOrder] = useState<string[]>([]);

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
  const category =
    categoryLabels[question.category]?.[language] ?? question.category;

  const chooseOrderItem = (id: string) => {
    if (revealed || order.includes(id)) return;
    const nextOrder = [...order, id];
    setOrder(nextOrder);
    if (nextOrder.length === question.options.length) onSubmit(nextOrder);
  };

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
            {copy(language, "question")} {questionNumber}/{questionTotal}
          </p>
          <div>
            <span className={`toneBadge tone-${question.tone}`}>
              {question.tone === "fact"
                ? language === "tr"
                  ? "Salt bilgi"
                  : "Fact"
                : language === "tr"
                  ? "Kara mizah"
                  : "Dark satire"}
            </span>
            <span>{category}</span>
          </div>
        </div>
        <h2>{question.question[language]}</h2>

        {question.type === "ordering" ? (
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
              return (
                <button
                  key={option.id}
                  type="button"
                  disabled={revealed}
                  className={[
                    isSelected ? "isSelected" : "",
                    revealed && isCorrect ? "isCorrect" : "",
                    revealed && isSelected && !isCorrect ? "isWrong" : "",
                  ].join(" ")}
                  onClick={() => onSubmit(option.id)}
                >
                  <b>{String.fromCharCode(65 + index)}</b>
                  <span>{option.text[language]}</span>
                  {revealed && isCorrect ? <em>✓</em> : null}
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
            >
              <strong>
                <span aria-hidden="true">{wasCorrect ? "✓" : "×"}</span>
                {copy(language, wasCorrect ? "correct" : "wrong")}
              </strong>
              <p>{question.explanation[language]}</p>
              <small>{question.sourceNote}</small>
              <button className="nextButton" type="button" onClick={onAdvance}>
                {copy(language, roundFinished ? "seeResult" : "next")}
                <span aria-hidden="true">→</span>
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.section>
    </AnimatePresence>
  );
}
