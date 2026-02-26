'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, Text3D, Center, MeshDistortMaterial } from '@react-three/drei';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';

interface TrophyProps {
    level: 'bronze' | 'silver' | 'gold' | 'diamond';
}

function TrophyModel({ level }: TrophyProps) {
    const meshRef = useRef<THREE.Mesh>(null);

    const config = useMemo(() => {
        switch (level) {
            case 'bronze':
                return { color: '#cd7f32', emissive: '#cd7f32', intensity: 0.2, geometry: 'box' as const, scale: 1.5 };
            case 'silver':
                return { color: '#c0c0c0', emissive: '#ffffff', intensity: 0.4, geometry: 'octahedron' as const, scale: 1.8 };
            case 'gold':
                return { color: '#ffd700', emissive: '#ffaa00', intensity: 0.6, geometry: 'dodecahedron' as const, scale: 2 };
            case 'diamond':
                return { color: '#b9f2ff', emissive: '#00ffff', intensity: 1, geometry: 'icosahedron' as const, scale: 2.2 };
        }
    }, [level]);

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += 0.01;
            meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
        }
    });

    return (
        <Float speed={2} rotationIntensity={1} floatIntensity={2}>
            <mesh ref={meshRef} scale={config.scale}>
                {config.geometry === 'box' && <boxGeometry args={[1, 1, 1]} />}
                {config.geometry === 'octahedron' && <octahedronGeometry args={[1, 0]} />}
                {config.geometry === 'dodecahedron' && <dodecahedronGeometry args={[1, 0]} />}
                {config.geometry === 'icosahedron' && <icosahedronGeometry args={[1, 0]} />}

                {level === 'diamond' ? (
                    <MeshDistortMaterial
                        color={config.color}
                        emissive={config.emissive}
                        emissiveIntensity={config.intensity}
                        roughness={0.1}
                        metalness={1}
                        distort={0.4}
                        speed={2}
                    />
                ) : (
                    <meshStandardMaterial
                        color={config.color}
                        emissive={config.emissive}
                        emissiveIntensity={config.intensity}
                        metalness={0.8}
                        roughness={0.2}
                    />
                )}
            </mesh>
            {/* Added a glowing ring behind the trophy */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]}>
                <torusGeometry args={[1.5, 0.05, 16, 100]} />
                <meshStandardMaterial
                    color={config.emissive}
                    emissive={config.emissive}
                    emissiveIntensity={2}
                />
            </mesh>
        </Float>
    );
}

export default function MilestoneTrophy({ streak }: { streak: number }) {
    let level: 'bronze' | 'silver' | 'gold' | 'diamond' = 'bronze';
    let title = "10 Day Streak!";
    let subtitle = "Consistency is building.";

    if (streak >= 100) {
        level = 'diamond';
        title = "100 Day Centurion!";
        subtitle = "A legend in the making. Unstoppable.";
    } else if (streak >= 50) {
        level = 'gold';
        title = "50 Day Master!";
        subtitle = "Half a hundred. Pure Dedication.";
    } else if (streak >= 21) {
        level = 'silver';
        title = "21 Day Habit Formed!";
        subtitle = "The hard part is over. Keep going.";
    }

    return (
        <div className="w-full h-[400px] relative rounded-3xl overflow-hidden bg-black/40 border border-border/50 backdrop-blur-xl flex flex-col items-center justify-center">
            <div className="absolute top-6 left-0 right-0 text-center z-10 pointer-events-none">
                <h2 className="text-2xl font-black uppercase tracking-widest bg-clip-text text-transparent bg-gradient-to-br from-white to-white/50">{title}</h2>
                <p className="text-sm font-medium text-white/70 mt-1">{subtitle}</p>
            </div>

            <div className="absolute inset-0 cursor-move">
                <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
                    <ambientLight intensity={0.5} />
                    <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
                    <pointLight position={[-10, -10, -10]} intensity={0.5} />

                    <TrophyModel level={level} />

                    <OrbitControls
                        enableZoom={true}
                        enablePan={false}
                        minPolarAngle={Math.PI / 4}
                        maxPolarAngle={Math.PI / 1.5}
                        autoRotate
                        autoRotateSpeed={2}
                    />
                </Canvas>
            </div>

            <div className="absolute bottom-4 left-0 right-0 text-center z-10 pointer-events-none">
                <p className="text-xs uppercase tracking-widest text-white/50 font-bold">Interactive 3D Render • Drag to Rotate</p>
            </div>
        </div>
    );
}
