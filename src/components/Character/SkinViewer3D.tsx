import { OrbitControls } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { isPortraitReady, portrait, waitForPortraitReady } from '@utils/portrait';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

interface SkinViewer3DProps {
  type: number;
  skin: number;
  tex1?: string | number | null;
  tex2?: string | number | null;
  width?: number | string;
  height?: number | string;
}

const parseTextureId = (value?: string | number | null): number => {
  if (value === null || value === undefined || value === '') return -1;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : -1;
};

type TextureRegion = {
  x: number;
  y: number;
  w: number;
  h: number;
};

const PART_REGIONS: Record<
  'head' | 'torso' | 'leftArm' | 'rightArm' | 'leftLeg' | 'rightLeg',
  TextureRegion
> = {
  head: { x: 0.29, y: 0.05, w: 0.42, h: 0.3 },
  torso: { x: 0.29, y: 0.35, w: 0.42, h: 0.27 },
  leftArm: { x: 0.06, y: 0.35, w: 0.22, h: 0.28 },
  rightArm: { x: 0.72, y: 0.35, w: 0.22, h: 0.28 },
  leftLeg: { x: 0.3, y: 0.63, w: 0.2, h: 0.3 },
  rightLeg: { x: 0.5, y: 0.63, w: 0.2, h: 0.3 }
};

const createRegionTexture = (source: THREE.Texture, region: TextureRegion): THREE.Texture => {
  const cloned = source.clone();
  cloned.needsUpdate = true;
  cloned.wrapS = THREE.ClampToEdgeWrapping;
  cloned.wrapT = THREE.ClampToEdgeWrapping;
  cloned.repeat.set(region.w, region.h);
  // Three texture Y axis starts at bottom; portrait regions are defined from top.
  cloned.offset.set(region.x, 1 - region.y - region.h);
  return cloned;
};

const PortraitVoxel: React.FC<{ imageUrl: string }> = ({ imageUrl }) => {
  const rigRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);

  const baseTexture = useMemo(() => {
    const loaded = new THREE.TextureLoader().load(imageUrl);
    loaded.magFilter = THREE.NearestFilter;
    loaded.minFilter = THREE.NearestFilter;
    loaded.generateMipmaps = false;
    return loaded;
  }, [imageUrl]);

  useEffect(() => {
    return () => baseTexture.dispose();
  }, [baseTexture]);

  const partTextures = useMemo(
    () => ({
      head: createRegionTexture(baseTexture, PART_REGIONS.head),
      torso: createRegionTexture(baseTexture, PART_REGIONS.torso),
      leftArm: createRegionTexture(baseTexture, PART_REGIONS.leftArm),
      rightArm: createRegionTexture(baseTexture, PART_REGIONS.rightArm),
      leftLeg: createRegionTexture(baseTexture, PART_REGIONS.leftLeg),
      rightLeg: createRegionTexture(baseTexture, PART_REGIONS.rightLeg)
    }),
    [baseTexture]
  );

  useEffect(() => {
    return () => Object.values(partTextures).forEach((texture) => texture.dispose());
  }, [partTextures]);

  useFrame((_state, delta) => {
    if (!rigRef.current) {
      return;
    }

    const t = performance.now() / 1000;
    const swing = Math.sin(t * 3.2) * 0.28;
    const bob = Math.sin(t * 2) * 0.03;

    rigRef.current.rotation.y += delta * 0.6;
    rigRef.current.position.y = bob;

    if (leftArmRef.current) leftArmRef.current.rotation.x = swing;
    if (rightArmRef.current) rightArmRef.current.rotation.x = -swing;
    if (leftLegRef.current) leftLegRef.current.rotation.x = -swing * 0.8;
    if (rightLegRef.current) rightLegRef.current.rotation.x = swing * 0.8;
  });

  const materials = useMemo(
    () => ({
      head: new THREE.MeshStandardMaterial({ map: partTextures.head, transparent: true }),
      torso: new THREE.MeshStandardMaterial({ map: partTextures.torso, transparent: true }),
      leftArm: new THREE.MeshStandardMaterial({ map: partTextures.leftArm, transparent: true }),
      rightArm: new THREE.MeshStandardMaterial({ map: partTextures.rightArm, transparent: true }),
      leftLeg: new THREE.MeshStandardMaterial({ map: partTextures.leftLeg, transparent: true }),
      rightLeg: new THREE.MeshStandardMaterial({ map: partTextures.rightLeg, transparent: true })
    }),
    [partTextures]
  );

  useEffect(() => {
    return () => Object.values(materials).forEach((material) => material.dispose());
  }, [materials]);

  return (
    <group ref={rigRef} position={[0, 0.15, 0]}>
      <mesh material={materials.head} position={[0, 0.95, 0]}>
        <boxGeometry args={[0.52, 0.52, 0.52]} />
      </mesh>

      <mesh material={materials.torso} position={[0, 0.35, 0]}>
        <boxGeometry args={[0.62, 0.72, 0.36]} />
      </mesh>

      <mesh ref={leftArmRef} material={materials.leftArm} position={[-0.45, 0.35, 0]}>
        <boxGeometry args={[0.22, 0.68, 0.22]} />
      </mesh>

      <mesh ref={rightArmRef} material={materials.rightArm} position={[0.45, 0.35, 0]}>
        <boxGeometry args={[0.22, 0.68, 0.22]} />
      </mesh>

      <mesh ref={leftLegRef} material={materials.leftLeg} position={[-0.16, -0.42, 0]}>
        <boxGeometry args={[0.24, 0.74, 0.24]} />
      </mesh>

      <mesh ref={rightLegRef} material={materials.rightLeg} position={[0.16, -0.42, 0]}>
        <boxGeometry args={[0.24, 0.74, 0.24]} />
      </mesh>
    </group>
  );
};

const SkinViewer3D: React.FC<SkinViewer3DProps> = ({
  type,
  skin,
  tex1,
  tex2,
  width = 260,
  height = 260
}) => {
  const [imageUrl, setImageUrl] = useState('');
  const resolvedWidth = typeof width === 'number' ? `${width}px` : width;
  const resolvedHeight = typeof height === 'number' ? `${height}px` : height;

  useEffect(() => {
    let active = true;

    const renderPortraitTexture = async () => {
      if (!isPortraitReady()) {
        await waitForPortraitReady();
      }

      const result = portrait(type, skin, parseTextureId(tex1), parseTextureId(tex2));
      if (active) {
        setImageUrl(result);
      }
    };

    renderPortraitTexture().catch((error) => {
      console.error('Failed to render 3D skin texture:', error);
      if (active) {
        setImageUrl('');
      }
    });

    return () => {
      active = false;
    };
  }, [type, skin, tex1, tex2]);

  if (!imageUrl) {
    return (
      <div
        style={{
          width: resolvedWidth,
          height: resolvedHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid var(--surface-border)',
          boxSizing: 'border-box'
        }}
      >
        Loading 3D skin...
      </div>
    );
  }

  return (
    <div
      style={{
        width: resolvedWidth,
        height: resolvedHeight,
        border: '1px solid var(--surface-border)',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}
    >
      <Canvas
        style={{ width: '100%', height: '100%', display: 'block' }}
        camera={{ position: [0, 0.2, 2.4], fov: 60 }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[2, 4, 3]} intensity={1.2} />
        <PortraitVoxel imageUrl={imageUrl} />
        <OrbitControls
          target={[0, 0.2, 0]}
          enablePan={false}
          enableDamping
          minDistance={1.5}
          maxDistance={4}
        />
      </Canvas>
    </div>
  );
};

export default SkinViewer3D;
