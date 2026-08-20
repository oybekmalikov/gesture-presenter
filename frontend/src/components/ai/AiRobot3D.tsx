// src/components/ai/AiRobot3D.tsx
import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, ContactShadows, Environment, Sphere } from '@react-three/drei';
import * as THREE from 'three';

function SmoothRobot({ isTalking, isWaving }: { isTalking: boolean; isWaving: boolean }) {
  const headRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const torsoRef = useRef<THREE.Group>(null);
  
  // Create shared materials to save performance and keep look consistent
  const materials = useMemo(() => {
    return {
      body: new THREE.MeshPhysicalMaterial({
        color: '#ffffff',
        roughness: 0.1,
        metalness: 0.1,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
      }),
      visor: new THREE.MeshPhysicalMaterial({
        color: '#050505',
        roughness: 0.0,
        metalness: 0.8,
        clearcoat: 1.0,
        transparent: true,
        opacity: 0.95,
      }),
      eye: new THREE.MeshStandardMaterial({
        color: '#00f2a9',
        emissive: '#00f2a9',
        emissiveIntensity: 3,
        toneMapped: false,
      })
    };
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // 1. Head tracks cursor smoothly
    if (headRef.current) {
      const targetX = state.mouse.x * 0.5;
      const targetY = state.mouse.y * 0.5;
      headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, targetX, 0.1);
      headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, -targetY, 0.1);
      
      // Talking bounce
      const talkingBounce = isTalking ? Math.sin(t * 15) * 0.03 : 0;
      headRef.current.position.y = THREE.MathUtils.lerp(headRef.current.position.y, 1.2 + talkingBounce, 0.1);
    }

    // 2. Eyes react to talking and blinking
    if (leftEyeRef.current && rightEyeRef.current) {
      // Blink logic
      const isBlinking = Math.sin(t * 3.5) > 0.97;
      let targetEyeScale = isBlinking ? 0.05 : 1.0;
      
      // If talking, eyes pulse to simulate speech
      if (isTalking && !isBlinking) {
        targetEyeScale = 0.8 + Math.sin(t * 20) * 0.3;
      }
      
      leftEyeRef.current.scale.y = THREE.MathUtils.lerp(leftEyeRef.current.scale.y, targetEyeScale, 0.3);
      rightEyeRef.current.scale.y = THREE.MathUtils.lerp(rightEyeRef.current.scale.y, targetEyeScale, 0.3);
    }

    // 3. Torso breathing animation
    if (torsoRef.current) {
      torsoRef.current.position.y = Math.sin(t * 2) * 0.03;
      torsoRef.current.rotation.y = Math.sin(t * 0.5) * 0.03;
    }

    // 4. Arms logic
    if (leftArmRef.current) {
      leftArmRef.current.position.y = Math.sin(t * 2.2) * 0.05;
      leftArmRef.current.rotation.z = 0.2 + Math.sin(t * 1.5) * 0.05;
      leftArmRef.current.rotation.x = Math.sin(t * 1.8) * 0.1;
    }

    if (rightArmRef.current) {
      if (isWaving) {
        // Waving animation
        rightArmRef.current.rotation.z = Math.sin(t * 15) * 0.6 - 2.2;
        rightArmRef.current.rotation.x = 0;
        rightArmRef.current.position.y = THREE.MathUtils.lerp(rightArmRef.current.position.y, 0.3, 0.1);
      } else {
        // Idle animation
        rightArmRef.current.position.y = THREE.MathUtils.lerp(rightArmRef.current.position.y, Math.sin(t * 2.1) * 0.05, 0.1);
        rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, -0.2 + Math.sin(t * 1.6) * 0.05, 0.1);
        rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, Math.sin(t * 1.9) * 0.1, 0.1);
      }
    }
  });

  return (
    <group position={[0, -0.6, 0]}>
      {/* HEAD */}
      <group ref={headRef} position={[0, 1.2, 0]}>
        {/* Head Base */}
        <Sphere args={[0.5, 64, 64]} castShadow receiveShadow material={materials.body} />
        
        {/* Visor Cutout (Black Glass) */}
        <mesh position={[0, 0, 0.12]} rotation={[-0.1, 0, 0]}>
          <cylinderGeometry args={[0.49, 0.49, 0.45, 64, 1, false, -Math.PI / 2.5, Math.PI / 1.25]} />
          <primitive object={materials.visor} />
        </mesh>

        {/* Eyes inside visor */}
        <mesh ref={leftEyeRef} position={[-0.18, 0.05, 0.44]} rotation={[0, -0.15, 0.1]}>
          <capsuleGeometry args={[0.05, 0.14, 16, 16]} />
          <primitive object={materials.eye} />
        </mesh>
        
        <mesh ref={rightEyeRef} position={[0.18, 0.05, 0.44]} rotation={[0, 0.15, -0.1]}>
          <capsuleGeometry args={[0.05, 0.14, 16, 16]} />
          <primitive object={materials.eye} />
        </mesh>

        {/* Cute Ear Antennas */}
        <mesh position={[-0.52, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.1, 0.1, 0.05, 32]} />
          <primitive object={materials.visor} />
        </mesh>
        <mesh position={[0.52, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.1, 0.1, 0.05, 32]} />
          <primitive object={materials.visor} />
        </mesh>
      </group>

      {/* TORSO */}
      <group ref={torsoRef} position={[0, 0.4, 0]}>
        {/* Sleek Pod Body */}
        <mesh castShadow receiveShadow>
          <capsuleGeometry args={[0.4, 0.5, 32, 64]} />
          <primitive object={materials.body} />
        </mesh>
        
        {/* Glowing Heart / Core */}
        <mesh position={[0, 0.15, 0.38]}>
          <circleGeometry args={[0.08, 32]} />
          <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={2.5} toneMapped={false} />
        </mesh>
      </group>

      {/* LEFT ARM */}
      <group ref={leftArmRef} position={[-0.65, 0.5, 0]}>
        <mesh castShadow receiveShadow rotation={[0, 0, -0.2]}>
          <capsuleGeometry args={[0.1, 0.35, 16, 32]} />
          <primitive object={materials.body} />
        </mesh>
      </group>

      {/* RIGHT ARM */}
      <group ref={rightArmRef} position={[0.65, 0.5, 0]}>
        <mesh castShadow receiveShadow rotation={[0, 0, 0.2]}>
          <capsuleGeometry args={[0.1, 0.35, 16, 32]} />
          <primitive object={materials.body} />
        </mesh>
      </group>
      
      {/* FLOATING THRUSTER RINGS */}
      <mesh position={[0, -0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.28, 0.02, 16, 64]} />
        <meshStandardMaterial color="#00f2a9" emissive="#00f2a9" emissiveIntensity={2} toneMapped={false} />
      </mesh>
      <mesh position={[0, -0.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.18, 0.015, 16, 64]} />
        <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={2} toneMapped={false} />
      </mesh>
    </group>
  );
}

export const AiRobot3D: React.FC<{ isTalking?: boolean }> = ({ isTalking = false }) => {
  const [isWaving, setIsWaving] = useState(false);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        cursor: 'grab',
      }}
      onClick={() => {
        setIsWaving(true);
        setTimeout(() => setIsWaving(false), 2000);
      }}
    >
      <Canvas
        camera={{ position: [0, 0.5, 4], fov: 40 }}
        gl={{ alpha: true, antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
      >
        {/* Environment map for super realistic reflections on the glass and plastic */}
        <Environment preset="city" />
        
        {/* Professional Studio Lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 10, 5]} intensity={2.5} castShadow shadow-mapSize={[1024, 1024]} />
        <pointLight position={[-5, 5, -5]} intensity={1.5} color="#3b82f6" />
        <pointLight position={[5, -5, 5]} intensity={1} color="#00f2a9" />

        <Float
          speed={2.5}
          rotationIntensity={0.2}
          floatIntensity={0.6}
          floatingRange={[-0.1, 0.1]}
        >
          <SmoothRobot isTalking={isTalking} isWaving={isWaving} />
        </Float>

        <ContactShadows
          position={[0, -1.2, 0]}
          opacity={0.7}
          scale={3}
          blur={2.5}
          far={3}
          color="#000000"
        />
      </Canvas>
    </div>
  );
};

export default AiRobot3D;
