import { getUserId, sb, sbErr } from './supabase'

export interface ItemBibliotecaInsight {
  titulo: string
  status?: string
  favorito: boolean
  assistido?: boolean
}

export interface CursoInsight {
  nome: string
  concluido: boolean
}

export interface DadosInsights {
  livros: ItemBibliotecaInsight[]
  mangas: ItemBibliotecaInsight[]
  series: ItemBibliotecaInsight[]
  animes: ItemBibliotecaInsight[]
  podcasts: ItemBibliotecaInsight[]
  videos: ItemBibliotecaInsight[]
  cursos: CursoInsight[]
}

export async function buscarDadosInsights(): Promise<DadosInsights | null> {
  const userId = await getUserId()
  if (!userId) return null

  const [livros, mangas, series, animes, podcasts, videos, cursos] = await Promise.all([
    sb.from('livros').select('titulo,status,favorito').eq('user_id', userId).eq('deleted', false).order('updated_at', { ascending: false }),
    sb.from('mangas').select('titulo,status,favorito').eq('user_id', userId).eq('deleted', false).order('updated_at', { ascending: false }),
    sb.from('series').select('titulo,status,favorito').eq('user_id', userId).eq('deleted', false).order('updated_at', { ascending: false }),
    sb.from('animes').select('nome_original,status,favorito').eq('user_id', userId).eq('deleted', false).order('updated_at', { ascending: false }),
    sb.from('podcasts').select('titulo,status,favorito').eq('user_id', userId).eq('deleted', false).order('updated_at', { ascending: false }),
    sb.from('videos').select('titulo,assistido,favorito').eq('user_id', userId).eq('deleted', false).order('updated_at', { ascending: false }),
    sb.from('materias').select('nome,concluido').eq('user_id', userId).eq('deleted', false).eq('tipo', 'curso').order('updated_at', { ascending: false }),
  ])

  const erro = [livros, mangas, series, animes, podcasts, videos, cursos].find((resultado) => resultado.error)?.error
  if (erro) return sbErr(erro, 'buscarDadosInsights')

  return {
    livros: livros.data as ItemBibliotecaInsight[],
    mangas: mangas.data as ItemBibliotecaInsight[],
    series: series.data as ItemBibliotecaInsight[],
    animes: (animes.data ?? []).map((anime) => ({
      titulo: anime.nome_original,
      status: anime.status,
      favorito: anime.favorito,
    })),
    podcasts: podcasts.data as ItemBibliotecaInsight[],
    videos: videos.data as ItemBibliotecaInsight[],
    cursos: cursos.data as CursoInsight[],
  }
}
