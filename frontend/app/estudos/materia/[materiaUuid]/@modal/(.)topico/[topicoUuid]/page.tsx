import { TopicoDetalhe } from '@/components/study/topico-detalhe'

export default async function TopicoModalPage({ params }: { params: Promise<{ materiaUuid: string; topicoUuid: string }> }) {
  const { materiaUuid, topicoUuid } = await params
  return <TopicoDetalhe materiaUuid={materiaUuid} topicoUuid={topicoUuid} />
}
