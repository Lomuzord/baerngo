"use client"

import { useRef } from "react"
import { Canvas, useFrame, useLoader } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import { NearestFilter, RepeatWrapping, TextureLoader, type Mesh } from "three"
import { weltPositionFuerLage } from "@/lib/karte"
import type { Lage, SehenswuerdigkeitKarte } from "@/lib/katalog"
import { ressourceFuerSehenswuerdigkeit } from "@/lib/sammeln"
import { useSpielerOrt } from "./useSpielerOrt"

export function BernWelt3D({
  sehenswuerdigkeiten,
}: {
  sehenswuerdigkeiten: SehenswuerdigkeitKarte[]
}) {
  const spieler = useSpielerOrt()
  const spielerLage = spieler.status === "bereit" ? spieler.lage : null

  return (
    <div className="mc-map3d" data-testid="mapbox-karte">
      <Canvas
        camera={{ position: [18, 22, 18], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false }}
      >
        <color attach="background" args={["#87ceeb"]} />
        <ambientLight intensity={0.85} />
        <directionalLight position={[12, 20, 8]} intensity={1.1} />
        <Boden />
        {sehenswuerdigkeiten.map((eintrag, index) => (
          <OrtBloecke key={eintrag.id} eintrag={eintrag} delay={index * 0.15} />
        ))}
        {spielerLage ? <SpielerBlock lage={spielerLage} /> : null}
        <OrbitControls
          enablePan={false}
          minDistance={12}
          maxDistance={40}
          maxPolarAngle={Math.PI / 2.15}
          target={[0, 0, 0]}
        />
      </Canvas>
    </div>
  )
}

function Boden() {
  const textur = usePixelTextur("/bloecke/gras.png")
  textur.wrapS = RepeatWrapping
  textur.wrapT = RepeatWrapping
  textur.repeat.set(18, 18)
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[48, 48]} />
      <meshStandardMaterial map={textur} />
    </mesh>
  )
}

function OrtBloecke({
  eintrag,
  delay,
}: {
  eintrag: SehenswuerdigkeitKarte
  delay: number
}) {
  const ressource = ressourceFuerSehenswuerdigkeit(eintrag.id)
  const { x, z } = weltPositionFuerLage(eintrag.lage)
  const url = ressource?.textur ?? "/bloecke/erde.png"
  return (
    <group position={[x, 0, z]}>
      <SpawnBlock url="/bloecke/erde.png" y={0.5} delay={delay} />
      <SpawnBlock url={url} y={1.5} delay={delay + 0.12} />
      <SpawnBlock url={url} y={2.5} delay={delay + 0.24} />
    </group>
  )
}

function SpielerBlock({ lage }: { lage: Lage }) {
  const { x, z } = weltPositionFuerLage(lage)
  return (
    <mesh position={[x, 1.2, z]}>
      <boxGeometry args={[0.8, 1.6, 0.8]} />
      <meshStandardMaterial color="#3d91e0" />
    </mesh>
  )
}

function SpawnBlock({
  url,
  y,
  delay,
}: {
  url: string
  y: number
  delay: number
}) {
  const mesh = useRef<Mesh>(null)
  const textur = usePixelTextur(url)
  const start = useRef<number | null>(null)

  useFrame(({ clock }) => {
    if (!mesh.current) return
    if (start.current === null) start.current = clock.elapsedTime
    const t = Math.min(1, Math.max(0, (clock.elapsedTime - start.current - delay) / 0.45))
    mesh.current.position.y = -2 + (y + 2) * t
    mesh.current.rotation.y = (1 - t) * 1.4
  })

  return (
    <mesh ref={mesh} position={[0, -2, 0]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial map={textur} />
    </mesh>
  )
}

function usePixelTextur(url: string) {
  const textur = useLoader(TextureLoader, url)
  textur.magFilter = NearestFilter
  textur.minFilter = NearestFilter
  textur.generateMipmaps = false
  return textur
}
