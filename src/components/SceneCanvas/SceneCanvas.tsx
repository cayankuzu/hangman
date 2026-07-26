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
import type { Group } from "three";
import { copy } from "../../i18n/copy";
import type {
  CharacterProfile,
  Language,
  StageMode,
} from "../../types/game";
import type { FinalSound } from "../../utils/sound";
import { CharacterRig } from "../../three/CharacterRig";
import { Gallows } from "../../three/Gallows";
import { ImportedCharacterRig } from "../../three/ImportedCharacterRig";

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

function EinsteinArtifacts({ accent }: { accent: string }) {
  const atom = useRef<Group>(null);

  useFrame((state, delta) => {
    if (!atom.current) return;
    atom.current.rotation.y += delta * 0.38;
    atom.current.rotation.z =
      Math.sin(state.clock.elapsedTime * 0.6) * 0.16;
  });

  return (
    <>
      <group ref={atom} position={[-2.2, 1.15, -1.3]} scale={0.72}>
        {[
          [0, 0, 0],
          [Math.PI / 2, 0.35, 0],
          [0.48, Math.PI / 2, 0.25],
        ].map((rotation, index) => (
          <mesh key={index} rotation={rotation as [number, number, number]}>
            <torusGeometry args={[0.82, 0.026, 12, 72]} />
            <meshStandardMaterial
              color={index === 1 ? "#f0d696" : accent}
              emissive={index === 1 ? "#7b612c" : "#254e6d"}
              emissiveIntensity={0.8}
              metalness={0.46}
              roughness={0.28}
            />
          </mesh>
        ))}
        <mesh castShadow>
          <icosahedronGeometry args={[0.18, 2]} />
          <meshPhysicalMaterial
            color="#f3db99"
            emissive="#8f6d26"
            emissiveIntensity={1.2}
            roughness={0.24}
          />
        </mesh>
      </group>
      <group position={[2.35, -0.9, -1.5]} rotation={[0.18, -0.32, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.12, 0.28, 1.5, 3]} />
          <meshPhysicalMaterial
            color="#b8d7ed"
            transmission={0.32}
            thickness={0.8}
            roughness={0.18}
          />
        </mesh>
        {[0.22, 0.48, 0.74].map((y, index) => (
          <mesh key={y} position={[0, y - 0.56, 0.18]}>
            <sphereGeometry args={[0.055, 16, 12]} />
            <meshBasicMaterial color={index === 1 ? "#f0ca72" : accent} />
          </mesh>
        ))}
      </group>
    </>
  );
}

function EpsteinArtifacts() {
  return (
    <>
      <group position={[-3.45, 0.05, -1.7]}>
        {[-0.7, -0.35, 0, 0.35, 0.7].map((x) => (
          <mesh key={x} position={[x, 0.35, 0]} castShadow>
            <cylinderGeometry args={[0.035, 0.035, 4.7, 14]} />
            <meshStandardMaterial
              color="#7e8992"
              metalness={0.92}
              roughness={0.2}
            />
          </mesh>
        ))}
        {[-1.15, 0.2, 1.55].map((y) => (
          <mesh key={y} position={[0, y, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.03, 0.03, 1.7, 12]} />
            <meshStandardMaterial
              color="#69747d"
              metalness={0.9}
              roughness={0.24}
            />
          </mesh>
        ))}
      </group>
      <group position={[3.1, -1.45, -1.3]} rotation={[0, -0.2, 0]}>
        {[0, 0.52, 1.04].map((y, index) => (
          <mesh key={y} position={[0, y, 0]} castShadow>
            <boxGeometry args={[1.45 - index * 0.08, 0.44, 0.9]} />
            <meshStandardMaterial
              color={index === 1 ? "#554637" : "#67543f"}
              roughness={0.9}
            />
          </mesh>
        ))}
        <mesh position={[0, 1.29, 0.46]} rotation={[-0.35, 0, 0]}>
          <boxGeometry args={[0.8, 0.5, 0.05]} />
          <meshPhysicalMaterial
            color="#d9d1bd"
            roughness={0.72}
            clearcoat={0.04}
          />
        </mesh>
      </group>
    </>
  );
}

function HawkingArtifacts({ accent }: { accent: string }) {
  const blackHole = useRef<Group>(null);

  useFrame((_, delta) => {
    if (!blackHole.current) return;
    blackHole.current.rotation.z += delta * 0.22;
    blackHole.current.rotation.y += delta * 0.08;
  });

  return (
    <group ref={blackHole} position={[-2.65, 1.12, -1.55]} rotation={[0.4, 0.25, 0]}>
      <mesh>
        <sphereGeometry args={[0.42, 40, 30]} />
        <meshStandardMaterial color="#010205" roughness={0.18} metalness={0.2} />
      </mesh>
      {[0.58, 0.73, 0.9, 1.08].map((radius, index) => (
        <mesh
          key={radius}
          rotation={[Math.PI / 2 + index * 0.035, 0.18, index * 0.22]}
        >
          <torusGeometry args={[radius, 0.035 - index * 0.004, 12, 96]} />
          <meshBasicMaterial
            color={index < 2 ? "#f0bd69" : accent}
            transparent
            opacity={0.88 - index * 0.12}
          />
        </mesh>
      ))}
      <pointLight color="#c7b9ff" intensity={2.2} distance={4.5} />
    </group>
  );
}

function SheikhSaidArtifacts() {
  const lantern = useRef<Group>(null);

  useFrame((state) => {
    if (!lantern.current) return;
    lantern.current.rotation.z =
      Math.sin(state.clock.elapsedTime * 0.72) * 0.075;
  });

  return (
    <>
      <group ref={lantern} position={[-2.55, 1.05, -1.1]}>
        <mesh position={[0, 1.15, 0]}>
          <cylinderGeometry args={[0.018, 0.018, 1.65, 12]} />
          <meshStandardMaterial color="#7b6342" roughness={0.86} />
        </mesh>
        <mesh castShadow>
          <cylinderGeometry args={[0.24, 0.36, 0.72, 8]} />
          <meshPhysicalMaterial
            color="#c79a52"
            emissive="#8f541f"
            emissiveIntensity={1.1}
            roughness={0.42}
            transmission={0.18}
          />
        </mesh>
        <pointLight color="#ffb45f" intensity={2.5} distance={4.2} />
      </group>
      <group position={[2.7, 1.05, -1.75]} rotation={[0.1, -0.24, -0.22]}>
        <mesh>
          <torusGeometry args={[0.62, 0.095, 18, 80, Math.PI * 1.48]} />
          <meshPhysicalMaterial
            color="#d7bc82"
            metalness={0.46}
            roughness={0.3}
          />
        </mesh>
        <mesh position={[0.42, 0.18, 0]}>
          <octahedronGeometry args={[0.13, 0]} />
          <meshStandardMaterial
            color="#e2ca91"
            emissive="#705526"
            emissiveIntensity={0.6}
          />
        </mesh>
      </group>
    </>
  );
}

function CartmanArtifacts() {
  return (
    <>
      <Sparkles
        count={85}
        scale={[8.5, 6.2, 4.8]}
        color="#dcefff"
        size={1.7}
        speed={0.3}
        opacity={0.48}
      />
      <group position={[-2.8, -1.12, -1.35]}>
        {[0.48, 0.36, 0.25].map((radius, index) => (
          <mesh key={radius} position={[0, index * 0.65, 0]} castShadow>
            <sphereGeometry args={[radius, 28, 20]} />
            <meshPhysicalMaterial
              color="#eaf4f5"
              roughness={0.78}
              clearcoat={0.08}
            />
          </mesh>
        ))}
        <mesh position={[-0.09, 1.33, 0.23]}>
          <sphereGeometry args={[0.035, 12, 8]} />
          <meshBasicMaterial color="#171b1f" />
        </mesh>
        <mesh position={[0.09, 1.33, 0.23]}>
          <sphereGeometry args={[0.035, 12, 8]} />
          <meshBasicMaterial color="#171b1f" />
        </mesh>
      </group>
      <group position={[3.05, -0.5, -1.5]}>
        <mesh position={[0, -0.2, 0]}>
          <cylinderGeometry args={[0.055, 0.055, 2.7, 14]} />
          <meshStandardMaterial
            color="#89949b"
            metalness={0.82}
            roughness={0.22}
          />
        </mesh>
        <mesh position={[0, 1.05, 0]}>
          <boxGeometry args={[1.05, 0.48, 0.11]} />
          <meshPhysicalMaterial
            color="#e4b839"
            roughness={0.48}
            clearcoat={0.12}
          />
        </mesh>
      </group>
    </>
  );
}

function HitlerArtifacts() {
  return (
    <>
      <group position={[2.85, -1.25, -1.3]} rotation={[0, -0.28, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[2.2, 0.22, 1.35]} />
          <meshPhysicalMaterial
            color="#39352f"
            roughness={0.82}
            metalness={0.16}
          />
        </mesh>
        <mesh position={[0, 0.14, 0]}>
          <boxGeometry args={[1.72, 0.035, 0.92]} />
          <meshStandardMaterial color="#b7a989" roughness={0.88} />
        </mesh>
        {[-0.68, 0.68].map((x) => (
          <mesh key={x} position={[x, -0.8, 0]}>
            <boxGeometry args={[0.18, 1.5, 0.18]} />
            <meshStandardMaterial color="#2a2825" roughness={0.82} />
          </mesh>
        ))}
      </group>
      <group position={[-3.5, 0.7, -1.65]}>
        {[-0.54, 0, 0.54].map((x, index) => (
          <mesh key={x} position={[x, index * 0.12, 0]} rotation={[0, 0, index * 0.08]}>
            <boxGeometry args={[0.42, 3.65, 0.08]} />
            <meshStandardMaterial
              color={index === 1 ? "#6d2d2d" : "#4a3030"}
              roughness={0.86}
            />
          </mesh>
        ))}
      </group>
      <spotLight
        position={[-4.8, 3.8, 1.8]}
        color="#e0c5ab"
        intensity={2.4}
        angle={0.26}
        penumbra={0.88}
        distance={10}
      />
    </>
  );
}

function SceneDetails({ character }: { character: CharacterProfile }) {
  switch (character.id) {
    case "einstein":
      return (
        <>
          <LaboratorySet accent={character.accent} />
          <EinsteinArtifacts accent={character.accent} />
        </>
      );
    case "epstein":
      return (
        <>
          <ConcreteSet />
          <EpsteinArtifacts />
        </>
      );
    case "hawking":
      return (
        <>
          <CosmosSet accent={character.accent} />
          <HawkingArtifacts accent={character.accent} />
        </>
      );
    case "sheikh-said":
      return (
        <>
          <HistoricSet />
          <SheikhSaidArtifacts />
        </>
      );
    case "cartman":
      return (
        <>
          <ParodySet />
          <CartmanArtifacts />
        </>
      );
    case "hitler":
      return (
        <>
          <ConcreteSet />
          <HitlerArtifacts />
        </>
      );
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
          gl.localClippingEnabled = true;
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
            {character.id === "hitler" || character.id === "sheikh-said" ? (
              <ImportedCharacterRig
                character={character}
                mode={mode}
                step={correct}
                feedbackNonce={feedbackNonce}
                lastCorrect={lastCorrect}
                animationEnabled={animationEnabled}
                preview={preview}
              />
            ) : (
              <CharacterRig
                character={character}
                mode={mode}
                step={correct}
                feedbackNonce={feedbackNonce}
                lastCorrect={lastCorrect}
                animationEnabled={animationEnabled}
              />
            )}
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
