import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import {
  AnimationUtils,
  AnimationMixer,
  Group,
  LoopPingPong,
  LoopRepeat,
  MathUtils,
  Mesh,
  Object3D,
  Vector3,
} from "three";
import type { AnimationClip, Material } from "three";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";
import type {
  CharacterId,
  CharacterProfile,
  StageMode,
} from "../types/game";

type ImportedCharacterId = Extract<CharacterId, "hitler" | "sheikh-said">;
type SegmentId =
  | "head"
  | "torso"
  | "left-arm"
  | "right-arm"
  | "left-leg"
  | "right-leg";

interface ImportedCharacterRigProps {
  character: CharacterProfile;
  mode: StageMode;
  step: number;
  feedbackNonce: number;
  lastCorrect: boolean | null;
  animationEnabled?: boolean;
  preview?: boolean;
}

interface ImportedModelProfile {
  idleUrl: string;
  strangulationUrl: string;
  position: [number, number, number];
  scale: number;
  rotationY: number;
}

type ModelAnimation = "idle" | "strangulation" | "none";

const fallbackNeckPositions: Record<
  ImportedCharacterId,
  [number, number, number]
> = {
  hitler: [0, 1.18, 0.48],
  "sheikh-said": [0, 1.08, 0.48],
};

const nooseRadius: Record<ImportedCharacterId, number> = {
  hitler: 0.21,
  "sheikh-said": 0.24,
};

const skinComponents = ["x", "y", "z", "w"] as const;

function boneWeightExpression(boneIndices: readonly number[]) {
  return skinComponents
    .map(
      (component) =>
        `((${boneIndices
          .map((index) => `skinIndex.${component} == ${index}.0`)
          .join(" || ")}) ? skinWeight.${component} : 0.0)`,
    )
    .join(" + ");
}

const headWeight = boneWeightExpression([20, 21, 22, 23]);
const torsoWeight = boneWeightExpression([0, 9, 10, 11]);
const leftArmWeight = boneWeightExpression([12, 13, 14, 15]);
const rightArmWeight = boneWeightExpression([16, 17, 18, 19]);

const importedModelProfiles: Record<ImportedCharacterId, ImportedModelProfile> = {
  hitler: {
    idleUrl: "/models/hitler-idle.glb",
    strangulationUrl: "/models/hitler-strangulation.glb",
    position: [0, -2.08, 0.28],
    scale: 2.18,
    rotationY: 0,
  },
  "sheikh-said": {
    idleUrl: "/models/sheikh-said-idle.glb",
    strangulationUrl: "/models/sheikh-said-strangulation.glb",
    position: [0, -2.08, 0.28],
    scale: 2.18,
    rotationY: 0,
  },
};

const segments: readonly {
  id: SegmentId;
  step: number;
  expression: string;
}[] = [
  {
    id: "head",
    step: 1,
    expression: `(${headWeight}) > 0.2 && vRigPosition.y >= 1.22`,
  },
  {
    id: "torso",
    step: 2,
    expression: `(${torsoWeight}) > 0.2 && vRigPosition.y >= 0.7 && vRigPosition.y < 1.4`,
  },
  {
    id: "left-arm",
    step: 3,
    expression: `(${leftArmWeight}) > 0.2`,
  },
  {
    id: "right-arm",
    step: 4,
    expression: `(${rightArmWeight}) > 0.2`,
  },
  {
    id: "left-leg",
    step: 5,
    expression: "vRigPosition.y < 0.72 && vRigPosition.x < 0.0",
  },
  {
    id: "right-leg",
    step: 6,
    expression: "vRigPosition.y < 0.72 && vRigPosition.x >= 0.0",
  },
] as const;

function configureMaterial(
  source: Material,
  segment?: (typeof segments)[number],
  ghost = false,
) {
  const material = source.clone();
  if (ghost) {
    material.transparent = true;
    material.opacity = 0.1;
    material.depthWrite = false;
  }
  if (!segment) return material;

  material.onBeforeCompile = (shader) => {
    shader.vertexShader = `varying vec3 vRigPosition;\nvarying float vRigVisible;\n${shader.vertexShader}`.replace(
      "#include <begin_vertex>",
      `vRigPosition = position;\nvRigVisible = (${segment.expression}) ? 1.0 : 0.0;\n#include <begin_vertex>`,
    );
    shader.fragmentShader = `varying vec3 vRigPosition;\nvarying float vRigVisible;\n${shader.fragmentShader}`.replace(
      "#include <clipping_planes_fragment>",
      "#include <clipping_planes_fragment>\nif (vRigVisible < 0.5) discard;",
    );
  };
  material.customProgramCacheKey = () => `character-segment-${segment.id}`;
  material.needsUpdate = true;
  return material;
}

function prepareModel(
  source: Group,
  segment?: (typeof segments)[number],
  ghost = false,
) {
  const model = cloneSkeleton(source) as Group;
  model.traverse((object: Object3D) => {
    const mesh = object as Mesh;
    if (!mesh.isMesh) return;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    mesh.material = Array.isArray(mesh.material)
      ? mesh.material.map((material) =>
          configureMaterial(material, segment, ghost),
        )
      : configureMaterial(mesh.material, segment, ghost);
  });
  return model;
}

function AnimatedModel({
  source,
  animations,
  segment,
  animation,
  ghost = false,
  trackNeck = false,
  onNeckPosition,
}: {
  source: Group;
  animations: AnimationClip[];
  segment?: (typeof segments)[number];
  animation: ModelAnimation;
  ghost?: boolean;
  trackNeck?: boolean;
  onNeckPosition?: (position: Vector3) => void;
}) {
  const model = useMemo(
    () => prepareModel(source, segment, ghost),
    [ghost, segment, source],
  );
  const mixer = useMemo(() => new AnimationMixer(model), [model]);
  const neckWorld = useMemo(() => new Vector3(), []);
  const neckBone = useMemo(() => model.getObjectByName("neck"), [model]);
  const animationClip = useMemo(() => {
    const sourceClip = animations[0];
    if (!sourceClip || animation === "none") return null;
    if (animation === "strangulation") {
      // The source clip falls to the floor after roughly 3.1 seconds. Keeping
      // frames 14-91 preserves the airborne struggle and removes that fall.
      return AnimationUtils.subclip(
        sourceClip,
        `${sourceClip.name}-airborne-struggle`,
        14,
        91,
        30,
      );
    }
    return sourceClip;
  }, [animation, animations]);

  useEffect(
    () => () => {
      model.traverse((object: Object3D) => {
        const mesh = object as Mesh;
        if (!mesh.isMesh) return;
        const materials = Array.isArray(mesh.material)
          ? mesh.material
          : [mesh.material];
        materials.forEach((material) => material.dispose());
      });
    },
    [model],
  );

  useEffect(() => {
    if (!animationClip) return;
    const action = mixer.clipAction(animationClip);
    action.stop();
    mixer.setTime(0);
    action.reset();
    action.setLoop(
      animation === "strangulation" ? LoopPingPong : LoopRepeat,
      Number.POSITIVE_INFINITY,
    );
    action.clampWhenFinished = false;
    action.play();
    return () => {
      action.stop();
      mixer.stopAllAction();
    };
  }, [animation, animationClip, mixer]);

  useFrame((_, delta) => {
    if (animationClip) mixer.update(Math.min(delta, 0.05));
    if (!trackNeck || !neckBone || !onNeckPosition) return;
    model.updateWorldMatrix(true, true);
    neckBone.getWorldPosition(neckWorld);
    onNeckPosition(neckWorld);
  });

  return <primitive object={model} />;
}

function TrackedNooseHalf({
  front,
  radius,
}: {
  front: boolean;
  radius: number;
}) {
  return (
    <group
      position={[0, 0, front ? 0.19 : -0.19]}
      rotation={[0, 0, front ? Math.PI : 0]}
    >
      {[-0.012, 0, 0.012].map((offset, index) => (
        <mesh key={offset} castShadow>
          <torusGeometry args={[radius + offset, 0.018, 10, 52, Math.PI]} />
          <meshStandardMaterial
            color={index === 1 ? "#b99560" : "#86623a"}
            roughness={0.95}
          />
        </mesh>
      ))}
    </group>
  );
}

function TrackedNoose({
  characterId,
  neckWorldTarget,
  hasNeckTarget,
  mode,
  step,
}: {
  characterId: ImportedCharacterId;
  neckWorldTarget: React.RefObject<Vector3>;
  hasNeckTarget: React.RefObject<boolean>;
  mode: StageMode;
  step: number;
}) {
  const noose = useRef<Group>(null);
  const cord = useRef<Group>(null);
  const release = useRef(0);
  const localTargetRef = useRef(new Vector3());
  const cordTopRef = useRef(new Vector3(0.27, 2.9, 0.5));
  const cordBottomRef = useRef(new Vector3());
  const cordDirectionRef = useRef(new Vector3());
  const cordMidpointRef = useRef(new Vector3());
  const verticalAxisRef = useRef(new Vector3(0, 1, 0));
  const radius = nooseRadius[characterId];

  useFrame((_, delta) => {
    if (!noose.current?.parent || !cord.current) return;
    const localTarget = localTargetRef.current;
    const cordTop = cordTopRef.current;
    const cordBottom = cordBottomRef.current;
    const cordDirection = cordDirectionRef.current;
    const cordMidpoint = cordMidpointRef.current;
    const verticalAxis = verticalAxisRef.current;
    const released = mode === "rescue" && step >= 6;
    release.current = MathUtils.damp(
      release.current,
      released ? 1 : 0,
      5,
      delta,
    );

    if (hasNeckTarget.current) {
      noose.current.parent.updateWorldMatrix(true, false);
      localTarget.copy(neckWorldTarget.current);
      noose.current.parent.worldToLocal(localTarget);
    } else {
      localTarget.fromArray(fallbackNeckPositions[characterId]);
    }

    localTarget.y += release.current * 2.3;
    noose.current.position.copy(localTarget);

    cordBottom.set(
      localTarget.x + radius * 0.82,
      localTarget.y + radius * 0.52,
      localTarget.z + 0.16,
    );
    cordDirection.copy(cordBottom).sub(cordTop);
    const cordLength = Math.max(cordDirection.length(), 0.001);
    cordMidpoint.copy(cordTop).add(cordBottom).multiplyScalar(0.5);
    cord.current.position.copy(cordMidpoint);
    cord.current.quaternion.setFromUnitVectors(
      verticalAxis,
      cordDirection.normalize(),
    );
    cord.current.scale.set(1, cordLength, 1);
  });

  return (
    <group>
      <group ref={cord}>
        {[-0.018, 0, 0.018].map((offset, index) => (
          <mesh key={offset} position={[offset, 0, 0]} castShadow>
            <cylinderGeometry args={[0.017, 0.017, 1, 10]} />
            <meshStandardMaterial
              color={index === 1 ? "#b99560" : "#86623a"}
              roughness={0.97}
            />
          </mesh>
        ))}
      </group>
      <group ref={noose}>
        <TrackedNooseHalf front={false} radius={radius} />
        <TrackedNooseHalf front radius={radius} />
        <mesh
          position={[radius * 0.82, radius * 0.52, 0.2]}
          rotation={[0, 0, 0.55]}
          castShadow
        >
          <torusKnotGeometry args={[0.075, 0.016, 56, 9, 2, 3]} />
          <meshStandardMaterial color="#87653d" roughness={0.96} />
        </mesh>
      </group>
    </group>
  );
}

function RevealedSegment({
  show,
  children,
}: {
  show: boolean;
  children: ReactNode;
}) {
  const group = useRef<Group>(null);
  const [initialShow] = useState(show);

  useLayoutEffect(() => {
    group.current?.scale.setScalar(initialShow ? 1 : 0.001);
  }, [initialShow]);

  useFrame((_, delta) => {
    if (!group.current) return;
    const target = show ? 1 : 0.001;
    const scale = MathUtils.damp(group.current.scale.x, target, 8.2, delta);
    group.current.scale.setScalar(scale);
    group.current.visible = show || scale > 0.006;
  });

  return <group ref={group}>{children}</group>;
}

export function ImportedCharacterRig({
  character,
  mode,
  step,
  feedbackNonce,
  lastCorrect,
  animationEnabled = true,
  preview = false,
}: ImportedCharacterRigProps) {
  const importedCharacterId = character.id as ImportedCharacterId;
  const profile = importedModelProfiles[importedCharacterId];
  const idleModel = useGLTF(profile.idleUrl);
  const strangulationModel = useGLTF(profile.strangulationUrl);
  const rig = useRef<Group>(null);
  const neckWorldTarget = useRef(new Vector3());
  const hasNeckTarget = useRef(false);
  const feedback = useRef(0);
  const finalElapsed = useRef(0);
  const rescue = mode === "rescue";
  const strangulationActive =
    mode === "execute" && step >= 6 && animationEnabled;
  const updateNeckTarget = useCallback((position: Vector3) => {
    neckWorldTarget.current.copy(position);
    hasNeckTarget.current = true;
  }, []);

  useEffect(() => {
    if (feedbackNonce > 0 && lastCorrect === true) feedback.current = 1;
  }, [feedbackNonce, lastCorrect]);

  useFrame((state, delta) => {
    if (!rig.current) return;
    feedback.current = MathUtils.damp(feedback.current, 0, 5.4, delta);
    finalElapsed.current =
      step >= 6 && animationEnabled ? finalElapsed.current + delta : 0;
    const finalReady = finalElapsed.current > 0.24;
    const rescueJump =
      rescue && finalReady
        ? Math.abs(Math.sin((finalElapsed.current - 0.24) * 4.1)) * 0.23
        : 0;
    const executeSway =
      strangulationActive && finalReady
        ? Math.sin(state.clock.elapsedTime * 1.7) * 0.065
        : 0;
    rig.current.position.y = MathUtils.damp(
      rig.current.position.y,
      profile.position[1] + rescueJump + feedback.current * 0.04,
      5,
      delta,
    );
    rig.current.rotation.z = MathUtils.damp(
      rig.current.rotation.z,
      executeSway,
      4.5,
      delta,
    );
  });

  return (
    <>
      <group
        ref={rig}
        position={profile.position}
        rotation={[0, profile.rotationY, 0]}
        scale={profile.scale}
      >
        {!preview && !rescue && !strangulationActive && step < 6 ? (
          <AnimatedModel
            source={idleModel.scene}
            animations={idleModel.animations}
            animation="idle"
            ghost
          />
        ) : null}
        {strangulationActive ? (
          <AnimatedModel
            source={strangulationModel.scene}
            animations={strangulationModel.animations}
            animation="strangulation"
            trackNeck
            onNeckPosition={updateNeckTarget}
          />
        ) : preview || rescue ? (
          <AnimatedModel
            source={idleModel.scene}
            animations={idleModel.animations}
            animation="idle"
            trackNeck
            onNeckPosition={updateNeckTarget}
          />
        ) : (
          segments.map((segment) => (
            <RevealedSegment key={segment.id} show={step >= segment.step}>
              <AnimatedModel
                source={idleModel.scene}
                animations={idleModel.animations}
                segment={segment}
                animation="idle"
                trackNeck={segment.id === "head" && step >= 1}
                onNeckPosition={updateNeckTarget}
              />
            </RevealedSegment>
          ))
        )}
      </group>
      <TrackedNoose
        characterId={importedCharacterId}
        neckWorldTarget={neckWorldTarget}
        hasNeckTarget={hasNeckTarget}
        mode={mode}
        step={step}
      />
    </>
  );
}

Object.values(importedModelProfiles).forEach((profile) => {
  useGLTF.preload(profile.idleUrl);
  useGLTF.preload(profile.strangulationUrl);
});
