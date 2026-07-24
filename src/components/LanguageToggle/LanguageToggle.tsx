import { copy } from "../../i18n/copy";
import { useGameStore } from "../../stores/gameStore";

function SoundIcon({ enabled }: { enabled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 9v6h4l5 4V5L8 9H4Z" />
      {enabled ? (
        <>
          <path d="M16 9.2c1.1 1.5 1.1 4.1 0 5.6" />
          <path d="M19 6.8c2.6 2.9 2.6 7.5 0 10.4" />
        </>
      ) : (
        <path d="m17 9 5 5m0-5-5 5" />
      )}
    </svg>
  );
}

export function LanguageToggle() {
  const language = useGameStore((state) => state.language);
  const setLanguage = useGameStore((state) => state.setLanguage);
  const soundEnabled = useGameStore((state) => state.soundEnabled);
  const toggleSound = useGameStore((state) => state.toggleSound);

  return (
    <div className="utilityControls">
      <div className="languageToggle" aria-label="Language">
        <button
          className={language === "tr" ? "isActive" : ""}
          type="button"
          onClick={() => setLanguage("tr")}
        >
          TR
        </button>
        <button
          className={language === "en" ? "isActive" : ""}
          type="button"
          onClick={() => setLanguage("en")}
        >
          EN
        </button>
      </div>
      <button
        className="audioToggle soundToggle"
        type="button"
        aria-pressed={soundEnabled}
        aria-label={copy(language, soundEnabled ? "soundOn" : "soundOff")}
        onClick={toggleSound}
      >
        <SoundIcon enabled={soundEnabled} />
        <span>{copy(language, soundEnabled ? "soundOn" : "soundOff")}</span>
      </button>
    </div>
  );
}
