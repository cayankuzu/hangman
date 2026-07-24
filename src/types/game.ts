export type Language = "tr" | "en";
export type StageMode = "execute" | "rescue";
export type GameMode = StageMode | "classic";
export type Difficulty = 1 | 2 | 3;
export type QuestionTone = "fact" | "satire";
export type GameOutcome = "won" | "lost" | null;
export type Screen =
  | "menu"
  | "characters"
  | "mode"
  | "game"
  | "result"
  | "about";

export type CharacterId =
  | "einstein"
  | "epstein"
  | "hawking"
  | "sheikh-said"
  | "cartman"
  | "hitler";

export type QuestionType =
  | "multiple-choice"
  | "true-false"
  | "fill-blank"
  | "ordering";

export interface LocalizedText {
  tr: string;
  en: string;
}

export interface AnswerOption {
  id: string;
  text: LocalizedText;
}

export interface CharacterQuestion {
  id: string;
  characterId: CharacterId;
  type: QuestionType;
  question: LocalizedText;
  options: AnswerOption[];
  correctAnswer: string | string[];
  explanation: LocalizedText;
  category: string;
  difficulty: Difficulty;
  tone: QuestionTone;
  sourceNote: string;
}

export interface CharacterProfile {
  id: CharacterId;
  name: string;
  years: string;
  description: LocalizedText;
  kind: LocalizedText;
  avatar: string;
  sceneAvatar: string;
  accent: string;
  scene: "laboratory" | "cosmos" | "concrete" | "historic" | "parody";
}

export type AnswerMark = "correct" | "wrong" | "current" | "empty";

export interface RoundAnswer {
  questionId: string;
  correct: boolean;
  selectedAnswer: string | string[];
  progressBefore: number;
  progressAfter: number;
}

export interface AvatarTransform {
  offsetX: number;
  offsetY: number;
  scale: number;
  rotation: number;
  neckOffsetX: number;
  neckOffsetY: number;
  maskScale: number;
}
