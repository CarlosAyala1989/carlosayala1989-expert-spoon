'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { Float, OrbitControls, RoundedBox, Stars } from '@react-three/drei'
import { useRef } from 'react'
import type { Group, Mesh } from 'three'
import type { TemaVisual } from '@/tipos/educacion'

interface Propiedades {
  tema: TemaVisual
  colores: string[]
  nivel: 'PRIMARIA' | 'SECUNDARIA'
}

function GrupoGiratorio({ children }: { children: React.ReactNode }) {
  const referencia = useRef<Group>(null)
  useFrame((_, delta) => {
    if (referencia.current) referencia.current.rotation.y += delta * 0.18
  })
  return <group ref={referencia}>{children}</group>
}

function Burbuja({
  posicion,
  color,
}: {
  posicion: [number, number, number]
  color: string
}) {
  const referencia = useRef<Mesh>(null)
  useFrame(({ clock }) => {
    if (referencia.current) {
      referencia.current.position.y =
        posicion[1] + Math.sin(clock.elapsedTime * 1.4 + posicion[0]) * 0.16
    }
  })
  return (
    <mesh ref={referencia} position={posicion}>
      <sphereGeometry args={[0.18, 24, 24]} />
      <meshPhysicalMaterial
        color={color}
        transparent
        opacity={0.42}
        roughness={0.05}
        transmission={0.5}
      />
    </mesh>
  )
}

function Personaje({ colores }: { colores: string[] }) {
  return (
    <group position={[0, -0.55, 0]}>
      <mesh position={[0, 1.45, 0]} castShadow>
        <sphereGeometry args={[0.42, 32, 32]} />
        <meshStandardMaterial color="#D99A72" />
      </mesh>
      <mesh position={[0, 1.53, -0.22]} rotation={[-0.35, 0, 0]}>
        <sphereGeometry
          args={[0.44, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.48]}
        />
        <meshStandardMaterial color="#30384B" />
      </mesh>
      <RoundedBox
        args={[0.75, 1.15, 0.48]}
        radius={0.2}
        position={[0, 0.7, 0]}
        castShadow
      >
        <meshStandardMaterial color={colores[0]} />
      </RoundedBox>
      <RoundedBox
        args={[0.85, 0.35, 0.5]}
        radius={0.1}
        position={[0, 0.28, 0.02]}
      >
        <meshStandardMaterial color={colores[1]} />
      </RoundedBox>
      {[-0.24, 0.24].map((x) => (
        <mesh position={[x, -0.22, 0]} key={x} castShadow>
          <capsuleGeometry args={[0.13, 0.55, 8, 18]} />
          <meshStandardMaterial color="#D99A72" />
        </mesh>
      ))}
    </group>
  )
}

function MotivoTema({
  tema,
  colores,
}: {
  tema: TemaVisual
  colores: string[]
}) {
  if (tema === 'higiene') {
    return (
      <group>
        <Personaje colores={colores} />
        <RoundedBox
          args={[0.62, 0.25, 0.35]}
          radius={0.12}
          position={[1.15, 0.1, 0.35]}
          rotation={[0.1, -0.35, 0.1]}
        >
          <meshStandardMaterial color={colores[2]} />
        </RoundedBox>
        {[
          [-1.05, 1.35, 0.2],
          [0.85, 1.65, 0],
          [-0.8, 0.25, 0.5],
          [1.3, 0.9, -0.2],
          [0.45, 2.05, -0.3],
        ].map((posicion, indice) => (
          <Burbuja
            key={indice}
            posicion={posicion as [number, number, number]}
            color={colores[indice % 3]}
          />
        ))}
      </group>
    )
  }

  if (tema === 'naturaleza') {
    return (
      <group position={[0, -0.6, 0]}>
        <mesh position={[0, 0.55, 0]}>
          <cylinderGeometry args={[0.18, 0.28, 1.3, 12]} />
          <meshStandardMaterial color="#8B5A3C" />
        </mesh>
        {[
          [-0.6, 1.35, 0],
          [0, 1.65, 0],
          [0.58, 1.35, 0],
          [0, 1.15, 0.45],
        ].map((p, i) => (
          <Float
            speed={1.5 + i * 0.2}
            rotationIntensity={0.15}
            floatIntensity={0.15}
            key={i}
          >
            <mesh position={p as [number, number, number]}>
              <sphereGeometry args={[0.62, 28, 28]} />
              <meshStandardMaterial color={i % 2 ? colores[2] : colores[1]} />
            </mesh>
          </Float>
        ))}
      </group>
    )
  }

  if (tema === 'historia' || tema === 'geografia') {
    return (
      <group>
        <mesh castShadow>
          <sphereGeometry args={[1.28, 48, 48]} />
          <meshStandardMaterial color={colores[0]} roughness={0.55} />
        </mesh>
        <mesh rotation={[Math.PI / 2.7, 0, Math.PI / 8]}>
          <torusGeometry args={[1.65, 0.035, 12, 100]} />
          <meshStandardMaterial color={colores[1]} />
        </mesh>
        {[
          [-0.65, 0.35, 1.08],
          [0.55, -0.65, 0.95],
          [0.65, 0.68, 0.9],
        ].map((p, i) => (
          <mesh position={p as [number, number, number]} key={i}>
            <dodecahedronGeometry args={[0.28, 0]} />
            <meshStandardMaterial color={colores[2]} />
          </mesh>
        ))}
      </group>
    )
  }

  return (
    <group>
      <Float speed={1.6} rotationIntensity={0.45} floatIntensity={0.35}>
        <RoundedBox args={[1.55, 1.55, 1.55]} radius={0.28} castShadow>
          <meshStandardMaterial color={colores[0]} roughness={0.38} />
        </RoundedBox>
      </Float>
      {[
        [1.5, 0.7, 0],
        [-1.45, -0.35, 0.2],
        [0.6, -1.45, 0.4],
      ].map((p, i) => (
        <Float speed={2 + i * 0.3} key={i}>
          <mesh position={p as [number, number, number]} castShadow>
            {i === 0 ? (
              <octahedronGeometry args={[0.42]} />
            ) : (
              <sphereGeometry args={[0.34, 24, 24]} />
            )}
            <meshStandardMaterial color={colores[(i + 1) % 3]} />
          </mesh>
        </Float>
      ))}
    </group>
  )
}

export function EscenaTres({ tema, colores, nivel }: Propiedades) {
  return (
    <div
      className="lienzo-tres"
      aria-label={`Escena tridimensional sobre ${tema}`}
    >
      <Canvas
        camera={{ position: [0, 1.15, 5.5], fov: 42 }}
        dpr={[1, 1.6]}
        shadows
      >
        <color
          attach="background"
          args={[nivel === 'PRIMARIA' ? '#f6f2ff' : '#101c2e']}
        />
        <ambientLight intensity={1.8} />
        <directionalLight position={[4, 6, 5]} intensity={2.5} castShadow />
        <pointLight
          position={[-4, 1, 2]}
          color={colores[1]}
          intensity={10}
          distance={8}
        />
        {nivel === 'SECUNDARIA' && (
          <Stars
            radius={40}
            depth={12}
            count={400}
            factor={2}
            fade
            speed={0.25}
          />
        )}
        <GrupoGiratorio>
          <MotivoTema tema={tema} colores={colores} />
        </GrupoGiratorio>
        <mesh
          position={[0, -1.65, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <circleGeometry args={[2.2, 64]} />
          <shadowMaterial transparent opacity={0.16} />
        </mesh>
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          minPolarAngle={Math.PI / 3.2}
          maxPolarAngle={Math.PI / 1.75}
        />
      </Canvas>
      <span className="pista-tres">Arrastra para explorar</span>
    </div>
  )
}
