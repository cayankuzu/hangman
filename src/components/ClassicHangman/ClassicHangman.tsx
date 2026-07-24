import { motion } from "framer-motion";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { questionsByCharacter } from "../../data/questions";
import { shuffle } from "../../game/questionSelector";
import { copy } from "../../i18n/copy";
import { useGameStore } from "../../stores/gameStore";
import type {
  CharacterProfile,
  Difficulty,
  Language,
} from "../../types/game";
import { playFinalSequence, playTone } from "../../utils/sound";
import { parseSourceNote } from "../../utils/sourceLink";

const SceneCanvas = lazy(() =>
  import("../SceneCanvas/SceneCanvas").then((module) => ({
    default: module.SceneCanvas,
  })),
);

const TURKISH_KEYS = [
  "A",
  "B",
  "C",
  "Ç",
  "D",
  "E",
  "F",
  "G",
  "Ğ",
  "H",
  "I",
  "İ",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "Ö",
  "P",
  "R",
  "S",
  "Ş",
  "T",
  "U",
  "Ü",
  "V",
  "Y",
  "Z",
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
] as const;

const GENERIC_BINARY_ANSWERS = new Set([
  "DOĞRU",
  "YANLIŞ",
  "TRUE",
  "FALSE",
  "EVET",
  "HAYIR",
  "YES",
  "NO",
]);

interface Puzzle {
  id: string;
  clue: string;
  answer: string;
  source: string;
}

function normalize(value: string, language: Language) {
  return value.toLocaleUpperCase(language === "tr" ? "tr-TR" : "en-US");
}

function isGuessable(value: string) {
  return /[\p{L}\p{N}]/u.test(value);
}

function createPuzzles(
  characterId: CharacterProfile["id"],
  difficulty: Difficulty,
  language: Language,
): Puzzle[] {
  const unique = new Map<string, Puzzle>();
  for (const question of questionsByCharacter[characterId]) {
    if (
      question.difficulty !== difficulty ||
      question.tone !== "fact" ||
      question.type === "ordering" ||
      Array.isArray(question.correctAnswer)
    ) {
      continue;
    }

    const option = question.options.find(
      (candidate) => candidate.id === question.correctAnswer,
    );
    if (!option) continue;
    const answer = option.text[language].trim();
    const guessableLength = Array.from(answer).filter(isGuessable).length;
    if (guessableLength < 2 || guessableLength > 24) continue;

    const normalizedAnswer = normalize(answer, language);
    if (GENERIC_BINARY_ANSWERS.has(normalizedAnswer)) continue;
    if (!unique.has(normalizedAnswer)) {
      unique.set(normalizedAnswer, {
        id: question.id,
        clue: question.question[language],
        answer,
        source: question.sourceNote,
      });
    }
  }
  return [...unique.values()];
}

function pickPuzzle(puzzles: readonly Puzzle[], previousId?: string) {
  const candidates = puzzles.filter((puzzle) => puzzle.id !== previousId);
  return shuffle(candidates.length > 0 ? candidates : puzzles)[0];
}

export function ClassicHangman({
  character,
  difficulty,
  language,
}: {
  character: CharacterProfile;
  difficulty: Difficulty;
  language: Language;
}) {
  const soundEnabled = useGameStore((state) => state.soundEnabled);
  const puzzles = useMemo(
    () => createPuzzles(character.id, difficulty, language),
    [character.id, difficulty, language],
  );
  const [puzzle, setPuzzle] = useState(() => pickPuzzle(puzzles));
  const [guessed, setGuessed] = useState<string[]>([]);
  const [wrongCount, setWrongCount] = useState(0);
  const [feedbackNonce, setFeedbackNonce] = useState(0);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);

  const normalizedAnswer = normalize(puzzle?.answer ?? "", language);
  const answerCharacters = Array.from(normalizedAnswer);
  const answerLetters = new Set(answerCharacters.filter(isGuessable));
  const won =
    answerLetters.size > 0 &&
    [...answerLetters].every((letter) => guessed.includes(letter));
  const lost = wrongCount >= 6;
  const finished = won || lost;

  useEffect(() => {
    if (!finished) return;
    return playFinalSequence(soundEnabled, won ? "rescued" : "hanged");
  }, [finished, soundEnabled, won]);

  const guess = (rawLetter: string) => {
    if (finished) return;
    const letter = normalize(rawLetter, language);
    if (!TURKISH_KEYS.includes(letter as (typeof TURKISH_KEYS)[number])) return;
    if (guessed.includes(letter)) return;

    const correct = normalizedAnswer.includes(letter);
    setGuessed((current) => [...current, letter]);
    setLastCorrect(correct);
    setFeedbackNonce((current) => current + 1);
    if (!correct) setWrongCount((current) => Math.min(current + 1, 6));
    playTone(soundEnabled, correct ? "correct" : "wrong");
  };

  const nextPuzzle = () => {
    setPuzzle((current) => pickPuzzle(puzzles, current?.id));
    setGuessed([]);
    setWrongCount(0);
    setFeedbackNonce(0);
    setLastCorrect(null);
  };

  if (!puzzle) {
    return <p className="classicEmpty">{copy(language, "noGameData")}</p>;
  }

  const stageMode = won ? "rescue" : "execute";
  const stageStep = won || lost ? 6 : wrongCount;
  const source = parseSourceNote(puzzle.source);

  return (
    <section
      className="classicLayout"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.ctrlKey || event.metaKey || event.altKey) return;
        guess(event.key);
      }}
    >
      <div className="classicStage">
        <Suspense fallback={<div className="sceneFallback" />}>
          <SceneCanvas
            character={character}
            mode={stageMode}
            correct={stageStep}
            language={language}
            feedbackNonce={feedbackNonce}
            lastCorrect={lastCorrect}
            finalState={
              finished ? (won ? "rescued" : "hanged") : undefined
            }
          />
        </Suspense>
      </div>
      <motion.section
        className={`classicPanel ${finished ? "isFinished" : ""}`}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="classicHeading">
          <div>
            <small>{language === "tr" ? "Klasik adam asmaca" : "Classic hangman"}</small>
            <strong>{character.name}</strong>
          </div>
          <span>{wrongCount}/6</span>
        </div>

        <p className="classicClue">{puzzle.clue}</p>
        <div className="classicWord" aria-label={puzzle.answer}>
          {answerCharacters.map((characterLetter, index) => (
            <span
              key={`${characterLetter}-${index}`}
              className={isGuessable(characterLetter) ? "" : "isSeparator"}
            >
              {!isGuessable(characterLetter) ||
              guessed.includes(characterLetter) ||
              finished
                ? characterLetter
                : "•"}
            </span>
          ))}
        </div>

        <div className="classicKeyboard" aria-label={language === "tr" ? "Harf klavyesi" : "Letter keyboard"}>
          {TURKISH_KEYS.map((letter) => {
            const used = guessed.includes(letter);
            const correct = used && normalizedAnswer.includes(letter);
            return (
              <button
                key={letter}
                type="button"
                disabled={used || finished}
                className={used ? (correct ? "isCorrect" : "isWrong") : ""}
                onClick={() => guess(letter)}
              >
                {letter}
              </button>
            );
          })}
        </div>

        {finished ? (
          <div className={`classicResult ${won ? "isWon" : "isLost"}`} role="status">
            <small>{won ? (language === "tr" ? "Kurtarıldı" : "Rescued") : language === "tr" ? "Asıldı" : "Hanged"}</small>
            <strong>
              {won
                ? language === "tr"
                  ? "Kelime çözüldü."
                  : "The word was solved."
                : language === "tr"
                  ? "Altı yanlış harf mekanizmayı tamamladı."
                  : "Six wrong letters completed the mechanism."}
            </strong>
            <p>{puzzle.answer}</p>
            {source.url ? (
              <a
                className="sourceLink"
                href={source.url}
                target="_blank"
                rel="noreferrer"
              >
                <span>{language === "tr" ? "Kaynağı aç" : "Open source"}</span>
                <b>{source.label}</b>
                <em aria-hidden="true">↗</em>
              </a>
            ) : null}
            <button type="button" onClick={nextPuzzle}>
              {language === "tr" ? "Yeni kelime" : "New word"}
            </button>
          </div>
        ) : null}
      </motion.section>
    </section>
  );
}
