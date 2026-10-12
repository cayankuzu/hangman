import { AnimatePresence, motion } from "framer-motion";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { CharacterCard } from "./components/CharacterCard/CharacterCard";
import { ClassicHangman } from "./components/ClassicHangman/ClassicHangman";
import { GameHud } from "./components/GameHud/GameHud";
import { LanguageToggle } from "./components/LanguageToggle/LanguageToggle";
import { QuestionCard } from "./components/QuestionCard/QuestionCard";
import { characters, getCharacter } from "./data/characters";
import { sourceQuestionCount } from "./data/questions";
import { getCurrentStreak, getRoundStats } from "./game/hangmanRules";
import { copy } from "./i18n/copy";
import { useGameStore } from "./stores/gameStore";
import type { Difficulty, GameMode, Screen } from "./types/game";
import {
  playFinalSequence,
  type FinalSound,
} from "./utils/sound";

let sceneCanvasPromise:
  | Promise<{ default: typeof import("./components/SceneCanvas/SceneCanvas").SceneCanvas }>
  | undefined;
const loadSceneCanvas = () => {
  sceneCanvasPromise ??= import(
    "./components/SceneCanvas/SceneCanvas"
  ).then((module) => ({
    default: module.SceneCanvas,
  }));
  return sceneCanvasPromise;
};
const SceneCanvas = lazy(loadSceneCanvas);
const AvatarLab = lazy(() =>
  import("./scenes/AvatarLab").then((module) => ({
    default: module.AvatarLab,
  })),
);

function SceneFallback({ language }: { language: "tr" | "en" }) {
  return (
    <div className="sceneFallback" role="status">
      <span />
      {copy(language, "sceneLoading")}
    </div>
  );
}

function AppHeader({ onBack }: { onBack?: () => void }) {
  const language = useGameStore((state) => state.language);

  return (
    <header className="appHeader">
      <button
        className="miniBrand"
        type="button"
        onClick={() => useGameStore.getState().reset()}
        aria-label={copy(language, "mainMenu")}
      >
        {language === "tr" ? "A" : "H"}
      </button>
      {onBack ? (
        <button className="backButton" type="button" onClick={onBack}>
          <span aria-hidden="true">←</span>
          {copy(language, "back")}
        </button>
      ) : (
        <span />
      )}
      <LanguageToggle />
    </header>
  );
}

function AppFooter() {
  return (
    <footer className="appFooter">
      <small aria-label="Copyright © 2026 · MeMoDe tarafından">
        <span>Copyright © 2026</span>
        <span aria-hidden="true">·</span>
        <span>
          <strong>MeMoDe</strong> tarafından
        </span>
      </small>
    </footer>
  );
}

function MainMenu() {
  const language = useGameStore((state) => state.language);
  const setScreen = useGameStore((state) => state.setScreen);

  return (
    <main className="appShell menuShell">
      <div className="ambient ambientOne" />
      <div className="ambient ambientTwo" />
      <AppHeader />
      <motion.section
        className="hero"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65 }}
      >
        <h1>{copy(language, "title")}</h1>
        <p className="motto">{copy(language, "motto")}</p>
        <p className="intro">{copy(language, "intro")}</p>
        <div className="heroActions">
          <button
            className="primaryButton"
            type="button"
            onPointerEnter={() => void loadSceneCanvas()}
            onFocus={() => void loadSceneCanvas()}
            onClick={() => {
              void loadSceneCanvas();
              setScreen("characters");
            }}
          >
            {copy(language, "start")}
            <span aria-hidden="true">→</span>
          </button>
          <button
            className="quietButton"
            type="button"
            onClick={() => setScreen("about")}
          >
            {copy(language, "about")}
          </button>
        </div>
      </motion.section>
      <div className="stagePreview" aria-label={copy(language, "selectCharacter")}>
        <div className="heroCast">
          {characters.map((character, index) => (
            <figure
              key={character.id}
              style={
                {
                  "--cast-accent": character.accent,
                  "--cast-index": index,
                } as React.CSSProperties
              }
            >
              <img src={character.sceneAvatar} alt={character.name} />
              <figcaption>{character.name}</figcaption>
            </figure>
          ))}
        </div>
        <small>{copy(language, "stageSummary")}</small>
      </div>
    </main>
  );
}

function CharacterSelect() {
  const language = useGameStore((state) => state.language);
  const selectCharacter = useGameStore((state) => state.selectCharacter);
  const setScreen = useGameStore((state) => state.setScreen);
  const gridRef = useRef<HTMLElement>(null);
  const dragState = useRef({ active: false, moved: false, x: 0, left: 0 });

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const pointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      dragState.current = {
        active: true,
        moved: false,
        x: event.clientX,
        left: grid.scrollLeft,
      };
      grid.classList.add("isDragging");
    };
    const pointerMove = (event: PointerEvent) => {
      if (!dragState.current.active) return;
      const distance = event.clientX - dragState.current.x;
      if (Math.abs(distance) > 5) {
        dragState.current.moved = true;
        event.preventDefault();
      }
      grid.scrollLeft = dragState.current.left - distance;
    };
    const pointerUp = () => {
      dragState.current.active = false;
      grid.classList.remove("isDragging");
    };

    grid.addEventListener("pointerdown", pointerDown);
    window.addEventListener("pointermove", pointerMove, { passive: false });
    window.addEventListener("pointerup", pointerUp);
    window.addEventListener("pointercancel", pointerUp);
    return () => {
      grid.removeEventListener("pointerdown", pointerDown);
      window.removeEventListener("pointermove", pointerMove);
      window.removeEventListener("pointerup", pointerUp);
      window.removeEventListener("pointercancel", pointerUp);
    };
  }, []);

  return (
    <main className="screenShell characterSelectShell">
      <AppHeader onBack={() => setScreen("menu")} />
      <section className="screenIntro">
        <p className="eyebrow">01 · cast</p>
        <h1>{copy(language, "selectCharacter")}</h1>
        <span>{copy(language, "selectCharacterLead")}</span>
      </section>
      <section
        ref={gridRef}
        className="characterGrid"
        onWheel={(event) => {
          event.preventDefault();
          event.currentTarget.scrollLeft += event.deltaY + event.deltaX;
        }}
        onClickCapture={(event) => {
          if (!dragState.current.moved) return;
          event.preventDefault();
          event.stopPropagation();
          dragState.current.moved = false;
        }}
      >
        {characters.map((character) => (
          <CharacterCard
            key={character.id}
            character={character}
            language={language}
            onSelect={() => selectCharacter(character.id)}
          />
        ))}
      </section>
    </main>
  );
}

function ModeSelect() {
  const language = useGameStore((state) => state.language);
  const characterId = useGameStore((state) => state.characterId);
  const startRound = useGameStore((state) => state.startRound);
  const difficulty = useGameStore((state) => state.difficulty);
  const setDifficulty = useGameStore((state) => state.setDifficulty);
  const setScreen = useGameStore((state) => state.setScreen);
  const character = getCharacter(characterId);
  const hasImportedModel =
    character.id === "hitler" || character.id === "sheikh-said";
  const [activePreview, setActivePreview] = useState<GameMode | null>(null);

  const modeCards: {
    mode: GameMode;
    label: "execute" | "rescue" | "classic";
    lead: "executeLead" | "rescueLead" | "classicLead";
  }[] = [
    { mode: "classic", label: "classic", lead: "classicLead" },
    { mode: "execute", label: "execute", lead: "executeLead" },
    { mode: "rescue", label: "rescue", lead: "rescueLead" },
  ];

  return (
    <main className="screenShell modeShell">
      <AppHeader onBack={() => setScreen("characters")} />
      <section className="modeCharacter">
        <div
          className={`modePortrait${hasImportedModel ? " modePortrait3d" : ""}`}
          style={
            { "--character-accent": character.accent } as React.CSSProperties
          }
        >
          {hasImportedModel ? (
            <Suspense fallback={<SceneFallback language={language} />}>
              <SceneCanvas
                character={character}
                mode="rescue"
                correct={6}
                language={language}
                preview
                animationEnabled={false}
              />
            </Suspense>
          ) : (
            <img src={character.avatar} alt={character.name} />
          )}
        </div>
        <p>{character.kind[language]}</p>
        <h1>{character.name}</h1>
        <span>{copy(language, "selectMode")}</span>
      </section>
      <div className="modeControls">
        <section className="difficultyPicker" aria-label={copy(language, "selectDifficulty")}>
        <div>
          <p>{copy(language, "selectDifficulty")}</p>
          <span>{copy(language, "difficultyLead")}</span>
        </div>
        <div className="difficultyOptions">
          {([1, 2, 3] as Difficulty[]).map((level) => (
            <button
              key={level}
              type="button"
              className={difficulty === level ? "isActive" : ""}
              aria-pressed={difficulty === level}
              onClick={() => setDifficulty(level)}
            >
              <small>0{level}</small>
              {copy(
                language,
                level === 1 ? "easy" : level === 2 ? "medium" : "hard",
              )}
            </button>
          ))}
        </div>
        </section>
        <section className="modeGrid">
        {modeCards.map(({ mode, label, lead }, index) => (
          <motion.button
            key={mode}
            className={`modeCard mode-${mode}`}
            type="button"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            onClick={() => startRound(mode)}
            onMouseEnter={() => setActivePreview(mode)}
            onMouseLeave={() => setActivePreview(null)}
            onFocus={() => setActivePreview(mode)}
            onBlur={() => setActivePreview(null)}
          >
            <div className="modePreview3d" aria-hidden="true">
              <Suspense fallback={<SceneFallback language={language} />}>
                <SceneCanvas
                  character={character}
                  mode={mode === "rescue" ? "rescue" : "execute"}
                  correct={mode === "classic" ? 3 : 6}
                  language={language}
                  preview
                  animationEnabled={activePreview === mode}
                />
              </Suspense>
            </div>
            <small>0{index + 1}</small>
            <strong>{copy(language, label)}</strong>
            <span>{copy(language, lead)}</span>
            <b aria-hidden="true">↗</b>
          </motion.button>
        ))}
        </section>
      </div>
    </main>
  );
}

function GameScreen() {
  const language = useGameStore((state) => state.language);
  const characterId = useGameStore((state) => state.characterId);
  const mode = useGameStore((state) => state.mode);
  const questions = useGameStore((state) => state.questions);
  const questionIndex = useGameStore((state) => state.questionIndex);
  const answers = useGameStore((state) => state.answers);
  const difficulty = useGameStore((state) => state.difficulty);
  const outcome = useGameStore((state) => state.outcome);
  const progress = useGameStore((state) => state.progress);
  const revealed = useGameStore((state) => state.revealed);
  const selectedAnswer = useGameStore((state) => state.selectedAnswer);
  const jokersLeft = useGameStore((state) => state.jokersLeft);
  const eliminated = useGameStore((state) => state.eliminated);
  const submitAnswer = useGameStore((state) => state.submitAnswer);
  const advance = useGameStore((state) => state.advance);
  const playJoker = useGameStore((state) => state.playJoker);
  const setScreen = useGameStore((state) => state.setScreen);
  const character = getCharacter(characterId);
  const stats = getRoundStats(answers);
  const streak = getCurrentStreak(answers);
  const question = questions[questionIndex];
  const lastAnswer = answers[answers.length - 1]?.correct ?? null;

  if (mode === "classic") {
    return (
      <main className="gameShell classicGameShell">
        <AppHeader onBack={() => setScreen("mode")} />
        <ClassicHangman
          key={`${character.id}-${difficulty}-${language}`}
          character={character}
          difficulty={difficulty}
          language={language}
        />
      </main>
    );
  }

  if (!mode || !question) {
    return (
      <main className="screenShell emptyState">
        <p>{copy(language, "noGameData")}</p>
        <button type="button" onClick={() => setScreen("characters")}>
          {copy(language, "back")}
        </button>
      </main>
    );
  }

  const roundFinished = outcome !== null;
  const danger = progress === 0 && !roundFinished;

  return (
    <main className="gameShell stageGameShell">
      <AppHeader onBack={() => setScreen("mode")} />
      <GameHud
        character={character}
        mode={mode}
        difficulty={difficulty}
        language={language}
        progress={progress}
        streak={streak}
        accuracy={stats.accuracy}
        answered={stats.total}
      />

      <section className="gameLayout">
        <div className="stageColumn" data-danger={danger}>
          <Suspense fallback={<SceneFallback language={language} />}>
            <SceneCanvas
              character={character}
              mode={mode}
              correct={progress}
              language={language}
              feedbackNonce={answers.length}
              lastCorrect={lastAnswer}
            />
          </Suspense>
          {lastAnswer && streak >= 2 ? (
            <div
              key={answers.length}
              className={`streakBurst${streak >= 5 ? " isBlazing" : ""}`}
              aria-hidden="true"
            >
              <small>{copy(language, "streakLabel")}</small>
              <strong>×{streak}</strong>
            </div>
          ) : null}
        </div>
        <QuestionCard
          key={question.id}
          question={question}
          language={language}
          revealed={revealed}
          selectedAnswer={selectedAnswer}
          questionNumber={questionIndex + 1}
          roundFinished={roundFinished}
          jokersLeft={jokersLeft}
          eliminated={eliminated}
          onSubmit={submitAnswer}
          onAdvance={advance}
          onJoker={playJoker}
        />
      </section>
    </main>
  );
}

const RECORDS_KEY = "asmaca-records-v1";

function readRecords(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(RECORDS_KEY) ?? "{}") as Record<
      string,
      number
    >;
  } catch {
    return {};
  }
}

function readBestStreak(key: string) {
  return readRecords()[key] ?? 0;
}

function writeBestStreak(key: string, streak: number) {
  try {
    const records = readRecords();
    if (streak <= (records[key] ?? 0)) return;
    records[key] = streak;
    localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
  } catch {
    // Depolama kapalıysa rekor yalnızca bu oturumda görünür.
  }
}

function ResultScreen() {
  const language = useGameStore((state) => state.language);
  const characterId = useGameStore((state) => state.characterId);
  const mode = useGameStore((state) => state.mode);
  const answers = useGameStore((state) => state.answers);
  const difficulty = useGameStore((state) => state.difficulty);
  const outcome = useGameStore((state) => state.outcome);
  const progress = useGameStore((state) => state.progress);
  const retry = useGameStore((state) => state.retry);
  const setScreen = useGameStore((state) => state.setScreen);
  const reset = useGameStore((state) => state.reset);
  const soundEnabled = useGameStore((state) => state.soundEnabled);
  const character = getCharacter(characterId);
  const stats = getRoundStats(answers);
  const success = outcome === "won";
  const recordKey = `${character.id}-${mode}-${difficulty}`;
  const [previousBest] = useState(() => readBestStreak(recordKey));
  const isRecord = stats.bestStreak > previousBest && stats.bestStreak >= 2;
  const grade =
    stats.total > 0 && stats.accuracy === 100
      ? "gradePerfect"
      : stats.accuracy >= 80
        ? "gradeSharp"
        : stats.accuracy >= 60
          ? "gradeSteady"
          : "gradeHard";

  useEffect(() => {
    if (!mode || mode === "classic") return;
    writeBestStreak(recordKey, stats.bestStreak);
  }, [mode, recordKey, stats.bestStreak]);

  useEffect(() => {
    if (!mode || mode === "classic" || !outcome) return;
    const finalSound: FinalSound =
      (mode === "execute" && success) || (mode === "rescue" && !success)
        ? "hanged"
        : mode === "rescue" && success
          ? "rescued"
          : "stalled";
    return playFinalSequence(soundEnabled, finalSound);
  }, [mode, outcome, soundEnabled, success]);

  if (!mode || mode === "classic") return null;

  const hanged =
    (mode === "execute" && success) || (mode === "rescue" && !success);
  const rescued = mode === "rescue" && success;
  const visualMode = hanged ? "execute" : mode;
  const visualStep = hanged || rescued ? 6 : progress;
  const finalState = hanged ? "hanged" : rescued ? "rescued" : "stalled";
  const resultKey =
    mode === "execute"
      ? success
        ? "executeSuccess"
        : "executeFailure"
      : success
        ? "rescueSuccess"
        : "rescueFailure";

  return (
    <main className="resultShell">
      <AppHeader />
      <section className="resultStage">
        <Suspense fallback={<SceneFallback language={language} />}>
          <SceneCanvas
            character={character}
            mode={visualMode}
            correct={visualStep}
            language={language}
            finalState={finalState}
          />
        </Suspense>
      </section>
      <motion.section
        className={`resultPanel result-${finalState}`}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="eyebrow">{copy(language, "result")}</p>
        <h1>{copy(language, resultKey)}</h1>
        <div className="resultVerdict">
          <span>{copy(language, grade)}</span>
          {isRecord ? (
            <span className="isRecord">{copy(language, "newRecord")}</span>
          ) : previousBest > 0 ? (
            <span>
              {copy(language, "recordStreak")} · {previousBest}
            </span>
          ) : null}
        </div>
        <div className="resultIdentity">
          <img src={character.avatar} alt="" />
          <div>
            <strong>{character.name}</strong>
            <span>{copy(language, mode === "execute" ? "execute" : "rescue")}</span>
          </div>
        </div>
        <div className="resultCounts resultStats">
          <span>
            {copy(language, "correct")} <b>{stats.correct}</b>
          </span>
          <span>
            {copy(language, "wrong")} <b>{stats.wrong}</b>
          </span>
          <span>
            {copy(language, "answered")} <b>{stats.total}</b>
          </span>
          <span>
            {copy(language, "accuracy")} <b>%{stats.accuracy}</b>
          </span>
          <span>
            {copy(language, "bestStreak")} <b>{stats.bestStreak}</b>
          </span>
          <span>
            {copy(language, "difficulty")}{" "}
            <b className="difficultyStat">
              {copy(
                language,
                difficulty === 1 ? "easy" : difficulty === 2 ? "medium" : "hard",
              )}
            </b>
          </span>
        </div>
        <div className="resultActions">
          <button className="primaryButton" type="button" onClick={retry}>
            {copy(language, "retry")}
          </button>
          <button type="button" onClick={() => setScreen("mode")}>
            {copy(language, "changeMode")}
          </button>
          <button type="button" onClick={() => setScreen("characters")}>
            {copy(language, "anotherCharacter")}
          </button>
          <button type="button" onClick={reset}>
            {copy(language, "mainMenu")}
          </button>
        </div>
      </motion.section>
    </main>
  );
}

function AboutScreen() {
  const language = useGameStore((state) => state.language);
  const setScreen = useGameStore((state) => state.setScreen);

  return (
    <main className="aboutShell">
      <AppHeader onBack={() => setScreen("menu")} />
      <section>
        <p className="eyebrow">Manifesto · 01</p>
        <h1>{copy(language, "aboutTitle")}</h1>
        <p>{copy(language, "aboutBody")}</p>
        <div className="aboutRules">
          <article>
            <b>{sourceQuestionCount}</b>
            <span>{copy(language, "aboutRandom")}</span>
          </article>
          <article>
            <b>06</b>
            <span>{copy(language, "aboutDecision")}</span>
          </article>
          <article>
            <b>03</b>
            <span>{copy(language, "aboutDirections")}</span>
          </article>
        </div>
      </section>
    </main>
  );
}

const screenComponents: Record<Screen, () => React.ReactNode> = {
  menu: MainMenu,
  characters: CharacterSelect,
  mode: ModeSelect,
  game: GameScreen,
  result: ResultScreen,
  about: AboutScreen,
};

export function App() {
  const screen = useGameStore((state) => state.screen);
  const language = useGameStore((state) => state.language);
  const ActiveScreen = screenComponents[screen];

  useEffect(() => {
    document.documentElement.lang = language;
    document.title = language === "tr" ? "Asmaca" : "Hangman";
  }, [language]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [screen]);

  if (window.location.pathname === "/avatar-lab") {
    return (
      <>
        <Suspense fallback={<SceneFallback language={language} />}>
          <AvatarLab />
        </Suspense>
        <AppFooter />
      </>
    );
  }

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={screen}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <ActiveScreen />
        </motion.div>
      </AnimatePresence>
      <AppFooter />
    </>
  );
}
