import type { CharacterId, CharacterQuestion } from "../../types/game";
import { cartmanQuestions } from "./cartman";
import { einsteinQuestions } from "./einstein";
import { epsteinQuestions } from "./epstein";
import { hawkingQuestions } from "./hawking";
import { hitlerQuestions } from "./hitler";
import { sheikhSaidQuestions } from "./sheikhSaid";
import { expandQuestionBank } from "./expand";

export const questionsByCharacter: Record<CharacterId, CharacterQuestion[]> = {
  einstein: expandQuestionBank(einsteinQuestions),
  epstein: expandQuestionBank(epsteinQuestions),
  hawking: expandQuestionBank(hawkingQuestions),
  "sheikh-said": expandQuestionBank(sheikhSaidQuestions),
  cartman: expandQuestionBank(cartmanQuestions),
  hitler: expandQuestionBank(hitlerQuestions),
};

export const allQuestions = Object.values(questionsByCharacter).flat();
