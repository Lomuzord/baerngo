import { notFound } from "next/navigation"
import {
  quizOhneLoesung,
  sehenswuerdigkeitById,
} from "@/lib/katalog"
import { SehenswuerdigkeitDetail } from "./SehenswuerdigkeitDetail"

export default async function SehenswuerdigkeitPage({
  params,
}: {
  params: Promise<{ sehenswuerdigkeit_id: string }>
}) {
  const { sehenswuerdigkeit_id } = await params
  const eintrag = sehenswuerdigkeitById(sehenswuerdigkeit_id)
  const quiz = quizOhneLoesung(sehenswuerdigkeit_id)
  if (!eintrag || !quiz) notFound()

  return (
    <SehenswuerdigkeitDetail
      id={eintrag.id}
      name={eintrag.name}
      alias={eintrag.alias}
      quiz={quiz}
    />
  )
}
