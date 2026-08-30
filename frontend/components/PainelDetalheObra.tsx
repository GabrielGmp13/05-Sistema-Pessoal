'use client';

import { useEffect, useState } from 'react';
import { listarElenco, type ElencoItem, type TipoObraElenco } from '@/lib/elenco';
import { listarTrilhaSonora, type TrilhaSonoraItem } from '@/lib/trilha-sonora';
import { listarTemporadas, type SerieTemporada } from '@/lib/series-temporadas';
import { listarTemporadasAnime, type AnimeTemporada } from '@/lib/animes-temporadas';
import { listarOpeningsEndings, type OpeningEnding } from '@/lib/openings-endings';
import { listarComplementosDoAnime, type Filme } from '@/lib/filmes';
import { listarOrdemConsumo, type OrdemConsumoItem } from '@/lib/animes-ordem-consumo';
import PainelObraLayout, { CamposObra, EncerramentoObra, ResumoObra, SecaoObra, type IdentidadeObra } from './PainelObraLayout';
import { organizarCampos } from './painel-obra-dados';
import { TemporadasObra, ElencoObra, TrilhaObra, MusicasAnime, ComplementosObra, OrdemObra } from './PainelObraAudiovisual';
import styles from './PainelDetalheObra.module.css';

export type { CampoInfo } from './painel-obra-dados';
type Props = Omit<IdentidadeObra, 'tipoObra'> & { aberto: boolean; tipoObra: TipoObraElenco; obraUuid: string };
interface Relacoes {
  elenco: ElencoItem[]; trilha: TrilhaSonoraItem[]; series: SerieTemporada[];
  animes: AnimeTemporada[]; musicas: OpeningEnding[]; complementos: Filme[]; ordem: OrdemConsumoItem[];
}
const VAZIO: Relacoes = { elenco: [], trilha: [], series: [], animes: [], musicas: [], complementos: [], ordem: [] };

// Montagem por identidade evita exibir respostas/dados da obra anterior durante a troca.
export default function PainelDetalheObra(props: Props) {
  return props.aberto ? <DetalheAberto key={props.tipoObra + props.obraUuid} {...props} /> : null;
}
function DetalheAberto({ obraUuid, tipoObra, ...props }: Props) {
  const [dados, setDados] = useState<Relacoes>(VAZIO);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);
  useEffect(() => {
    let ativo = true;
    async function carregar() {
      const resultados = await Promise.allSettled([
        tipoObra !== 'anime' ? listarElenco(tipoObra, obraUuid) : Promise.resolve([]),
        tipoObra !== 'anime' ? listarTrilhaSonora(tipoObra, obraUuid) : Promise.resolve([]),
        tipoObra === 'serie' ? listarTemporadas(obraUuid) : Promise.resolve([]),
        tipoObra === 'anime' ? listarTemporadasAnime(obraUuid) : Promise.resolve([]),
        tipoObra === 'anime' ? listarOpeningsEndings(obraUuid) : Promise.resolve([]),
        tipoObra === 'anime' ? listarComplementosDoAnime(obraUuid) : Promise.resolve([]),
        tipoObra === 'anime' ? listarOrdemConsumo(obraUuid) : Promise.resolve([]),
      ]);
      if (!ativo) return;
      const valores = resultados.map(r => r.status === 'fulfilled' ? r.value : null);
      setErro(valores.some(v => v === null));
      setDados({ elenco: valores[0] as ElencoItem[] ?? [], trilha: valores[1] as TrilhaSonoraItem[] ?? [],
        series: valores[2] as SerieTemporada[] ?? [], animes: valores[3] as AnimeTemporada[] ?? [],
        musicas: valores[4] as OpeningEnding[] ?? [], complementos: valores[5] as Filme[] ?? [], ordem: valores[6] as OrdemConsumoItem[] ?? [] });
      setCarregando(false);
    }
    void carregar();
    return () => { ativo = false; };
  }, [tipoObra, obraUuid]);
  const { equipe } = organizarCampos(props.infoGeral);
  return <PainelObraLayout {...props} tipoObra={tipoObra}>
    <ResumoObra infoGeral={props.infoGeral} />
    {carregando && <p className={styles.status} role="status">Carregando detalhes da obra...</p>}
    {erro && <p className={styles.erro} role="alert">Parte dos detalhes não pôde ser carregada. Feche e abra a obra para tentar novamente.</p>}
    {tipoObra === 'serie' && <TemporadasObra temporadas={dados.series} />}
    {tipoObra === 'anime' && <TemporadasObra temporadas={dados.animes} />}
    {equipe.length > 0 && <SecaoObra titulo="Equipe e produção"><CamposObra campos={equipe} /></SecaoObra>}
    {tipoObra !== 'anime' && <><ElencoObra elenco={dados.elenco} /><TrilhaObra musicas={dados.trilha} /></>}
    {tipoObra === 'anime' && <><MusicasAnime musicas={dados.musicas} /><ComplementosObra obras={dados.complementos} />
      <OrdemObra ordem={dados.ordem} referencias={[...dados.animes, ...dados.complementos].map(o => o.uuid)} /></>}
    <EncerramentoObra infoGeral={props.infoGeral} />
  </PainelObraLayout>;
}
