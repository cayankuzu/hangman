import { create } from "zustand";
import { questionsByCharacter } from "../data/questions";
import { isAnswerCorrect } from "../game/answerEvaluator";
import { buildRoundQuestions, shuffle } from "../game/questionSelector";
import {
  jokersForDifficulty,
  resolveMechanismAnswer,
  resolveQuestionLimit,
} from "../game/hangmanRules";
import type {
  CharacterId,
  CharacterQuestion,
  Difficulty,
  GameOutcome,
  GameMode,
  Language,
  RoundAnswer,
  Screen,
} from "../types/game";
import { playTone } from "../utils/sound";

const savedLanguage =
  typeof window === "undefined"
    ? "tr"
    : (localStorage.getItem("hangman-language") as Language | null) ?? "tr";
const savedSoundEnabled =
  typeof window === "undefined"
    ? true
    : localStorage.getItem("hangman-sound") !== "false";

interface GameState {
  screen: Screen;
  language: Language;
  soundEnabled: boolean;
  characterId: CharacterId | null;
  mode: GameMode | null;
  difficulty: Difficulty;
  outcome: GameOutcome;
  progress: number;
  questions: CharacterQuestion[];
  questionIndex: number;
  answers: RoundAnswer[];
  revealed: boolean;
  selectedAnswer: string | string[] | null;
  jokersLeft: number;
  eliminated: string[];
  setScreen: (screen: Screen) => void;
  setLanguage: (language: Language) => void;
  toggleSound: () => void;
  selectCharacter: (characterId: CharacterId) => void;
  setDifficulty: (difficulty: Difficulty) => void;
  startRound: (mode: GameMode) => void;
  submitAnswer: (answer: string | string[]) => void;
  advance: () => void;
  playJoker: () => void;
  retry: () => void;
  reset: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  screen: "menu",
  language: savedLanguage,
  soundEnabled: savedSoundEnabled,
  characterId: null,
  mode: null,
  difficulty: 2,
  outcome: null,
  progress: 0,
  questions: [],
  questionIndex: 0,
  answers: [],
  revealed: false,
  selectedAnswer: null,
  jokersLeft: 0,
  eliminated: [],

  setScreen: (screen) => set({ screen }),
  setLanguage: (language) => {
    localStorage.setItem("hangman-language", language);
    set({ language });
  },
  toggleSound: () =>
    set((state) => {
      const soundEnabled = !state.soundEnabled;
      localStorage.setItem("hangman-sound", String(soundEnabled));
      if (soundEnabled) playTone(true, "ui");
      return { soundEnabled };
    }),
  selectCharacter: (characterId) =>
    set({ characterId, mode: null, screen: "mode" }),
  setDifficulty: (difficulty) => set({ difficulty }),
  startRound: (mode) => {
    const { characterId, difficulty, soundEnabled, questions } = get();
    if (!characterId) return;
    const nextQuestions = buildRoundQuestions(
      questionsByCharacter[characterId],
      difficulty,
      questions,
    );
    playTone(soundEnabled, "transition");
    set({
      mode,
      outcome: null,
      progress: 0,
      questions: nextQuestions,
      questionIndex: 0,
      answers: [],
      revealed: false,
      selectedAnswer: null,
      jokersLeft: jokersForDifficulty(difficulty),
      eliminated: [],
      screen: "game",
    });
  },
  submitAnswer: (selectedAnswer) => {
    const state = get();
    if (state.revealed) return;
    const question = state.questions[state.questionIndex];
    if (!question) return;
    const correct = isAnswerCorrect(question, selectedAnswer);
    const mechanism = resolveMechanismAnswer(state.progress, correct);
    const outcome = resolveQuestionLimit(
      state.questionIndex,
      mechanism.progress,
      mechanism.outcome,
    );
    playTone(state.soundEnabled, correct ? "correct" : "wrong");
    set({
      progress: mechanism.progress,
      outcome,
      selectedAnswer,
      revealed: true,
      answers: [
        ...state.answers,
        {
          questionId: question.id,
          correct,
          selectedAnswer,
          progressBefore: state.progress,
          progressAfter: mechanism.progress,
        },
      ],
    });
  },
  advance: () => {
    const state = get();
    if (!state.revealed) return;
    if (state.outcome) {
      playTone(state.soundEnabled, "mechanism");
      set({ screen: "result" });
      return;
    }

    set({
      questionIndex: Math.min(
        state.questionIndex + 1,
        state.questions.length - 1,
      ),
      revealed: false,
      selectedAnswer: null,
      eliminated: [],
    });
  },
  playJoker: () => {
    const state = get();
    const question = state.questions[state.questionIndex];
    if (
      !question ||
      state.revealed ||
      state.jokersLeft <= 0 ||
      state.eliminated.length > 0 ||
      question.type === "ordering" ||
      question.options.length < 3
    ) {
      return;
    }
    const wrongIds = question.options
      .map((option) => option.id)
      .filter((id) => id !== question.correctAnswer);
    playTone(state.soundEnabled, "panel");
    set({
      jokersLeft: state.jokersLeft - 1,
      eliminated: shuffle(wrongIds).slice(0, question.options.length - 2),
    });
  },
  retry: () => {
    const { mode } = get();
    if (mode) get().startRound(mode);
  },
  reset: () =>
    set({
      screen: "menu",
      characterId: null,
      mode: null,
      outcome: null,
      progress: 0,
      questions: [],
      questionIndex: 0,
      answers: [],
      revealed: false,
      selectedAnswer: null,
      jokersLeft: 0,
      eliminated: [],
    }),
}));
