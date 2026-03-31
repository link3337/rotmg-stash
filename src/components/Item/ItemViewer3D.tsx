import { OrbitControls } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

interface ItemViewer3DProps {
  spriteX: number;
  spriteY: number;
  assetsBaseUrl: string;
  isShiny?: boolean;
  slotCount?: number;
  width?: number | string;
  height?: number | string;
}

const ITEM_TILE_SIZE = 40;
const ITEM_MODEL_SIZE = 0.74;
const ITEM_MODEL_DEPTH = 0.0001;

const SLOT_BACKGROUND_BY_COUNT: Record<number, string> = {
  0: 'radial-gradient(circle at 30% 20%, rgba(80, 120, 180, 0.2), rgba(10, 14, 22, 0.95) 65%)',
  1: 'radial-gradient(circle at 24% 14%, hsl(100, 91%, 36%) 0%, hsl(100, 42%, 38%) 58%, hsl(0, 0%, 36%) 100%)',
  2: 'radial-gradient(circle at 24% 14%, hsl(215, 50%, 50%) 0%, hsl(215, 44%, 38%) 58%, hsl(0, 0%, 36%) 100%)',
  3: 'radial-gradient(circle at 24% 14%, hsl(280, 50%, 50%) 0%, hsl(280, 42%, 38%) 58%, hsl(0, 0%, 36%) 100%)',
  4: 'radial-gradient(circle at 24% 14%, hsl(61, 81%, 61%) 0%, hsl(35, 62%, 40%) 58%, hsl(0, 0%, 36%) 100%)'
};

const createStarShape = (outerRadius: number, innerRadius: number, points = 5): THREE.Shape => {
  const shape = new THREE.Shape();
  const step = Math.PI / points;

  for (let i = 0; i < points * 2; i += 1) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = i * step - Math.PI / 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    if (i === 0) {
      shape.moveTo(x, y);
    } else {
      shape.lineTo(x, y);
    }
  }

  shape.closePath();
  return shape;
};

const createItemRegionTexture = (
  source: THREE.Texture,
  imageWidth: number,
  imageHeight: number,
  spriteX: number,
  spriteY: number
): THREE.Texture => {
  const cloned = source.clone();
  const tileWidth = ITEM_TILE_SIZE / imageWidth;
  const tileHeight = ITEM_TILE_SIZE / imageHeight;

  cloned.needsUpdate = true;
  cloned.wrapS = THREE.ClampToEdgeWrapping;
  cloned.wrapT = THREE.ClampToEdgeWrapping;
  cloned.repeat.set(tileWidth, tileHeight);
  cloned.offset.set(spriteX / imageWidth, 1 - (spriteY + ITEM_TILE_SIZE) / imageHeight);
  cloned.magFilter = THREE.NearestFilter;
  cloned.minFilter = THREE.NearestFilter;
  cloned.generateMipmaps = false;

  return cloned;
};

const ItemVoxel: React.FC<{ texture: THREE.Texture; isShiny: boolean }> = ({
  texture,
  isShiny
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const frontMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const backMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const rainbowFrameToggleRef = useRef(false);

  useFrame((_state, delta) => {
    if (!groupRef.current) {
      return;
    }

    const t = performance.now() / 1000;
    groupRef.current.rotation.y += delta * (isShiny ? 1.35 : 0.65);
    groupRef.current.rotation.x = Math.sin(t * (isShiny ? 2.5 : 1.35)) * (isShiny ? 0.16 : 0.08);
    groupRef.current.position.y = Math.sin(t * (isShiny ? 3.2 : 1.8)) * (isShiny ? 0.06 : 0.03);

    if (isShiny) {
      const scalePulse = 1 + Math.sin(t * 7.2) * 0.045;
      groupRef.current.scale.set(scalePulse, scalePulse, 1);
    }

    if (isShiny) {
      const pulse = 0.85 + Math.sin(t * 7.5) * 0.45;
      if (frontMaterialRef.current) {
        frontMaterialRef.current.emissiveIntensity = Math.max(0.25, pulse);
      }
      if (backMaterialRef.current) {
        backMaterialRef.current.emissiveIntensity = Math.max(0.2, pulse * 0.82);
      }

      // Update emissive rainbow colors on every other frame.
      rainbowFrameToggleRef.current = !rainbowFrameToggleRef.current;
      if (rainbowFrameToggleRef.current) {
        const hue = (t * 0.35) % 1;
        if (frontMaterialRef.current) {
          frontMaterialRef.current.emissive.setHSL(hue, 0.95, 0.62);
        }
        if (backMaterialRef.current) {
          backMaterialRef.current.emissive.setHSL((hue + 0.5) % 1, 0.9, 0.58);
        }
      }
    }
  });

  const frontMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: texture,
      transparent: true,
      alphaTest: 0.08,
      roughness: isShiny ? 0.2 : 0.48,
      metalness: isShiny ? 0.22 : 0.08,
      emissive: isShiny ? new THREE.Color('#ffd04d') : new THREE.Color('#000000'),
      emissiveIntensity: isShiny ? 0.85 : 0
    });
  }, [isShiny, texture]);

  const mirroredBackTexture = useMemo(() => {
    const mirrored = texture.clone();
    mirrored.needsUpdate = true;
    mirrored.wrapS = THREE.ClampToEdgeWrapping;
    mirrored.wrapT = THREE.ClampToEdgeWrapping;
    mirrored.repeat.set(-texture.repeat.x, texture.repeat.y);
    mirrored.offset.set(texture.offset.x + texture.repeat.x, texture.offset.y);
    mirrored.magFilter = THREE.NearestFilter;
    mirrored.minFilter = THREE.NearestFilter;
    mirrored.generateMipmaps = false;
    return mirrored;
  }, [texture]);

  const sideMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: isShiny ? '#5d6688' : '#20242a',
      roughness: isShiny ? 0.35 : 0.7,
      metalness: isShiny ? 0.45 : 0.1,
      emissive: isShiny ? new THREE.Color('#2f3f75') : new THREE.Color('#000000'),
      emissiveIntensity: isShiny ? 0.4 : 0
    });
  }, [isShiny]);

  const backMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: mirroredBackTexture,
      transparent: true,
      alphaTest: 0.08,
      roughness: isShiny ? 0.24 : 0.52,
      metalness: isShiny ? 0.18 : 0.06,
      emissive: isShiny ? new THREE.Color('#6f9fff') : new THREE.Color('#000000'),
      emissiveIntensity: isShiny ? 0.8 : 0.3
    });
  }, [isShiny, mirroredBackTexture]);

  useEffect(() => {
    frontMaterialRef.current = frontMaterial;
    backMaterialRef.current = backMaterial;

    return () => {
      frontMaterialRef.current = null;
      backMaterialRef.current = null;
      frontMaterial.dispose();
      sideMaterial.dispose();
      backMaterial.dispose();
      mirroredBackTexture.dispose();
    };
  }, [backMaterial, frontMaterial, mirroredBackTexture, sideMaterial]);

  return (
    <group ref={groupRef}>
      <mesh
        material={[
          sideMaterial,
          sideMaterial,
          sideMaterial,
          sideMaterial,
          frontMaterial,
          backMaterial
        ]}
      >
        <boxGeometry args={[ITEM_MODEL_SIZE, ITEM_MODEL_SIZE, ITEM_MODEL_DEPTH]} />
      </mesh>

      <mesh position={[0, -0.74, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.3, 48]} />
        <meshBasicMaterial color="#000" transparent opacity={0.1} />
      </mesh>
    </group>
  );
};

const ShinyLightRig: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const keyLightRef = useRef<THREE.PointLight>(null);
  const fillLightRef = useRef<THREE.PointLight>(null);
  const rimLightRef = useRef<THREE.PointLight>(null);

  useFrame((_state, delta) => {
    if (!groupRef.current) {
      return;
    }

    const t = performance.now() / 1000;
    groupRef.current.rotation.y += delta * 2.6;
    groupRef.current.position.y = Math.sin(t * 4.2) * 0.14;

    if (keyLightRef.current) {
      keyLightRef.current.intensity = 3.2 + Math.sin(t * 8.5) * 1.2;
      keyLightRef.current.color.setHSL((t * 0.25) % 1, 0.9, 0.72);
    }
    if (fillLightRef.current) {
      fillLightRef.current.intensity = 2.6 + Math.sin(t * 10.8 + 1.5) * 1.05;
      fillLightRef.current.color.setHSL((t * 0.25 + 0.33) % 1, 0.85, 0.65);
    }
    if (rimLightRef.current) {
      rimLightRef.current.intensity = 2.4 + Math.sin(t * 9.4 + 3.2) * 1.1;
      rimLightRef.current.color.setHSL((t * 0.25 + 0.66) % 1, 0.95, 0.67);
    }
  });

  return (
    <group ref={groupRef}>
      <pointLight
        ref={keyLightRef}
        position={[1.3, 0.65, 1.15]}
        intensity={3.2}
        color="#ffffff"
        distance={5.4}
      />
      <pointLight
        ref={fillLightRef}
        position={[-1.2, 0.4, 0.9]}
        intensity={2.6}
        color="#66d8ff"
        distance={5.1}
      />
      <pointLight
        ref={rimLightRef}
        position={[0.15, -0.15, -1.45]}
        intensity={2.4}
        color="#7f6dff"
        distance={5.2}
      />
    </group>
  );
};

const ShinyAura: React.FC = () => {
  const starRef = useRef<THREE.Mesh>(null);
  const starMatRef = useRef<THREE.MeshBasicMaterial>(null);

  const starGeometry = useMemo(() => {
    const outer = createStarShape(0.72, 0.28, 5);
    const inner = createStarShape(0.56, 0.22, 5);
    const hole = new THREE.Path(inner.getPoints().slice().reverse());
    outer.holes.push(hole);
    return new THREE.ShapeGeometry(outer);
  }, []);

  useEffect(() => {
    return () => {
      starGeometry.dispose();
    };
  }, [starGeometry]);

  useFrame((_state, delta) => {
    const t = performance.now() / 1000;

    if (starRef.current) {
      starRef.current.rotation.z += delta * 2.2;
      const s = 1 + Math.sin(t * 7.2) * 0.12;
      starRef.current.scale.set(s, s, 1);
    }

    if (starMatRef.current) {
      starMatRef.current.opacity = 0.45 + Math.sin(t * 9.2) * 0.2;
      starMatRef.current.color.setHSL((t * 0.2 + 0.2) % 1, 0.95, 0.7);
    }
  });

  return (
    <group position={[0, 0.03, 0]}>
      <mesh ref={starRef} geometry={starGeometry}>
        <meshBasicMaterial
          ref={starMatRef}
          color="#ffffff"
          transparent
          opacity={0.45}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
};

const ItemViewer3D: React.FC<ItemViewer3DProps> = ({
  spriteX,
  spriteY,
  assetsBaseUrl,
  isShiny = false,
  slotCount = 0,
  width = '100%',
  height = 320
}) => {
  const [itemTexture, setItemTexture] = useState<THREE.Texture | null>(null);
  const [hasLoadError, setHasLoadError] = useState(false);
  const resolvedWidth = typeof width === 'number' ? `${width}px` : width;
  const resolvedHeight = typeof height === 'number' ? `${height}px` : height;
  const clampedSlotCount = Math.min(Math.max(slotCount, 0), 4);
  const slotBackground = SLOT_BACKGROUND_BY_COUNT[clampedSlotCount] ?? SLOT_BACKGROUND_BY_COUNT[0];

  useEffect(() => {
    let disposed = false;
    const loader = new THREE.TextureLoader();
    setHasLoadError(false);

    loader.load(
      `${assetsBaseUrl}/renders.png`,
      (loadedTexture) => {
        if (disposed) {
          loadedTexture.dispose();
          return;
        }

        const image = loadedTexture.image as { width: number; height: number } | undefined;
        if (!image?.width || !image?.height) {
          loadedTexture.dispose();
          setItemTexture(null);
          setHasLoadError(true);
          return;
        }

        loadedTexture.magFilter = THREE.NearestFilter;
        loadedTexture.minFilter = THREE.NearestFilter;
        loadedTexture.generateMipmaps = false;
        if ('colorSpace' in loadedTexture) {
          loadedTexture.colorSpace = THREE.SRGBColorSpace;
        }

        const regionTexture = createItemRegionTexture(
          loadedTexture,
          image.width,
          image.height,
          spriteX,
          spriteY
        );

        loadedTexture.dispose();
        setItemTexture(regionTexture);
      },
      undefined,
      () => {
        setItemTexture(null);
        setHasLoadError(true);
      }
    );

    return () => {
      disposed = true;
      setItemTexture((previous) => {
        previous?.dispose();
        return null;
      });
    };
  }, [assetsBaseUrl, spriteX, spriteY]);

  if (!itemTexture) {
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
        {hasLoadError ? 'Failed to load 3D item texture.' : 'Loading 3D item...'}
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
        boxSizing: 'border-box',
        boxShadow: isShiny
          ? '0 0 0 1px rgba(189, 245, 255, 0.75), 0 0 26px rgba(112, 172, 255, 0.9), inset 0 0 24px rgba(205, 242, 255, 0.22)'
          : undefined,
        background: slotBackground
      }}
    >
      <Canvas
        style={{ width: '100%', height: '100%', display: 'block' }}
        camera={{ position: [0, 0.12, 2.7], fov: 48 }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={isShiny ? 0.85 : 0.5} />
        <hemisphereLight args={['#d8ecff', '#0f141c', isShiny ? 0.9 : 0.48]} />
        <directionalLight position={[2.4, 3.4, 2.2]} intensity={isShiny ? 1.85 : 1.15} />
        <directionalLight
          position={[-1.8, 1.5, -2.1]}
          intensity={isShiny ? 0.9 : 0.3}
          color={isShiny ? '#9fd2ff' : '#8ec5ff'}
        />
        {isShiny && <ShinyLightRig />}
        {isShiny && <ShinyAura />}
        <ItemVoxel texture={itemTexture} isShiny={isShiny} />
        <OrbitControls
          target={[0, 0.02, 0]}
          enablePan={false}
          enableDamping
          minDistance={1.6}
          maxDistance={4.2}
        />
      </Canvas>
    </div>
  );
};

export default ItemViewer3D;
