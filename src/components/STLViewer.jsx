import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import { useEffect, useRef } from "react";
import * as THREE from "three";

function Model({ fileUrl }) {
  const meshRef = useRef();
  const geometry = useLoader(STLLoader, fileUrl);

  useEffect(() => {
    if (!geometry) return;

    geometry.computeBoundingBox();
    geometry.center();

    const size = new THREE.Vector3();
    geometry.boundingBox.getSize(size);

    const maxDimension = Math.max(size.x, size.y, size.z);
    const scale = 50 / maxDimension;

    meshRef.current.scale.set(scale, scale, scale);
  }, [geometry]);

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial color="#cccccc" />
    </mesh>
  );
}

export default function STLViewer({ fileUrl }) {
  if (!fileUrl) return null;

  return (
    <Canvas camera={{ position: [0, 0, 120], fov: 50 }}>
      <ambientLight intensity={0.7} />
      <directionalLight position={[10, 10, 10]} intensity={1} />
      <Model fileUrl={fileUrl} />
      <OrbitControls />
    </Canvas>
  );
}