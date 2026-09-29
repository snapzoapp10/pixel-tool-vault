import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float, Lightformer, MeshDistortMaterial, RoundedBox, Torus } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";

function Scene() {
  const group = useRef<THREE.Group>(null);
  const mouse = useRef({ x: 0, y: 0 });

  useFrame((state, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const g = group.current;
    if (!g) return;
    const scroll = Math.min(window.scrollY / window.innerHeight, 1.5);
    mouse.current.x += (state.pointer.x - mouse.current.x) * (1 - Math.exp(-4 * dt));
    mouse.current.y += (state.pointer.y - mouse.current.y) * (1 - Math.exp(-4 * dt));
    g.rotation.y = mouse.current.x * 0.35 + scroll * 1.6 + state.clock.elapsedTime * 0.08;
    g.rotation.x = -mouse.current.y * 0.25 + scroll * 0.5;
    g.position.z = -scroll * 4;
    g.position.y = scroll * 1.2;
  });

  return (
    <group ref={group}>
      <Float speed={2} rotationIntensity={0.6} floatIntensity={1.2}>
        <mesh>
          <icosahedronGeometry args={[1.25, 12]} />
          <MeshDistortMaterial color="#8b5cf6" distort={0.35} speed={2} roughness={0.08} metalness={0.3} />
        </mesh>
      </Float>
      <Torus args={[2.1, 0.07, 32, 160]} rotation={[1.2, 0.3, 0]}>
        <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={0.8} metalness={0.9} roughness={0.1} />
      </Torus>
      <Torus args={[2.6, 0.04, 32, 160]} rotation={[-0.9, 0.8, 0]}>
        <meshStandardMaterial color="#ec4899" emissive="#ec4899" emissiveIntensity={0.7} metalness={0.9} roughness={0.1} />
      </Torus>
      {/* glass "code editor" and "chat" panels */}
      <Float speed={1.5} floatIntensity={1.5}>
        <RoundedBox args={[1.8, 1.1, 0.08]} radius={0.08} position={[2.4, 0.9, 0.3]} rotation={[0, -0.5, 0.05]}>
          <meshPhysicalMaterial color="#c4b5fd" transmission={0.9} thickness={0.5} roughness={0.05} clearcoat={1} />
        </RoundedBox>
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[2.25 + i * 0.05, 1.2 - i * 0.22, 0.4 - i * 0.02]} rotation={[0, -0.5, 0.05]}>
            <boxGeometry args={[1.1 - i * 0.25, 0.07, 0.02]} />
            <meshStandardMaterial color={["#22d3ee", "#ec4899", "#a78bfa"][i]!} emissive={["#22d3ee", "#ec4899", "#a78bfa"][i]!} emissiveIntensity={1} />
          </mesh>
        ))}
      </Float>
      <Float speed={1.8} floatIntensity={1.3}>
        <RoundedBox args={[1.4, 0.8, 0.08]} radius={0.1} position={[-2.4, -0.8, 0.4]} rotation={[0, 0.5, -0.05]}>
          <meshPhysicalMaterial color="#67e8f9" transmission={0.9} thickness={0.5} roughness={0.05} clearcoat={1} />
        </RoundedBox>
      </Float>
      {[[-2.2, 1.6, -0.5, "#f472b6"], [1.6, -1.7, 0.6, "#22d3ee"], [-0.8, -2, -1, "#a78bfa"]].map(([x, y, z, c], i) => (
        <Float key={i} speed={3} floatIntensity={2}>
          <mesh position={[x as number, y as number, z as number]}>
            <sphereGeometry args={[0.22, 32, 32]} />
            <meshStandardMaterial color={c as string} metalness={0.6} roughness={0.1} />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

export default function Hero3D() {
  return (
    <Canvas dpr={[1, 1.6]} camera={{ position: [0, 0, 9], fov: 45 }} gl={{ alpha: true, antialias: true }}>
      <ambientLight intensity={0.4} />
      <pointLight position={[5, 5, 5]} intensity={40} color="#a78bfa" />
      <pointLight position={[-5, -3, 3]} intensity={30} color="#22d3ee" />
      <Environment resolution={128}>
        <Lightformer intensity={3} position={[0, 5, -2]} scale={[10, 3, 1]} />
        <Lightformer intensity={2} color="#ec4899" position={[-5, 0, 0]} rotation-y={Math.PI / 2} scale={[10, 2, 1]} />
        <Lightformer intensity={2} color="#22d3ee" position={[5, 0, 0]} rotation-y={-Math.PI / 2} scale={[10, 2, 1]} />
      </Environment>
      <Scene />
    </Canvas>
  );
}
