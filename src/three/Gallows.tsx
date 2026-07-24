import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useRef } from "react";
import type { Group, Mesh } from "three";
import { MathUtils } from "three";
import type { CharacterId, StageMode } from "../types/game";

interface GallowsProps {
  mode: StageMode;
  step: number;
  characterId: CharacterId;
  feedbackNonce: number;
  lastCorrect: boolean | null;
  animationEnabled?: boolean;
}

const neckYByCharacter: Record<CharacterId, number> = {
  einstein: 0.72,
  epstein: 0.7,
  hawking: 0.66,
  "sheikh-said": 0.64,
  cartman: 0.4,
  hitler: 0.7,
};

function Bolt({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.07, 0.07, 0.06, 16]} />
      <meshStandardMaterial color="#667078" metalness={0.88} roughness={0.22} />
    </mesh>
  );
}

function StageRail({ x }: { x: number }) {
  return (
    <group position={[x, -1.15, -1.22]}>
      <mesh position={[0, 0.52, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 1.1, 12]} />
        <meshStandardMaterial color="#3b4148" metalness={0.74} roughness={0.3} />
      </mesh>
      <mesh position={[0, 1.02, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.035, 0.035, 1.4, 12]} />
        <meshStandardMaterial color="#3b4148" metalness={0.74} roughness={0.3} />
      </mesh>
    </group>
  );
}

function NooseHalf({
  front,
  radius,
}: {
  front: boolean;
  radius: number;
}) {
  return (
    <group
      position={[0, 0, front ? 0.84 : 0.52]}
      rotation={[0, 0, front ? Math.PI : 0]}
    >
      {[-0.012, 0, 0.012].map((offset, index) => (
        <mesh key={offset} castShadow>
          <torusGeometry
            args={[radius + offset, 0.018, 10, 48, Math.PI]}
          />
          <meshStandardMaterial
            color={index === 1 ? "#b99560" : "#8d6a3f"}
            roughness={0.95}
          />
        </mesh>
      ))}
    </group>
  );
}

export function Gallows({
  mode,
  step,
  characterId,
  feedbackNonce,
  lastCorrect,
  animationEnabled = true,
}: GallowsProps) {
  const stage = useRef<Group>(null);
  const trapdoorLeft = useRef<Group>(null);
  const trapdoorRight = useRef<Group>(null);
  const rope = useRef<Group>(null);
  const ropeLoop = useRef<Group>(null);
  const knot = useRef<Mesh>(null);
  const lever = useRef<Group>(null);
  const feedback = useRef(0);
  const finalElapsed = useRef(0);
  const neckY = neckYByCharacter[characterId];

  useLayoutEffect(() => {
    ropeLoop.current?.scale.setScalar(mode === "execute" ? 1.02 : 0.92);
  }, [mode]);

  useEffect(() => {
    if (feedbackNonce > 0 && lastCorrect === true) feedback.current = 1;
  }, [feedbackNonce, lastCorrect]);

  useFrame((state, delta) => {
    feedback.current = MathUtils.damp(feedback.current, 0, 5.2, delta);
    finalElapsed.current =
      step >= 6 && animationEnabled ? finalElapsed.current + delta : 0;
    const finalReady = finalElapsed.current >= 0.9;

    if (stage.current) {
      stage.current.position.x = MathUtils.damp(
        stage.current.position.x,
        0,
        8,
        delta,
      );
    }

    if (trapdoorLeft.current && trapdoorRight.current) {
      const target = mode === "execute" && finalReady ? 1.18 : 0;
      trapdoorLeft.current.rotation.z = MathUtils.damp(
        trapdoorLeft.current.rotation.z,
        target,
        5.4,
        delta,
      );
      trapdoorRight.current.rotation.z = MathUtils.damp(
        trapdoorRight.current.rotation.z,
        -target,
        5.4,
        delta,
      );
    }

    if (rope.current) {
      rope.current.position.y = MathUtils.damp(
        rope.current.position.y,
        mode === "rescue" && step >= 6 ? 4.1 : 0,
        4.8,
        delta,
      );
      rope.current.rotation.z =
        Math.sin(state.clock.elapsedTime * 1.7) *
        (mode === "execute" && finalReady ? 0.065 : 0.006);
    }

    if (ropeLoop.current) {
      const executeTightness = 1.02 - Math.min(step, 6) * 0.035;
      const rescueReleased = step >= 6;
      const target = mode === "execute" ? executeTightness : rescueReleased ? 1.5 : 0.92;
      const next = MathUtils.damp(
        ropeLoop.current.scale.x,
        target,
        4.8,
        delta,
      );
      ropeLoop.current.scale.set(next, next, next);
      ropeLoop.current.position.y = MathUtils.damp(
        ropeLoop.current.position.y,
        neckY,
        4.8,
        delta,
      );
    }

    if (knot.current) {
      knot.current.rotation.y +=
        (lastCorrect === true ? 1.1 : 0.18) * feedback.current * delta;
    }

    if (lever.current) {
      const target =
        mode === "execute" && finalReady
          ? -0.92
          : Math.min(step, 5) * -0.055;
      lever.current.rotation.z = MathUtils.damp(
        lever.current.rotation.z,
        target - feedback.current * 0.08,
        7,
        delta,
      );
    }
  });

  const wood = mode === "execute" ? "#2d2118" : "#24282d";
  const cordLength = 2.9 - neckY;
  const cordCenter = neckY + cordLength / 2;

  return (
    <group ref={stage}>
      <RoundedBox args={[0.5, 5.9, 0.54]} radius={0.07} position={[-2.9, 0.18, 0]} castShadow>
        <meshPhysicalMaterial color={wood} roughness={0.74} clearcoat={0.05} />
      </RoundedBox>
      <RoundedBox args={[6.02, 0.5, 0.54]} radius={0.07} position={[0.02, 2.9, 0]} castShadow>
        <meshPhysicalMaterial color={wood} roughness={0.72} clearcoat={0.05} />
      </RoundedBox>
      <RoundedBox args={[5.35, 0.36, 3.28]} radius={0.08} position={[0, -2.1, 0]} receiveShadow>
        <meshPhysicalMaterial color="#201914" roughness={0.88} />
      </RoundedBox>

      {[-2.3, 2.3].map((x) => (
        <StageRail key={x} x={x} />
      ))}
      {[
        [-2.9, 2.63, 0.29],
        [-2.9, -2.28, 0.29],
        [2.78, 2.9, 0.29],
      ].map((position) => (
        <Bolt key={position.join("-")} position={position as [number, number, number]} />
      ))}

      <group ref={trapdoorLeft} position={[-1.09, -1.86, 0]}>
        <mesh position={[0.545, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.09, 0.18, 2.18]} />
          <meshPhysicalMaterial
            color="#3b291e"
            roughness={0.7}
            clearcoat={0.08}
          />
        </mesh>
      </group>
      <group ref={trapdoorRight} position={[1.09, -1.86, 0]}>
        <mesh position={[-0.545, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.09, 0.18, 2.18]} />
          <meshPhysicalMaterial
            color="#3b291e"
            roughness={0.7}
            clearcoat={0.08}
          />
        </mesh>
      </group>
      {[-0.94, 0.94].map((x) => (
        <mesh key={x} position={[x, -1.75, 0.82]}>
          <boxGeometry args={[0.05, 0.04, 0.48]} />
          <meshStandardMaterial color="#677078" metalness={0.92} roughness={0.18} />
        </mesh>
      ))}

      <group ref={rope}>
        <group position={[0, 0, 0.5]}>
          {[-0.018, 0, 0.018].map((x, index) => (
            <mesh
              key={x}
              position={[0.27 + x, cordCenter, 0]}
              rotation={[0, 0, (index - 1) * 0.018]}
              castShadow
            >
              <cylinderGeometry args={[0.017, 0.017, cordLength, 10]} />
              <meshStandardMaterial
                color={index === 1 ? "#b99560" : "#88663d"}
                roughness={0.97}
              />
            </mesh>
          ))}
        </group>
        <group ref={ropeLoop} position={[0, neckY, 0]}>
          <NooseHalf front={false} radius={0.28} />
          <NooseHalf front radius={0.28} />
          <mesh
            ref={knot}
            position={[0.255, 0.16, 0.86]}
            rotation={[0, 0, 0.55]}
            castShadow
          >
            <torusKnotGeometry args={[0.085, 0.018, 64, 9, 2, 3]} />
            <meshStandardMaterial color="#8c6b42" roughness={0.96} />
          </mesh>
        </group>
      </group>

      <group ref={lever} position={[2.58, 1.72, 0.2]}>
        <mesh rotation={[0, 0, -0.28]}>
          <cylinderGeometry args={[0.045, 0.045, 1.02, 14]} />
          <meshStandardMaterial color="#687179" metalness={0.86} roughness={0.22} />
        </mesh>
        <mesh position={[0.15, 0.46, 0]}>
          <sphereGeometry args={[0.12, 18, 14]} />
          <meshStandardMaterial
            color={step >= 6 ? "#d9b76c" : "#8d969c"}
            emissive={step > 0 ? "#80642c" : "#000000"}
            emissiveIntensity={Math.min(step / 6, 1) * 1.35}
          />
        </mesh>
      </group>
    </group>
  );
}
