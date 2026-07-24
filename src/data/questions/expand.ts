import type {
  CharacterId,
  CharacterQuestion,
  Difficulty,
  LocalizedText,
  QuestionTone,
} from "../../types/game";

const FACTS_PER_DIFFICULTY = 33;
const SATIRE_PER_DIFFICULTY = 66;

const satireFrames: LocalizedText[] = [
  {
    tr: "Hayranlık tarihsel kaydı değiştirmiyor.",
    en: "Admiration does not change the historical record.",
  },
  {
    tr: "Nefret de bilgisizliği haklı çıkarmıyor.",
    en: "Hatred does not excuse ignorance either.",
  },
  {
    tr: "Kahramanlık afişi indirildi ve geriye belgeler kaldı.",
    en: "The hero poster is down and the documents remain.",
  },
  {
    tr: "Propaganda sustuğunda bu soru hâlâ masada kalıyor.",
    en: "When propaganda goes quiet, this question remains.",
  },
  {
    tr: "Mazeret üretmeden tarihsel kayda bak.",
    en: "Look at the historical record without inventing an excuse.",
  },
  {
    tr: "İtibar cilası bu belgeyi örtemiyor.",
    en: "Reputation polish cannot cover this record.",
  },
  {
    tr: "Bu bilgi hem hayranını hem karşıtını rahatsız edebilir.",
    en: "This fact may unsettle both admirers and opponents.",
  },
  {
    tr: "Sloganlar bittiğinde kronoloji değişmiyor.",
    en: "The chronology remains when the slogans end.",
  },
  {
    tr: "Tarih kimsenin tarafını tutmak zorunda değil.",
    en: "History is not required to take anyone's side.",
  },
  {
    tr: "Bu kayıt kolay bir savunma cümlesi bırakmıyor.",
    en: "This record leaves no easy line of defense.",
  },
  {
    tr: "Kişilik kültü gerçeğin yerine geçmiyor.",
    en: "A cult of personality does not replace the facts.",
  },
  {
    tr: "Rahatsızlık doğru cevabı değiştirmiyor.",
    en: "Discomfort does not change the correct answer.",
  },
];

const characterSatireFrames: Record<CharacterId, LocalizedText[]> = {
  einstein: [
    {
      tr: "Bilimsel deha özel hayatta otomatik olarak erdem üretmiyor.",
      en: "Scientific genius does not automatically produce private virtue.",
    },
    {
      tr: "Denklemler parlak olabilir ama aile kaydı yine de sorgulanabilir.",
      en: "The equations may be brilliant while the family record remains open to scrutiny.",
    },
    {
      tr: "Nobel itibarı biyografideki zor bölümleri silmiyor.",
      en: "Nobel prestige does not erase the difficult chapters of a biography.",
    },
  ],
  epstein: [
    {
      tr: "Servet, bağlantılar ve malikâneler mahkeme kaydını temize çıkarmıyor.",
      en: "Wealth, connections and mansions do not clear the court record.",
    },
    {
      tr: "Ünlü isimlerin gölgesi mağdurların kaydından daha önemli değil.",
      en: "The shadow of famous names is not more important than the victims' record.",
    },
    {
      tr: "İnternet söylentisiyle doğrulanmış dava belgesini birbirine karıştırma.",
      en: "Do not confuse internet rumor with a verified court document.",
    },
  ],
  hawking: [
    {
      tr: "Bir fotoğrafın çağrıştırdığı şey kanıtın yerini tutmuyor.",
      en: "What a photograph suggests does not replace evidence.",
    },
    {
      tr: "Bilimsel şöhret eleştiriden muafiyet sağlamıyor.",
      en: "Scientific fame does not grant immunity from criticism.",
    },
    {
      tr: "Söylenti eğlenceli olabilir ama kronoloji yine kontrol edilmeli.",
      en: "A rumor may be entertaining, but the chronology still needs checking.",
    },
  ],
  "sheikh-said": [
    {
      tr: "Kahraman ya da hain etiketi mahkeme kaydını tek başına açıklamıyor.",
      en: "The label of hero or traitor does not explain the court record by itself.",
    },
    {
      tr: "Siyasi sloganlar silahlı ayaklanmanın kronolojisini değiştirmiyor.",
      en: "Political slogans do not change the chronology of an armed uprising.",
    },
    {
      tr: "Tarihsel tartışma belge okumadan çözülemiyor.",
      en: "A historical dispute cannot be settled without reading the record.",
    },
  ],
  cartman: [
    {
      tr: "Kurgu karakter olmak yapılanları sempatik kılmıyor.",
      en: "Being fictional does not make the actions sympathetic.",
    },
    {
      tr: "Komedi etiketi davranışın ne olduğunu değiştirmiyor.",
      en: "A comedy label does not change what the behavior is.",
    },
    {
      tr: "Şaka bittiğinde karakterin sicili hâlâ masada.",
      en: "When the joke ends, the character's record remains.",
    },
  ],
  hitler: [
    {
      tr: "Sandıktan çıkmak diktatörlüğün suçlarını aklamıyor.",
      en: "Emerging from an election does not absolve a dictatorship's crimes.",
    },
    {
      tr: "Propaganda, toplu cinayetlerin failini tartışmalı bir kahramana çevirmiyor.",
      en: "Propaganda does not turn the perpetrator of mass murder into a debatable hero.",
    },
    {
      tr: "Askerî gösteri Holokost ve savaş suçlarının kaydını örtemiyor.",
      en: "Military spectacle cannot cover the record of the Holocaust and war crimes.",
    },
  ],
};

function cleanPunctuation(value: string) {
  return value
    .replace(/\s*:\s*/g, ". ")
    .replace(/\s+/g, " ")
    .trim();
}

function localizedPrompt(
  question: CharacterQuestion,
  tone: QuestionTone,
  variantIndex: number,
): LocalizedText {
  const cleanQuestion = {
    tr: cleanPunctuation(question.question.tr),
    en: cleanPunctuation(question.question.en),
  };

  if (tone === "fact") return cleanQuestion;
  const frames = [
    ...characterSatireFrames[question.characterId],
    ...satireFrames,
  ];
  const frame = frames[variantIndex % frames.length];
  return {
    tr: `${frame.tr} ${cleanQuestion.tr}`,
    en: `${frame.en} ${cleanQuestion.en}`,
  };
}

function buildTonePool(
  source: readonly CharacterQuestion[],
  difficulty: Difficulty,
  tone: QuestionTone,
  count: number,
): CharacterQuestion[] {
  return Array.from({ length: count }, (_, index) => {
    const original = source[index % source.length];
    const variantIndex = Math.floor(index / source.length);
    const variantId = `${original.id}-d${difficulty}-${tone}-v${variantIndex + 1}`;

    return {
      ...original,
      id: variantId,
      tone,
      question: localizedPrompt(original, tone, index),
      options: original.options.map((option) => ({
        ...option,
        id: `${variantId}-${option.id}`,
      })),
      correctAnswer: Array.isArray(original.correctAnswer)
        ? original.correctAnswer.map((answer) => `${variantId}-${answer}`)
        : `${variantId}-${original.correctAnswer}`,
      difficulty,
    };
  });
}

function buildDifficultyPool(
  baseQuestions: readonly CharacterQuestion[],
  difficulty: Difficulty,
): CharacterQuestion[] {
  const source = baseQuestions.filter(
    (question) => question.difficulty === difficulty,
  );
  if (source.length === 0) {
    throw new Error(`Difficulty ${difficulty} has no source questions.`);
  }

  return [
    ...buildTonePool(source, difficulty, "fact", FACTS_PER_DIFFICULTY),
    ...buildTonePool(source, difficulty, "satire", SATIRE_PER_DIFFICULTY),
  ];
}

export function expandQuestionBank(
  baseQuestions: readonly CharacterQuestion[],
): CharacterQuestion[] {
  return ([1, 2, 3] as const).flatMap((difficulty) =>
    buildDifficultyPool(baseQuestions, difficulty),
  );
}
