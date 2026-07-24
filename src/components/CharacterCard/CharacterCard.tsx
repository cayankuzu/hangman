import { motion } from "framer-motion";
import type { CharacterProfile, Language } from "../../types/game";

export function CharacterCard({
  character,
  language,
  onSelect,
}: {
  character: CharacterProfile;
  language: Language;
  onSelect: () => void;
}) {
  return (
    <motion.button
      type="button"
      className="characterCard"
      aria-label={`${character.name} — ${character.kind[language]}`}
      onClick={onSelect}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -7 }}
      whileTap={{ scale: 0.985 }}
      style={{ "--character-accent": character.accent } as React.CSSProperties}
    >
      <div className="characterPortrait">
        <div className="portraitHalo" />
        <img src={character.avatar} alt={character.name} />
        <span>{character.years}</span>
      </div>
      <div className="characterMeta">
        <p>{character.kind[language]}</p>
        <h2>{character.name}</h2>
        <span>{character.description[language]}</span>
      </div>
      <span className="characterCardArrow" aria-hidden="true">↗</span>
    </motion.button>
  );
}
