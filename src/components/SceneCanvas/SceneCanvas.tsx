import {
  AdaptiveDpr,
  ContactShadows,
  Sparkles,
  Stars,
} from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useRef } from "react";
import {
  ACESFilmicToneMapping,
  MathUtils,
  SRGBColorSpace,
} from "three";
import { copy } from "../../i18n/copy";
import type {
  CharacterProfile,
  Language,
  StageMode,
} from "../../types/game";
import type { FinalSound } from "../../utils/sound";
import { CharacterRig } from "../../three/CharacterRig";
import { Gallows } from "../../three/Gallows";

interface SceneCanvasProps {
  character: CharacterProfile;
  mode: StageMode;
  correct: number;
  language: Language;
  feedbackNonce?: number;
  lastCorrect?: boolean | null;
  preview?: boolean;
  animationEnabled?: boolean;
  finalState?: FinalSound;
}

function ConcreteSet() {
  return (
    <group position={[0, 0, -3.15]}>
      {[-3.9, -1.3, 1.3, 3.9].map((x) => (
        <mesh key={x} position={[x, 0.25, 0]} receiveShadow>
          <boxGeometry args={[2.54, 6.2, 0.2]} />
          <meshStandardMaterial color="#363c44" roughness={0.92} />
        </mesh>
      ))}
      {[-2.75, 0, 2.75].map((y) => (
        <mesh key={y} position={[0, y, 0.14]}>
          <boxGeometry args={[10.4, 0.025, 0.04]} />
          <meshStandardMaterial color="#69727b" roughness={0.72} />
        </mesh>
      ))}
    </group>
  );
}

function LaboratorySet({ accent }: { accent: string }) {
  return (
    <group position={[0, 0.25, -3]}>
      {[-3.5, 3.5].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh>
            <boxGeometry args={[2.3, 5.7, 0.16]} />
            <meshStandardMaterial color="#1b2a35" roughness={0.7} metalness={0.3} />
          </mesh>
          {[-1.7, -0.85, 0, 0.85, 1.7].map((y, index) => (
            <mesh key={y} position={[0, y, 0.12]}>
              <boxGeometry args={[1.75, 0.035, 0.04]} />
              <meshBasicMaterial color={index === 2 ? accent : "#365063"} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

function CosmosSet({ accent }: { accent: string }) {
  return (
    <>
      <Stars radius={46} depth={24} count={1600} factor={2.6} fade speed={0.28} />
      <group position={[2.9, 0.9, -2.2]} rotation={[0.2, -0.4, 0.5]}>
        {[0.7, 1.08, 1.45].map((radius, index) => (
          <mesh key={radius}>
            <torusGeometry args={[radius, 0.014, 10, 72]} />
            <meshBasicMaterial color={index === 1 ? accent : "#596583"} />
          </mesh>
        ))}
        <mesh>
          <sphereGeometry args={[0.24, 24, 18]} />
          <meshStandardMaterial color="#d1c28e" emissive="#675d43" emissiveIntensity={0.7} />
        </mesh>
      </group>
    </>
  );
}

function HistoricSet() {
  return (
    <group position={[0, 0.15, -3.1]}>
      {[-3.55, 3.55].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh>
            <boxGeometry args={[1.35, 6.1, 0.5]} />
            <meshStandardMaterial color="#504231" roughness={0.94} />
          </mesh>
          <mesh position={[0, 2.1, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.15, 0.28, 16, 44, Math.PI]} />
            <meshStandardMaterial color="#67533a" roughness={0.9} />
          </mesh>
        </group>
      ))}
      {[-3.15, 3.15].map((x) => (
        <pointLight key={x} position={[x, 1.25, 1]} color="#ffb55d" intensity={1.7} distance={5} />
      ))}
    </group>
  );
}

function ParodySet() {
  return (
    <>
      <Sparkles count={42} scale={[8, 5.5, 5]} color="#f6dc45" size={3.2} speed={0.34} />
      <group position={[0, -1.05, -3]}>
        {[
          [-3.2, 1.3, "#256673"],
          [-0.8, 1.85, "#1e8794"],
          [1.8, 1.5, "#27616c"],
          [3.8, 1.1, "#15545e"],
        ].map(([x, height, color]) => (
          <mesh key={x as number} position={[x as number, 0, 0]} rotation={[0, 0, 0]}>
            <coneGeometry args={[height as number, (height as number) * 1.55, 4]} />
            <meshStandardMaterial color={color as string} roughness={0.88} />
          </mesh>
        ))}
      </group>
    </>
  );
}

function SceneDetails({ character }: { character: CharacterProfile }) {
  switch (character.scene) {
    case "laboratory":
      return <LaboratorySet accent={character.accent} />;
    case "cosmos":
      return <CosmosSet accent={character.accent} />;
    case "historic":
      return <HistoricSet />;
    case "parody":
      return <ParodySet />;
    default:
      return <ConcreteSet />;
  }
}

function SceneDirector({
  feedbackNonce,
  lastCorrect,
}: {
  feedbackNonce: number;
  lastCorrect: boolean | null;
}) {
  const pulse = useRef(0);

  useEffect(() => {
    if (feedbackNonce > 0) pulse.current = 1;
  }, [feedbackNonce, lastCorrect]);

  useFrame((state, delta) => {
    const camera = state.camera;
    pulse.current = MathUtils.damp(pulse.current, 0, 4.8, delta);
    const zoom = lastCorrect === true ? pulse.current * 0.22 : 0;
    camera.position.x = MathUtils.damp(camera.position.x, 0, 10, delta);
    camera.position.y = MathUtils.damp(
      camera.position.y,
      0.24,
      4,
      delta,
    );
    camera.position.z = MathUtils.damp(camera.position.z, 8.25 - zoom, 5, delta);
    camera.lookAt(0, -0.1, 0);
  });

  return null;
}

export function SceneCanvas({
  character,
  mode,
  correct,
  language,
  feedbackNonce = 0,
  lastCorrect = null,
  preview = false,
  animationEnabled = true,
  finalState,
}: SceneCanvasProps) {
  const feedbackClass =
    feedbackNonce > 0
      ? lastCorrect
        ? "isCorrect"
        : "isWrong"
      : "";

  return (
    <div
      className={[
        "sceneCanvas",
        `scene-${character.scene}`,
        preview ? "scenePreview3d" : "",
        finalState ? `isFinal is${finalState[0].toUpperCase()}${finalState.slice(1)}` : "",
      ]
        .filter(Boolean)
        .join(" ")}
      data-feedback={lastCorrect === null ? "idle" : lastCorrect ? "correct" : "wrong"}
      data-mode={mode}
      data-step={correct}
      data-final={finalState ?? "none"}
    >
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0.22, 8.25], fov: 43 }}
        gl={{ antialias: true, powerPreference: "high-performance", alpha: false }}
        onCreated={({ gl }) => {
          gl.toneMapping = ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.66;
          gl.outputColorSpace = SRGBColorSpace;
        }}
        shadows="soft"
      >
        <color
          attach="background"
          args={[
            finalState === "hanged"
              ? "#1a1114"
              : finalState === "rescued"
                ? "#101c1a"
                : "#151a21",
          ]}
        />
        <fog attach="fog" args={["#111820", 10, 22]} />
        <hemisphereLight args={["#edf5ff", "#3b3027", 2.35]} />
        <ambientLight
          intensity={finalState === "hanged" ? 1.22 : 1.05}
          color={finalState === "hanged" ? "#ffd8d8" : "#cbd8e4"}
        />
        <spotLight
          position={[0.4, 7.2, 4.7]}
          angle={0.48}
          penumbra={0.82}
          intensity={6.2 + correct * 0.16 + (finalState ? 0.8 : 0)}
          color={finalState === "hanged" ? "#ffd9d1" : "#fff0d3"}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <spotLight
          position={[-5, 2.2, 3.6]}
          angle={0.55}
          penumbra={0.9}
          intensity={3.15}
          color={character.accent}
        />
        <pointLight
          position={[4.4, 0.2, 2.2]}
          color={character.accent}
          intensity={2.2}
          distance={9}
        />
        <Suspense fallback={null}>
          <mesh position={[0, -2.32, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[18, 18]} />
            <meshPhysicalMaterial color="#262c34" roughness={0.86} metalness={0.12} />
          </mesh>
          <group position={[0, 0.15, 0]}>
            <Gallows
              mode={mode}
              step={correct}
              characterId={character.id}
              feedbackNonce={feedbackNonce}
              lastCorrect={lastCorrect}
              animationEnabled={animationEnabled}
            />
            <CharacterRig
              character={character}
              mode={mode}
              step={correct}
              feedbackNonce={feedbackNonce}
              lastCorrect={lastCorrect}
              animationEnabled={animationEnabled}
            />
          </group>
          <SceneDetails character={character} />
          {finalState === "hanged" ? (
            <Sparkles
              count={48}
              scale={[7.5, 5.4, 4]}
              color="#b73a43"
              size={1.45}
              speed={0.22}
              opacity={0.34}
            />
          ) : null}
          {finalState === "rescued" ? (
            <Sparkles
              count={70}
              scale={[7.8, 5.7, 4.4]}
              color="#7ae0b1"
              size={2.1}
              speed={0.48}
              opacity={0.62}
            />
          ) : null}
          <ContactShadows
            position={[0, -2.27, 0]}
            opacity={0.72}
            scale={8}
            blur={2.4}
            far={5}
          />
          <SceneDirector
            feedbackNonce={feedbackNonce}
            lastCorrect={lastCorrect}
          />
          <AdaptiveDpr pixelated={false} />
        </Suspense>
      </Canvas>
      <div className="sceneVignette" />
      <div className="sceneGrain" />
      {!preview && feedbackNonce > 0 ? (
        <div
          key={`${feedbackNonce}-${lastCorrect}`}
          className={`sceneFeedback ${feedbackClass}`}
          aria-live="polite"
        >
          <span>{lastCorrect ? "✓" : "×"}</span>
          <div>
            <strong>
              {copy(language, lastCorrect ? "feedbackCorrect" : "feedbackWrong")}
            </strong>
            <small>
              {copy(
                language,
                lastCorrect ? "feedbackCorrectLead" : "feedbackWrongLead",
              )}
            </small>
          </div>
        </div>
      ) : null}
      {!preview ? (
        <p className="sceneLabel">
          {copy(language, mode === "execute" ? "stageExecute" : "stageRescue")} ·{" "}
          {correct}/6
        </p>
      ) : null}
    </div>
  );
}
