import { useMemo, useState } from "react";
import { characters } from "../data/characters";
import { avatarTransforms } from "../data/avatarTransforms";
import type { AvatarTransform, CharacterId } from "../types/game";

const controls: {
  key: keyof AvatarTransform;
  label: string;
  min: number;
  max: number;
  step: number;
}[] = [
  { key: "offsetX", label: "Yatay konum", min: -120, max: 120, step: 1 },
  { key: "offsetY", label: "Dikey konum", min: -120, max: 120, step: 1 },
  { key: "scale", label: "Yakınlık", min: 0.5, max: 2, step: 0.01 },
  { key: "rotation", label: "Döndürme", min: -25, max: 25, step: 0.5 },
  { key: "neckOffsetX", label: "Boyun X", min: -60, max: 60, step: 1 },
  { key: "neckOffsetY", label: "Boyun Y", min: -60, max: 60, step: 1 },
  { key: "maskScale", label: "Maske", min: 0.7, max: 1.3, step: 0.01 },
];

export function AvatarLab() {
  const [characterId, setCharacterId] = useState<CharacterId>("einstein");
  const [preview, setPreview] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const storageKey = `final-verdict-avatar-${characterId}`;
  const stored = useMemo(() => {
    const value = localStorage.getItem(storageKey);
    return value ? (JSON.parse(value) as AvatarTransform) : avatarTransforms[characterId];
  }, [characterId, storageKey]);
  const [transform, setTransform] = useState<AvatarTransform>(stored);
  const character = characters.find((item) => item.id === characterId)!;

  const changeCharacter = (id: CharacterId) => {
    setCharacterId(id);
    setPreview(null);
    setSaved(false);
    const savedValue = localStorage.getItem(`final-verdict-avatar-${id}`);
    setTransform(
      savedValue
        ? (JSON.parse(savedValue) as AvatarTransform)
        : avatarTransforms[id],
    );
  };

  return (
    <main className="avatarLab">
      <header>
        <div>
          <p>Development tool</p>
          <h1>Avatar Lab</h1>
        </div>
        <a href="/">Oyuna dön ↗</a>
      </header>
      <section className="avatarLabLayout">
        <div className="avatarWorkbench">
          <div className="headGuide">
            <div
              className="avatarAsset"
              style={{
                transform: `translate(${transform.offsetX}px, ${transform.offsetY}px) scale(${transform.scale}) rotate(${transform.rotation}deg)`,
              }}
            >
              <img src={preview ?? character.avatar} alt="" />
            </div>
            <div
              className="neckGuide"
              style={{
                transform: `translate(${transform.neckOffsetX}px, ${transform.neckOffsetY}px)`,
              }}
            />
            <div
              className="maskGuide"
              style={{ transform: `scale(${transform.maskScale})` }}
            />
          </div>
          <label className="uploadControl">
            Görsel yükle
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) setPreview(URL.createObjectURL(file));
              }}
            />
          </label>
        </div>
        <aside className="avatarControls">
          <label>
            Karakter
            <select
              value={characterId}
              onChange={(event) => changeCharacter(event.target.value as CharacterId)}
            >
              {characters.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          {controls.map((control) => (
            <label key={control.key}>
              <span>
                {control.label}
                <b>{transform[control.key]}</b>
              </span>
              <input
                type="range"
                min={control.min}
                max={control.max}
                step={control.step}
                value={transform[control.key]}
                onChange={(event) =>
                  setTransform((current) => ({
                    ...current,
                    [control.key]: Number(event.target.value),
                  }))
                }
              />
            </label>
          ))}
          <button
            type="button"
            onClick={() => {
              localStorage.setItem(storageKey, JSON.stringify(transform));
              setSaved(true);
            }}
          >
            {saved ? "Ayarlar kaydedildi ✓" : "Ayarları kaydet"}
          </button>
          <p>
            Ayarlar bu tarayıcıda saklanır. Üretim dosyasına aktarmak için değerleri
            <code>avatarTransforms.ts</code> içine kopyala.
          </p>
        </aside>
      </section>
    </main>
  );
}
