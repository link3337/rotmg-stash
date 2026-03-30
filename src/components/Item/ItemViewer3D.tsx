import { OrbitControls } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

interface ItemViewer3DProps {
    spriteX: number;
    spriteY: number;
    assetsBaseUrl: string;
    isShiny?: boolean;
    width?: number | string;
    height?: number | string;
}

const ITEM_TILE_SIZE = 40;
const ITEM_MODEL_SIZE = 0.74;
const ITEM_MODEL_DEPTH = 0.0001;

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

const ItemVoxel: React.FC<{ texture: THREE.Texture; isShiny: boolean }> = ({ texture, isShiny }) => {
    const groupRef = useRef<THREE.Group>(null);
    const frontMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
    const backMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);

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
        }
    });

    const frontMaterial = useMemo(() => {
        return new THREE.MeshStandardMaterial({
            map: texture,
            transparent: true,
            alphaTest: 0.08,
            roughness: isShiny ? 0.2 : 0.48,
            metalness: isShiny ? 0.22 : 0.08,
            emissive: isShiny ? new THREE.Color('#7ec8ff') : new THREE.Color('#000000'),
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
            emissiveIntensity: isShiny ? .8 : 0.3
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
            <mesh material={[sideMaterial, sideMaterial, sideMaterial, sideMaterial, frontMaterial, backMaterial]}>
                <boxGeometry args={[ITEM_MODEL_SIZE, ITEM_MODEL_SIZE, ITEM_MODEL_DEPTH]} />
            </mesh>

            <mesh position={[0, -0.74, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.42, 48]} />
                <meshBasicMaterial color="#000" transparent opacity={0.18} />
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
            <pointLight ref={keyLightRef} position={[1.3, 0.65, 1.15]} intensity={3.2} color="#ffffff" distance={5.4} />
            <pointLight ref={fillLightRef} position={[-1.2, 0.4, 0.9]} intensity={2.6} color="#66d8ff" distance={5.1} />
            <pointLight ref={rimLightRef} position={[0.15, -0.15, -1.45]} intensity={2.4} color="#7f6dff" distance={5.2} />
        </group>
    );
};

const ShinyAura: React.FC = () => {
    const ringARef = useRef<THREE.Mesh>(null);
    const ringBRef = useRef<THREE.Mesh>(null);
    const starRef = useRef<THREE.Mesh>(null);
    const ringAMatRef = useRef<THREE.MeshBasicMaterial>(null);
    const ringBMatRef = useRef<THREE.MeshBasicMaterial>(null);
    const starMatRef = useRef<THREE.MeshBasicMaterial>(null);

    useFrame((_state, delta) => {
        const t = performance.now() / 1000;

        if (ringARef.current) {
            ringARef.current.rotation.z += delta * 1.9;
            const s = 1 + Math.sin(t * 6.8) * 0.11;
            ringARef.current.scale.set(s, s, 1);
        }

        if (ringBRef.current) {
            ringBRef.current.rotation.z -= delta * 1.45;
            const s = 1 + Math.sin(t * 5.4 + 1.9) * 0.1;
            ringBRef.current.scale.set(s, s, 1);
        }

        if (starRef.current) {
            starRef.current.rotation.z += delta * 2.6;
        }

        if (ringAMatRef.current) {
            ringAMatRef.current.opacity = 0.46 + Math.sin(t * 8.8) * 0.2;
            ringAMatRef.current.color.setHSL((t * 0.22) % 1, 0.95, 0.66);
        }
        if (ringBMatRef.current) {
            ringBMatRef.current.opacity = 0.38 + Math.sin(t * 9.4 + 1.4) * 0.2;
            ringBMatRef.current.color.setHSL((t * 0.22 + 0.45) % 1, 0.9, 0.62);
        }
        if (starMatRef.current) {
            starMatRef.current.opacity = 0.33 + Math.sin(t * 11.5 + 2.1) * 0.25;
            starMatRef.current.color.setHSL((t * 0.22 + 0.2) % 1, 0.98, 0.72);
        }
    });

    return (
        <group position={[0, 0.03, 0]}>
            <mesh ref={ringARef} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.72, 0.032, 18, 96]} />
                <meshBasicMaterial ref={ringAMatRef} color="#7fe3ff" transparent opacity={0.5} blending={THREE.AdditiveBlending} />
            </mesh>
            <mesh ref={ringBRef} rotation={[Math.PI / 2, 0, Math.PI / 4]}>
                <torusGeometry args={[0.95, 0.024, 18, 96]} />
                <meshBasicMaterial ref={ringBMatRef} color="#9f8dff" transparent opacity={0.42} blending={THREE.AdditiveBlending} />
            </mesh>
            <mesh ref={starRef}>
                <ringGeometry args={[0.84, 0.97, 4]} />
                <meshBasicMaterial ref={starMatRef} color="#ffffff" transparent opacity={0.4} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
            </mesh>
        </group>
    );
};

const ItemViewer3D: React.FC<ItemViewer3DProps> = ({
    spriteX,
    spriteY,
    assetsBaseUrl,
    isShiny = false,
    width = '100%',
    height = 320,
}) => {
    const [itemTexture, setItemTexture] = useState<THREE.Texture | null>(null);
    const [hasLoadError, setHasLoadError] = useState(false);
    const resolvedWidth = typeof width === 'number' ? `${width}px` : width;
    const resolvedHeight = typeof height === 'number' ? `${height}px` : height;

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
                background:
                    isShiny
                        ? 'radial-gradient(circle at 24% 12%, rgba(246, 253, 255, 0.7), rgba(130, 94, 255, 0.6) 38%, rgba(35, 30, 85, 0.95) 62%, rgba(10, 14, 22, 0.98) 85%)'
                        : 'radial-gradient(circle at 30% 20%, rgba(80, 120, 180, 0.2), rgba(10, 14, 22, 0.95) 65%)'
            }}
        >
            <Canvas
                style={{ width: '100%', height: '100%', display: 'block' }}
                camera={{ position: [0, 0.12, 2.7], fov: 48 }}
                dpr={[1, 2]}
            >
                <ambientLight intensity={isShiny ? 0.85 : 0.5} />
                <hemisphereLight
                    args={['#d8ecff', '#0f141c', isShiny ? 0.9 : 0.48]}
                />
                <directionalLight
                    position={[2.4, 3.4, 2.2]}
                    intensity={isShiny ? 1.85 : 1.15}
                />
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