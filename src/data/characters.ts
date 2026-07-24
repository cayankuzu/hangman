import type { CharacterProfile } from "../types/game";

export const characters: CharacterProfile[] = [
  {
    id: "einstein",
    name: "Albert Einstein",
    years: "1879—1955",
    description: {
      tr: "Görelilik, kuantum düşüncesi ve modern fiziğin dönüşen dili.",
      en: "Relativity, quantum thought, and the changing language of modern physics.",
    },
    kind: { tr: "Teorik fizikçi", en: "Theoretical physicist" },
    avatar: "/avatars/heads/einstein.png",
    sceneAvatar: "/avatars/game/einstein.png",
    accent: "#9ecbff",
    scene: "laboratory",
  },
  {
    id: "epstein",
    name: "Jeffrey Epstein",
    years: "1953—2019",
    description: {
      tr: "Belgelenmiş dava kayıtları, finans kariyeri ve kamuya açık kronoloji.",
      en: "Documented court records, a finance career, and a public chronology.",
    },
    kind: { tr: "Hüküm giymiş suçlu", en: "Convicted offender" },
    avatar: "/avatars/heads/epstein.png",
    sceneAvatar: "/avatars/game/epstein.png",
    accent: "#a9b2c1",
    scene: "concrete",
  },
  {
    id: "hawking",
    name: "Stephen Hawking",
    years: "1942—2018",
    description: {
      tr: "Kara delikler, kozmoloji ve bilimi geniş kitlelere anlatma tutkusu.",
      en: "Black holes, cosmology, and a passion for making science public.",
    },
    kind: { tr: "Kozmolog", en: "Cosmologist" },
    avatar: "/avatars/heads/hawking.png",
    sceneAvatar: "/avatars/game/hawking.png",
    accent: "#c7b9ff",
    scene: "cosmos",
  },
  {
    id: "sheikh-said",
    name: "Şeyh Said",
    years: "1865—1925",
    description: {
      tr: "1925 olaylarının tartışmalı tarihsel bağlamına tarafsız bir bakış.",
      en: "A neutral look at the disputed historical context of the events of 1925.",
    },
    kind: { tr: "Dinî ve tarihsel figür", en: "Religious and historical figure" },
    avatar: "/avatars/heads/sheikh-said.png",
    sceneAvatar: "/avatars/game/sheikh-said.png",
    accent: "#d8bd84",
    scene: "historic",
  },
  {
    id: "cartman",
    name: "Eric Cartman",
    years: "Kurgu / Fiction",
    description: {
      tr: "South Park evreninin güç, çıkar ve absürtlük peşindeki kurgu karakteri.",
      en: "A fictional South Park character chasing power, self-interest, and absurdity.",
    },
    kind: { tr: "Kurgu karakter", en: "Fictional character" },
    avatar: "/avatars/heads/cartman.png",
    sceneAvatar: "/avatars/game/cartman.png",
    accent: "#53d2d8",
    scene: "parody",
  },
  {
    id: "hitler",
    name: "Adolf Hitler",
    years: "1889—1945",
    description: {
      tr: "Nazi diktatörlüğü, propaganda, savaş ve Holokost'un belgelenmiş tarihi.",
      en: "The documented history of Nazi dictatorship, propaganda, war, and the Holocaust.",
    },
    kind: { tr: "Nazi diktatörü", en: "Nazi dictator" },
    avatar: "/avatars/heads/hitler.png",
    sceneAvatar: "/avatars/game/hitler.png",
    accent: "#d25349",
    scene: "concrete",
  },
];

export const getCharacter = (id: CharacterProfile["id"] | null) =>
  characters.find((character) => character.id === id) ?? characters[0];
