'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';

import { useMomentum } from '@/contexts/MomentumContext';

function GlowingOrb({ score }: { score: number }) {
    const meshRef = useRef<THREE.Mesh>(null);

    // Calculate speed and color based on score (baseline 250, can go up to 800+)
    const normalizedScore = Math.max(0, Math.min(1, (score - 200) / 600));

    const color = useMemo(() => {
        const startColor = new THREE.Color('#ef4444'); // Red for low momentum
        const endColor = new THREE.Color('#10b981');   // Green for high momentum
        return startColor.lerp(endColor, normalizedScore);
    }, [normalizedScore]);

    useFrame((state) => {
        if (meshRef.current) {
            // Rotate faster if momentum is high, slower if low
            const speed = 0.01 + (normalizedScore * 0.04);
            meshRef.current.rotation.x += speed;
            meshRef.current.rotation.y += speed;

            // Gentle pulsing effect
            const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
            meshRef.current.scale.set(scale, scale, scale);
        }
    });

    return (
        <mesh ref={meshRef}>
            <icosahedronGeometry args={[1.5, 3]} />
            <meshStandardMaterial
                color={color}
                wireframe={true}
                emissive={color}
                emissiveIntensity={0.5}
                transparent
                opacity={0.8}
            />
        </mesh>
    );
}

export default function MascotOrb() {
    const { score } = useMomentum();
    return (
        <div className="w-full h-40 mt-4 relative rounded-3xl overflow-hidden bg-secondary/10 border border-border/50 backdrop-blur-sm pointer-events-none">
            <div className="absolute inset-0 flex items-center justify-center p-4 z-10 opacity-30 mt-20 pointer-events-none text-center">
                <span className="text-xs uppercase tracking-widest font-bold">Your Momentum Core</span>
            </div>
            <Canvas camera={{ position: [0, 0, 4] }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} />
                <GlowingOrb score={score} />
            </Canvas>
        </div>
    );
}
