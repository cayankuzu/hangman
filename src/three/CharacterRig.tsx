import { Image, RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { Group } from "three";
import { MathUtils } from "three";
import type {
  CharacterId,
  CharacterProfile,
  StageMode,
} from "../types/game";

interface CharacterRigProps {
  character: CharacterProfile;
  mode: StageMode;
  step: number;
  feedbackNonce: number;
  lastCorrect: boolean | null;
  animationEnabled?: boolean;
}

interface BodyProfile {
  height: number;
  torso: [number, number, number];
  torsoY: number;
  shoulder: number;
  armLength: number;
  legLength: number;
  headScale: [number, number];
  headY: number;
  headX?: number;
  headRotation?: number;
  coat: string;
  shirt: string;
  trousers: string;
  skin: string;
  build: "standing" | "seated" | "robe" | "round";
  headDepth: number;
  eyes: readonly [
    { x: number; y: number; scale: number },
    { x: number; y: number; scale: number },
  ];
}

const bodyProfiles: Record<CharacterId, BodyProfile> = {
  einstein: {
    height: 1,
    torso: [1.2, 1.58, 0.62],
    torsoY: -0.18,
    shoulder: 0.82,
    armLength: 1.5,
    legLength: 1.62,
    headScale: [1.62, 1.62],
    headY: 1.3,
    coat: "#4a4a48",
    shirt: "#b8b1a5",
    trousers: "#232629",
    skin: "#bca58c",
    build: "standing",
    headDepth: 0.39,
    eyes: [
      { x: -0.095, y: 0.15, scale: 0.78 },
      { x: 0.195, y: 0.15, scale: 0.78 },
    ],
  },
  epstein: {
    height: 1.04,
    torso: [1.43, 1.72, 0.68],
    torsoY: -0.15,
    shoulder: 0.92,
    armLength: 1.64,
    legLength: 1.76,
    headScale: [1.5, 1.64],
    headY: 1.32,
    coat: "#101923",
    shirt: "#202832",
    trousers: "#161a20",
    skin: "#c29c7c",
    build: "standing",
    headDepth: 0.36,
    eyes: [
      { x: -0.21, y: 0.265, scale: 0.72 },
      { x: 0.095, y: 0.265, scale: 0.72 },
    ],
  },
  hawking: {
    height: 0.93,
    torso: [1.1, 1.25, 0.58],
    torsoY: 0,
    shoulder: 0.72,
    armLength: 1.06,
    legLength: 1.1,
    headScale: [1.35, 1.7],
    headY: 1.19,
    headX: -0.04,
    headRotation: -0.08,
    coat: "#1d222a",
    shirt: "#444b55",
    trousers: "#20242a",
    skin: "#c5a98e",
    build: "seated",
    headDepth: 0.34,
    eyes: [
      { x: -0.07, y: 0.245, scale: 0.67 },
      { x: 0.2, y: 0.345, scale: 0.67 },
    ],
  },
  "sheikh-said": {
    height: 1,
    torso: [1.32, 1.62, 0.66],
    torsoY: -0.13,
    shoulder: 0.86,
    armLength: 1.55,
    legLength: 1.62,
    headScale: [1.58, 1.9],
    headY: 1.34,
    coat: "#ded8c9",
    shirt: "#f2ead8",
    trousers: "#28251f",
    skin: "#a98f73",
    build: "robe",
    headDepth: 0.36,
    eyes: [
      { x: -0.14, y: 0.285, scale: 0.7 },
      { x: 0.11, y: 0.285, scale: 0.7 },
    ],
  },
  cartman: {
    height: 0.76,
    torso: [1.76, 1.24, 0.86],
    torsoY: -0.33,
    shoulder: 1.02,
    armLength: 1.05,
    legLength: 0.72,
    headScale: [1.82, 1.82],
    headY: 1.05,
    coat: "#c43b37",
    shirt: "#f6cc2e",
    trousers: "#6e4b2f",
    skin: "#f1c99d",
    build: "round",
    headDepth: 0.48,
    eyes: [
      { x: -0.115, y: 0, scale: 0.72 },
      { x: 0.155, y: 0, scale: 0.72 },
    ],
  },
  hitler: {
    height: 1.02,
    torso: [1.34, 1.66, 0.65],
    torsoY: -0.16,
    shoulder: 0.88,
    armLength: 1.56,
    legLength: 1.68,
    headScale: [1.46, 1.62],
    headY: 1.33,
    coat: "#4a514f",
    shirt: "#c8c1af",
    trousers: "#242827",
    skin: "#b99b82",
    build: "standing",
    headDepth: 0.35,
    eyes: [
      { x: -0.13, y: 0.12, scale: 0.7 },
      { x: 0.205, y: 0.15, scale: 0.7 },
    ],
  },
};

function Limb({
  position,
  rotation,
  length,
  width,
  color,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  length: number;
  width: number;
  color: string;
}) {
  return (
    <mesh position={position} rotation={rotation} castShadow>
      <capsuleGeometry args={[width, length, 8, 14]} />
      <meshPhysicalMaterial
        color={color}
        roughness={0.72}
        clearcoat={0.08}
      />
    </mesh>
  );
}

function RestraintMotion({
  position,
  released,
  children,
}: {
  position: [number, number, number];
  released: boolean;
  children: ReactNode;
}) {
  const binding = useRef<Group>(null);
  const [origin] = useState(position);
  const [initialReleased] = useState(released);

  useLayoutEffect(() => {
    if (!binding.current) return;
    binding.current.scale.setScalar(initialReleased ? 0.001 : 1);
    binding.current.position.set(...origin);
  }, [initialReleased, origin]);

  useFrame((state, delta) => {
    if (!binding.current) return;
    const target = released ? 0.001 : 1;
    const next = MathUtils.damp(binding.current.scale.x, target, 5.2, delta);
    binding.current.scale.setScalar(next);
    binding.current.position.y = MathUtils.damp(
      binding.current.position.y,
      released ? origin[1] - 0.48 : origin[1],
      released ? 4.2 : 6.4,
      delta,
    );
    binding.current.rotation.y += (released ? 4.8 : 0.04) * delta;
    binding.current.rotation.z = MathUtils.damp(
      binding.current.rotation.z,
      released ? 0.9 : Math.sin(state.clock.elapsedTime * 0.9) * 0.012,
      5.5,
      delta,
    );
  });

  return (
    <group ref={binding} position={origin}>
      {children}
    </group>
  );
}

function LimbBinding({
  position,
  released,
  radius,
}: {
  position: [number, number, number];
  released: boolean;
  radius: number;
}) {
  return (
    <RestraintMotion position={position} released={released}>
      {[-0.055, 0, 0.055].map((y, index) => (
        <mesh
          key={y}
          position={[0, y, 0]}
          rotation={[Math.PI / 2, 0, index * 0.045]}
          castShadow
        >
          <torusGeometry args={[radius, 0.026, 14, 56]} />
          <meshStandardMaterial
            color={index === 1 ? "#b89562" : "#8f6e43"}
            roughness={0.92}
          />
        </mesh>
      ))}
      <mesh position={[radius * 0.72, 0.01, radius * 0.72]} castShadow>
        <torusKnotGeometry args={[0.07, 0.018, 56, 8, 2, 3]} />
        <meshStandardMaterial color="#8c683d" roughness={0.96} />
      </mesh>
      <mesh
        position={[radius * 0.78, -0.18, radius * 0.74]}
        rotation={[0, 0, -0.16]}
      >
        <cylinderGeometry args={[0.012, 0.016, 0.34, 10]} />
        <meshStandardMaterial color="#9d7949" roughness={0.95} />
      </mesh>
    </RestraintMotion>
  );
}

function TorsoBinding({
  position,
  released,
  radius,
}: {
  position: [number, number, number];
  released: boolean;
  radius: number;
}) {
  return (
    <RestraintMotion position={position} released={released}>
      {[-0.11, 0, 0.11].map((y, index) => (
        <mesh
          key={y}
          position={[0, y, 0]}
          rotation={[Math.PI / 2, 0, index * 0.035]}
          castShadow
        >
          <torusGeometry args={[radius, 0.03, 14, 72]} />
          <meshStandardMaterial
            color={index === 1 ? "#b89562" : "#8b683e"}
            roughness={0.93}
          />
        </mesh>
      ))}
      <mesh position={[radius * 0.58, 0, radius * 0.84]} castShadow>
        <torusKnotGeometry args={[0.095, 0.022, 64, 9, 2, 3]} />
        <meshStandardMaterial color="#846039" roughness={0.96} />
      </mesh>
    </RestraintMotion>
  );
}

function RevealGroup({
  show,
  children,
  position = [0, 0, 0],
}: {
  show: boolean;
  children: ReactNode;
  position?: [number, number, number];
}) {
  const group = useRef<Group>(null);
  const [initialShow] = useState(show);

  useLayoutEffect(() => {
    group.current?.scale.setScalar(initialShow ? 1 : 0.001);
  }, [initialShow]);

  useFrame((_, delta) => {
    if (!group.current) return;
    const next = MathUtils.damp(
      group.current.scale.x,
      show ? 1 : 0.001,
      show ? 7.4 : 10,
      delta,
    );
    group.current.scale.setScalar(next);
  });

  return (
    <group ref={group} position={position}>
      {children}
    </group>
  );
}

function WheelchairWheel({ x }: { x: number }) {
  return (
    <group
      position={[x, -0.58, -0.12]}
      rotation={[0, Math.PI / 2, 0]}
    >
      <mesh castShadow>
        <torusGeometry args={[0.6, 0.075, 20, 64]} />
        <meshPhysicalMaterial
          color="#11161b"
          roughness={0.68}
          clearcoat={0.12}
        />
      </mesh>
      <mesh position={[0, 0, 0.035]}>
        <torusGeometry args={[0.52, 0.026, 14, 64]} />
        <meshStandardMaterial
          color="#a9b4bc"
          metalness={0.94}
          roughness={0.15}
        />
      </mesh>
      <mesh position={[0, 0, 0.095]}>
        <torusGeometry args={[0.47, 0.018, 12, 64]} />
        <meshStandardMaterial
          color="#d1d8dc"
          metalness={0.96}
          roughness={0.1}
        />
      </mesh>
      {Array.from({ length: 12 }, (_, index) => (
        <mesh
          key={index}
          position={[0, 0, 0.045]}
          rotation={[0, 0, (Math.PI * index) / 6]}
        >
          <boxGeometry args={[0.012, 1.01, 0.012]} />
          <meshStandardMaterial
            color="#77838b"
            metalness={0.9}
            roughness={0.2}
          />
        </mesh>
      ))}
      <mesh position={[0, 0, 0.075]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.105, 0.105, 0.14, 24]} />
        <meshStandardMaterial
          color="#bec6cb"
          metalness={0.94}
          roughness={0.12}
        />
      </mesh>
    </group>
  );
}

function Wheelchair() {
  return (
    <group position={[0, -0.48, -0.03]}>
      <RoundedBox
        args={[1.42, 0.22, 1.12]}
        radius={0.09}
        position={[0, -0.23, -0.02]}
        castShadow
      >
        <meshPhysicalMaterial
          color="#252d35"
          roughness={0.35}
          metalness={0.4}
          clearcoat={0.18}
        />
      </RoundedBox>
      <RoundedBox
        args={[1.26, 1.42, 0.24]}
        radius={0.09}
        position={[0, 0.56, -0.47]}
        rotation={[-0.1, 0, 0]}
        castShadow
      >
        <meshPhysicalMaterial
          color="#1e252c"
          roughness={0.48}
          clearcoat={0.08}
        />
      </RoundedBox>
      <RoundedBox
        args={[1.1, 0.18, 0.36]}
        radius={0.07}
        position={[0, 1.28, -0.47]}
        castShadow
      >
        <meshPhysicalMaterial color="#272f37" roughness={0.45} />
      </RoundedBox>

      <WheelchairWheel x={-0.81} />
      <WheelchairWheel x={0.81} />

      {[-0.58, 0.58].map((x) => (
        <group key={`caster-${x}`} position={[x, -1.12, 0.53]}>
          <mesh rotation={[0, Math.PI / 2, 0]} castShadow>
            <torusGeometry args={[0.17, 0.045, 14, 32]} />
            <meshStandardMaterial
              color="#171c20"
              roughness={0.62}
              metalness={0.32}
            />
          </mesh>
          <mesh
            position={[x > 0 ? -0.12 : 0.12, 0.22, -0.04]}
            rotation={[0, 0, x > 0 ? -0.36 : 0.36]}
          >
            <boxGeometry args={[0.055, 0.58, 0.055]} />
            <meshStandardMaterial
              color="#8d989f"
              metalness={0.9}
              roughness={0.18}
            />
          </mesh>
        </group>
      ))}

      {[-0.7, 0.7].map((x) => (
        <group key={`frame-${x}`}>
          <mesh
            position={[x, -0.22, 0.12]}
            rotation={[0.58, 0, 0]}
            castShadow
          >
            <cylinderGeometry args={[0.035, 0.035, 1.55, 16]} />
            <meshStandardMaterial
              color="#a2adb4"
              metalness={0.92}
              roughness={0.18}
            />
          </mesh>
          <RoundedBox
            args={[0.14, 0.1, 0.83]}
            radius={0.04}
            position={[x, 0.18, 0.1]}
            castShadow
          >
            <meshPhysicalMaterial
              color="#20272d"
              roughness={0.42}
              clearcoat={0.1}
            />
          </RoundedBox>
        </group>
      ))}

      <RoundedBox
        args={[1.12, 0.1, 0.4]}
        radius={0.04}
        position={[0, -1.1, 0.67]}
        castShadow
      >
        <meshPhysicalMaterial
          color="#252d34"
          metalness={0.48}
          roughness={0.36}
        />
      </RoundedBox>
      <RoundedBox
        args={[0.62, 0.35, 0.5]}
        radius={0.06}
        position={[0, -0.65, -0.55]}
        castShadow
      >
        <meshPhysicalMaterial
          color="#11171c"
          metalness={0.38}
          roughness={0.5}
        />
      </RoundedBox>
      <mesh position={[0.76, 0.35, 0.42]} castShadow>
        <boxGeometry args={[0.2, 0.1, 0.26]} />
        <meshStandardMaterial
          color="#a9c7dc"
          emissive="#315b78"
          emissiveIntensity={1.25}
        />
      </mesh>
      <mesh position={[0.76, 0.45, 0.4]}>
        <sphereGeometry args={[0.045, 14, 10]} />
        <meshStandardMaterial color="#d5b36d" emissive="#9a6e25" emissiveIntensity={1.4} />
      </mesh>

      {[-0.67, 0.67].map((x) => (
        <group key={`handle-${x}`} position={[x, 1.16, -0.5]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 0.38, 14]} />
            <meshStandardMaterial
              color="#8e999f"
              metalness={0.9}
              roughness={0.2}
            />
          </mesh>
          <mesh
            position={[0, 0.17, -0.13]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[0.05, 0.05, 0.3, 14]} />
            <meshStandardMaterial color="#1c2228" roughness={0.64} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function CharacterRig({
  character,
  mode,
  step,
  feedbackNonce,
  lastCorrect,
  animationEnabled = true,
}: CharacterRigProps) {
  const rig = useRef<Group>(null);
  const leftArm = useRef<Group>(null);
  const rightArm = useRef<Group>(null);
  const leftLeg = useRef<Group>(null);
  const rightLeg = useRef<Group>(null);
  const finalFace = useRef<Group>(null);
  const feedback = useRef(0);
  const finalElapsed = useRef(0);
  const profile = bodyProfiles[character.id];
  const isSeated = profile.build === "seated";
  const isRound = profile.build === "round";
  const isRobe = profile.build === "robe";
  const rescue = mode === "rescue";

  useEffect(() => {
    if (feedbackNonce > 0 && lastCorrect === true) feedback.current = 1;
  }, [feedbackNonce, lastCorrect]);

  useFrame((state, delta) => {
    if (!rig.current) return;
    feedback.current = MathUtils.damp(feedback.current, 0, 5.5, delta);
    finalElapsed.current =
      step >= 6 && animationEnabled ? finalElapsed.current + delta : 0;
    const finalReady = finalElapsed.current >= 0.9;
    const struggleEnergy =
      mode === "execute" && finalReady
        ? Math.max(0.18, 1 - (finalElapsed.current - 0.9) / 4.8)
        : 0;

    const finalDrop = mode === "execute" && finalReady ? -0.13 : 0;
    const chokingMotion =
      mode === "execute" && finalReady
        ? Math.sin(state.clock.elapsedTime * 12.5) *
          0.032 *
          struggleEnergy
        : 0;
    const rescueJump =
      rescue && finalReady
        ? Math.abs(Math.sin((finalElapsed.current - 0.9) * 3.8)) * 0.48
        : 0;
    const correctLift = feedback.current * 0.045;

    rig.current.position.y = MathUtils.damp(
      rig.current.position.y,
      finalDrop + rescueJump + correctLift + chokingMotion,
      4.2,
      delta,
    );
    rig.current.position.x = MathUtils.damp(
      rig.current.position.x,
      rescue && finalReady
        ? Math.sin((finalElapsed.current - 0.9) * 1.9) * 0.11
        : 0,
      4.2,
      delta,
    );
    const finalSway =
      mode === "execute" && finalReady
        ? Math.sin(state.clock.elapsedTime * 1.72) * 0.085 +
          Math.sin(state.clock.elapsedTime * 10.8) *
            0.012 *
            struggleEnergy
        : rescue && finalReady
          ? Math.sin(state.clock.elapsedTime * 3.4) * 0.035
        : Math.sin(state.clock.elapsedTime * 1.15) * 0.006;
    rig.current.rotation.z = MathUtils.damp(
      rig.current.rotation.z,
      finalSway,
      4,
      delta,
    );
    const scale = profile.height * (1 + feedback.current * 0.018);
    rig.current.scale.setScalar(scale);

    if (finalFace.current) {
      const target = mode === "execute" && finalReady ? 1 : 0.001;
      const facePulse =
        mode === "execute" && finalReady
          ? 1 + Math.sin(state.clock.elapsedTime * 8.4) * 0.025 * struggleEnergy
          : 1;
      const next =
        MathUtils.damp(finalFace.current.scale.x, target, 8, delta) * facePulse;
      finalFace.current.scale.setScalar(next);
      // The death overlay lives inside the head group. Keeping its local
      // rotation fixed makes the red eye marks follow the exact head sway
      // instead of appearing to slide over the portrait.
      finalFace.current.rotation.z = 0;
    }

    if (leftArm.current) {
      leftArm.current.rotation.z = MathUtils.damp(
        leftArm.current.rotation.z,
        rescue && finalReady
          ? -1.05 + Math.sin(state.clock.elapsedTime * 5.1) * 0.18
          : rescue && step >= 3
            ? -0.58
            : mode === "execute" && finalReady
              ? -0.08 +
                Math.sin(state.clock.elapsedTime * 9.4) *
                  0.08 *
                  struggleEnergy
            : 0,
        5.5,
        delta,
      );
    }
    if (rightArm.current) {
      rightArm.current.rotation.z = MathUtils.damp(
        rightArm.current.rotation.z,
        rescue && finalReady
          ? 1.05 - Math.sin(state.clock.elapsedTime * 5.1) * 0.18
          : rescue && step >= 4
            ? 0.58
            : mode === "execute" && finalReady
              ? 0.08 -
                Math.sin(state.clock.elapsedTime * 9.4) *
                  0.08 *
                  struggleEnergy
            : 0,
        5.5,
        delta,
      );
    }
    if (leftLeg.current) {
      leftLeg.current.position.x = MathUtils.damp(
        leftLeg.current.position.x,
        rescue && step >= 1 ? -0.48 : -0.34,
        5.5,
        delta,
      );
      leftLeg.current.rotation.z = MathUtils.damp(
        leftLeg.current.rotation.z,
        mode === "execute" && finalReady
          ? Math.sin(state.clock.elapsedTime * 8.6) *
              0.045 *
              struggleEnergy
          : 0,
        5.5,
        delta,
      );
    }
    if (rightLeg.current) {
      rightLeg.current.position.x = MathUtils.damp(
        rightLeg.current.position.x,
        rescue && step >= 2 ? 0.48 : 0.34,
        5.5,
        delta,
      );
      rightLeg.current.rotation.z = MathUtils.damp(
        rightLeg.current.rotation.z,
        mode === "execute" && finalReady
          ? -Math.sin(state.clock.elapsedTime * 8.6) *
              0.045 *
              struggleEnergy
          : 0,
        5.5,
        delta,
      );
    }
  });

  const armY = isSeated ? 0 : -0.2;
  const releaseLeftWrist = rescue && step >= 3;
  const releaseRightWrist = rescue && step >= 4;
  const releaseLeftAnkle = rescue && step >= 1;
  const releaseRightAnkle = rescue && step >= 2;
  const releaseTorso = rescue && step >= 5;
  const showHead = rescue || step >= 1;
  const showTorso = rescue || step >= 2;
  const showLeftArm = rescue || step >= 3;
  const showRightArm = rescue || step >= 4;
  const showLeftLeg = rescue || step >= 5;
  const showRightLeg = rescue || step >= 6;

  return (
    <group ref={rig} position={[0, isSeated ? -0.02 : 0, 0.14]} scale={profile.height}>
      <RevealGroup show={showTorso}>
        {isSeated ? <Wheelchair /> : null}

        {isRobe ? (
          <mesh position={[0, -0.75, 0]} castShadow>
            <cylinderGeometry args={[0.55, 0.93, 2.65, 28]} />
            <meshPhysicalMaterial color={profile.coat} roughness={0.9} sheen={0.2} />
          </mesh>
        ) : isRound ? (
          <mesh position={[0, -0.42, 0]} castShadow scale={[1.1, 0.9, 0.82]}>
            <sphereGeometry args={[0.82, 36, 28]} />
            <meshPhysicalMaterial color={profile.coat} roughness={0.64} clearcoat={0.12} />
          </mesh>
        ) : (
          <RoundedBox
            args={profile.torso}
            radius={0.22}
            position={[0, profile.torsoY, 0]}
            castShadow
          >
            <meshPhysicalMaterial color={profile.coat} roughness={0.66} sheen={0.22} />
          </RoundedBox>
        )}

        {!isRound && !isRobe ? (
          <>
            <mesh position={[0, profile.torsoY + 0.21, 0.35]}>
              <boxGeometry args={[0.3, 0.88, 0.045]} />
              <meshStandardMaterial color={profile.shirt} roughness={0.78} />
            </mesh>
            {[-1, 1].map((side) => (
              <mesh
                key={side}
                position={[side * 0.21, profile.torsoY + 0.33, 0.4]}
                rotation={[0, 0, side * 0.34]}
              >
                <boxGeometry args={[0.24, 0.72, 0.045]} />
                <meshStandardMaterial color={profile.coat} roughness={0.68} />
              </mesh>
            ))}
            <mesh position={[0, profile.torsoY + 0.17, 0.41]}>
              <boxGeometry args={[0.075, 0.55, 0.035]} />
              <meshStandardMaterial color={character.id === "einstein" ? "#5e4941" : "#252a31"} />
            </mesh>
            <mesh position={[0, profile.torsoY + 0.52, 0.42]}>
              <octahedronGeometry args={[0.095, 0]} />
              <meshStandardMaterial color={character.id === "einstein" ? "#5e4941" : "#252a31"} />
            </mesh>
          </>
        ) : isRound ? (
          <mesh position={[0, -0.36, 0.72]}>
            <boxGeometry args={[0.95, 0.12, 0.04]} />
            <meshStandardMaterial color={profile.shirt} roughness={0.62} />
          </mesh>
        ) : null}
      </RevealGroup>

      <RevealGroup show={showHead}>
        <group
          position={[profile.headX ?? 0, profile.headY, 0.51]}
          rotation={[0, 0, profile.headRotation ?? 0]}
        >
          <mesh
            position={[
              0,
              -0.035,
              -(profile.headDepth + 0.12),
            ]}
            scale={[
              profile.headScale[0] * 0.38,
              profile.headScale[1] * 0.4,
              profile.headDepth,
            ]}
            castShadow
          >
            <sphereGeometry args={[1, 40, 32]} />
            <meshPhysicalMaterial
              color={profile.skin}
              roughness={0.64}
              clearcoat={0.08}
              sheen={0.12}
            />
          </mesh>
          <mesh
            position={[
              0,
              -profile.headScale[1] * 0.42,
              -0.46,
            ]}
            castShadow
          >
            <cylinderGeometry args={[0.2, 0.25, 0.42, 24]} />
            <meshPhysicalMaterial
              color={profile.skin}
              roughness={0.72}
            />
          </mesh>
          <Image
            url={character.sceneAvatar}
            scale={profile.headScale}
            transparent
            toneMapped={false}
            position={[0, 0, 0.02]}
          />
          <group ref={finalFace} position={[0, 0, 0.08]} scale={0.001}>
            <Image
              url={character.sceneAvatar}
              scale={profile.headScale}
              transparent
              toneMapped={false}
              color="#ef4f5a"
              opacity={0.28}
              position={[0, 0, 0.01]}
            />
            {profile.eyes.flatMap((eye, eyeIndex) =>
              [-Math.PI / 4, Math.PI / 4].map((rotation) => (
                <mesh
                  key={`${eyeIndex}-${rotation}`}
                  position={[eye.x, eye.y, 0.12]}
                  rotation={[0, 0, rotation]}
                  scale={eye.scale}
                >
                  <boxGeometry args={[0.052, 0.24, 0.025]} />
                  <meshBasicMaterial
                    color="#ff2638"
                    toneMapped={false}
                  />
                </mesh>
              )),
            )}
          </group>
        </group>
      </RevealGroup>

      <group ref={leftArm} position={[-profile.shoulder, armY, 0]}>
        <RevealGroup show={showLeftArm}>
          <Limb
            position={[0, 0, 0]}
            rotation={[0, 0, isRound ? -0.72 : -0.12]}
            length={profile.armLength}
            width={isRound ? 0.18 : 0.15}
            color={profile.coat}
          />
          <mesh position={[-0.06, -profile.armLength * 0.52, 0]} castShadow>
            <sphereGeometry args={[isRound ? 0.24 : 0.16, 18, 14]} />
            <meshStandardMaterial
              color={isRound ? "#f1cc2f" : profile.skin}
              roughness={0.78}
            />
          </mesh>
          {rescue ? (
            <LimbBinding
              position={[-0.06, -profile.armLength * 0.52, 0]}
              released={releaseLeftWrist}
              radius={isRound ? 0.27 : 0.19}
            />
          ) : null}
        </RevealGroup>
      </group>

      <group ref={rightArm} position={[profile.shoulder, armY, 0]}>
        <RevealGroup show={showRightArm}>
          <Limb
            position={[0, 0, 0]}
            rotation={[0, 0, isRound ? 0.72 : 0.12]}
            length={profile.armLength}
            width={isRound ? 0.18 : 0.15}
            color={profile.coat}
          />
          <mesh position={[0.06, -profile.armLength * 0.52, 0]} castShadow>
            <sphereGeometry args={[isRound ? 0.24 : 0.16, 18, 14]} />
            <meshStandardMaterial
              color={isRound ? "#f1cc2f" : profile.skin}
              roughness={0.78}
            />
          </mesh>
          {rescue ? (
            <LimbBinding
              position={[0.06, -profile.armLength * 0.52, 0]}
              released={releaseRightWrist}
              radius={isRound ? 0.27 : 0.19}
            />
          ) : null}
        </RevealGroup>
      </group>

      <group
        ref={leftLeg}
        position={[-0.34, isRound ? -1.02 : isSeated ? -0.82 : -1.28, 0]}
      >
        <RevealGroup show={showLeftLeg}>
          <Limb
            position={[0, 0, 0]}
            rotation={[0, 0, isSeated ? -0.22 : 0]}
            length={isSeated ? 0.55 : profile.legLength}
            width={isRound ? 0.2 : isSeated ? 0.14 : 0.19}
            color={profile.trousers}
          />
          <RoundedBox
            args={[isRound ? 0.62 : 0.5, 0.25, 0.82]}
            radius={0.11}
            position={[0, isRound ? -0.52 : isSeated ? -0.42 : -0.8, 0.16]}
            castShadow
          >
            <meshPhysicalMaterial color="#101318" roughness={0.54} clearcoat={0.18} />
          </RoundedBox>
          {rescue ? (
            <LimbBinding
              position={[0, isRound ? -0.22 : isSeated ? -0.12 : -0.25, 0]}
              released={releaseLeftAnkle}
              radius={isRound ? 0.27 : isSeated ? 0.17 : 0.22}
            />
          ) : null}
        </RevealGroup>
      </group>

      <group
        ref={rightLeg}
        position={[0.34, isRound ? -1.02 : isSeated ? -0.82 : -1.28, 0]}
      >
        <RevealGroup show={showRightLeg}>
          <Limb
            position={[0, 0, 0]}
            rotation={[0, 0, isSeated ? 0.22 : 0]}
            length={isSeated ? 0.55 : profile.legLength}
            width={isRound ? 0.2 : isSeated ? 0.14 : 0.19}
            color={profile.trousers}
          />
          <RoundedBox
            args={[isRound ? 0.62 : 0.5, 0.25, 0.82]}
            radius={0.11}
            position={[0, isRound ? -0.52 : isSeated ? -0.42 : -0.8, 0.16]}
            castShadow
          >
            <meshPhysicalMaterial color="#101318" roughness={0.54} clearcoat={0.18} />
          </RoundedBox>
          {rescue ? (
            <LimbBinding
              position={[0, isRound ? -0.22 : isSeated ? -0.12 : -0.25, 0]}
              released={releaseRightAnkle}
              radius={isRound ? 0.27 : isSeated ? 0.17 : 0.22}
            />
          ) : null}
        </RevealGroup>
      </group>

      {rescue ? (
        <TorsoBinding
          position={[0, profile.torsoY - 0.08, 0]}
          released={releaseTorso}
          radius={isRound ? 0.92 : isRobe ? 0.76 : profile.torso[0] * 0.54}
        />
      ) : null}

    </group>
  );
}
