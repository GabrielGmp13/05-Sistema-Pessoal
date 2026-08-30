'use client';

import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { BookOpen, Clapperboard, Clock3, ExternalLink, Heart, Music2, Pencil, Play, Users, X } from 'lucide-react';
import { listarElenco, type ElencoItem, type TipoObraElenco } from '@/lib/elenco';
import { listarTrilhaSonora, type TrilhaSonoraItem } from '@/lib/trilha-sonora';
import { listarTemporadas, type SerieTemporada } from '@/lib/series-temporadas';
import { listarTemporadasAnime, type AnimeTemporada } from '@/lib/animes-temporadas';
import { listarOpeningsEndings, type OpeningEnding } from '@/lib/openings-endings';
import { listarComplementosDoAnime, listarFilmes, type Filme } from '@/lib/filmes';
import { listarOrdemConsumo, type OrdemConsumoItem } from '@/lib/animes-ordem-consumo';
import { CamposObra, EncerramentoObra, ImagemObra, NotaObra, ResumoObra, SecaoObra, type IdentidadeObra } from './PainelObraLayout';
import { dataPainel, NOMES_MIDIA, organizarCampos, urlExterna, type CampoInfo } from './painel-obra-dados';
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
  const [filme, setFilme] = useState<Filme | null>(null);
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
        // O chamador não repassa classificação nem contagens iguais a zero.
        // Reutilizar a leitura existente sem criar outro acesso ao Supabase.
        tipoObra === 'filme' ? listarFilmes() : Promise.resolve([]),
      ]);
      if (!ativo) return;
      const valores = resultados.map(r => r.status === 'fulfilled' ? r.value : null);
      setErro(valores.some(v => v === null));
      setFilme((valores[7] as Filme[] | null)?.find(f => f.uuid === obraUuid) ?? null);
      setDados({ elenco: valores[0] as ElencoItem[] ?? [], trilha: valores[1] as TrilhaSonoraItem[] ?? [],
        series: valores[2] as SerieTemporada[] ?? [], animes: valores[3] as AnimeTemporada[] ?? [],
        musicas: valores[4] as OpeningEnding[] ?? [], complementos: valores[5] as Filme[] ?? [], ordem: valores[6] as OrdemConsumoItem[] ?? [] });
      setCarregando(false);
    }
    void carregar();
    return () => { ativo = false; };
  }, [tipoObra, obraUuid]);
  const { equipe } = organizarCampos(props.infoGeral);
  return <LayoutDetalhe {...props} tipoObra={tipoObra} classificacao={filme?.classificacao_indicativa}>
    {tipoObra !== 'filme' && <ResumoObra infoGeral={props.infoGeral} />}
    {carregando && <p className={styles.status} role="status">Carregando detalhes da obra...</p>}
    {erro && <p className={styles.erro} role="alert">Parte dos detalhes não pôde ser carregada. Feche e abra a obra para tentar novamente.</p>}
    {tipoObra === 'filme' ? <ConteudoFilme filme={filme} infoGeral={props.infoGeral} elenco={dados.elenco} trilha={dados.trilha} /> : <>
    {tipoObra === 'serie' && <TemporadasObra temporadas={dados.series} />}
    {tipoObra === 'anime' && <TemporadasObra temporadas={dados.animes} />}
    {equipe.length > 0 && <SecaoObra titulo="Equipe e produção"><CamposObra campos={equipe} /></SecaoObra>}
    {tipoObra === 'serie' && <><ElencoObra elenco={dados.elenco} /><TrilhaObra musicas={dados.trilha} /></>}
    {tipoObra === 'anime' && <><MusicasAnime musicas={dados.musicas} /><ComplementosObra obras={dados.complementos} />
      <OrdemObra ordem={dados.ordem} referencias={[...dados.animes, ...dados.complementos].map(o => o.uuid)} /></>}
    <EncerramentoObra infoGeral={props.infoGeral} />
    </>}
  </LayoutDetalhe>;
}

// Cabeçalho local: preserva o contrato público e os painéis dos outros tipos de mídia.
function LayoutDetalhe({ tipoObra, titulo, subtitulo, bannerUrl, bannerPath, capaUrl, capaPath,
  infoGeral, favorito, generos = [], links = [], onFechar, onEditar, classificacao, children,
}: IdentidadeObra & { classificacao?: string | null; children: ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const tituloId = useId();
  const { cabecalho } = organizarCampos(infoGeral);
  const ordem = ['Período', 'Ano', 'Duração', 'Duração/ep', 'Classificação', 'Status', 'Nota'];
  const metadados = [...cabecalho, ...(classificacao?.trim() ? [{ label: 'Classificação', valor: classificacao }] : [])]
    .sort((a, b) => ordem.indexOf(a.label) - ordem.indexOf(b.label));
  const linksValidos = links.map(l => ({ ...l, url: urlExterna(l.url) })).filter(l => l.url);
  const possuiImagem = Boolean(bannerUrl || bannerPath || capaUrl || capaPath);
  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const anterior = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      if (anterior?.isConnected) anterior.focus({ preventScroll: true });
    };
  }, []);
  return <dialog ref={dialogRef} className={`${styles.painel} ${styles.detalheV0}`} aria-labelledby={tituloId} aria-modal="true"
    onKeyDown={e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); onFechar(); } }}
    onCancel={e => { e.preventDefault(); onFechar(); }} onClick={e => {
      if (e.target !== e.currentTarget) return;
      const r = e.currentTarget.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) onFechar();
    }}>
    <header className={styles.headerDetalhe}>
      {possuiImagem && <div className={styles.bannerDetalhe} aria-hidden="true"><ImagemObra prioridade url={bannerUrl || capaUrl}
        path={bannerPath || (!bannerUrl ? capaPath : null)} className={styles.imagemBanner} /></div>}
      <button type="button" autoFocus className={styles.btnFechar} onClick={onFechar} aria-label="Fechar detalhes" title="Fechar (Esc)"><X size={20} /></button>
      <div className={styles.identidadeDetalhe}>
        {(capaUrl || capaPath) && <ImagemObra prioridade url={capaUrl} path={capaPath} className={styles.posterDetalhe} />}
        <div className={styles.identidadeTexto}>
          <div className={styles.tipoDetalhe}>
            <span>{NOMES_MIDIA[tipoObra]}</span>
            {generos.filter(g => g.trim()).map(g => <span key={g}>{g}</span>)}
            {favorito && <span className={styles.favorito}><Heart size={12} fill="currentColor" /> Favorito</span>}
          </div>
          <h1 id={tituloId} className={styles.titulo}>{titulo}</h1>
          {subtitulo?.trim() && subtitulo.trim() !== titulo.trim() && <p className={styles.subtitulo}>{subtitulo}</p>}
          {metadados.length > 0 && <div className={styles.metadados}>{metadados.map(c => c.label === 'Nota'
            ? <NotaObra key={c.label} valor={Number.parseFloat(c.valor.replace(',', '.'))} />
            : <span key={c.label} className={c.label === 'Status' ? styles.badge : undefined} title={c.label}>{c.valor}</span>)}</div>}
        </div>
      </div>
    </header>
    <div className={styles.conteudo} tabIndex={0} aria-label={`Conteúdo de ${titulo}`}>{children}</div>
    <footer className={styles.rodape}>
      <div className={styles.links}>{linksValidos.map(l => <a key={`${l.label}-${l.url}`} className={styles.linkRodape} href={l.url}
        target="_blank" rel="noopener noreferrer">{l.label}<ExternalLink size={13} /></a>)}</div>
      {onEditar && <button type="button" className={`${styles.btnPrimario} ${styles.editarDetalhe}`} onClick={() => { onFechar(); onEditar(); }}><Pencil size={15} />Editar obra</button>}
    </footer>
  </dialog>;
}

function ConteudoFilme({ filme, infoGeral, elenco, trilha }: {
  filme: Filme | null; infoGeral: CampoInfo[]; elenco: ElencoItem[]; trilha: TrilhaSonoraItem[];
}) {
  const valor = (label: string) => infoGeral.find(c => c.label === label)?.valor ?? '';
  const sinopse = filme ? filme.sinopse : valor('Sinopse');
  const comentario = filme ? filme.comentario : valor('Comentário');
  const equipe = [
    { label: 'Direção', valor: filme ? filme.diretor : valor('Direção') },
    { label: 'Roteiro', valor: filme ? filme.roteirista : valor('Roteiro') },
    { label: 'Produção', valor: filme ? filme.produtores : valor('Produção') },
    { label: 'Estúdio', valor: filme ? filme.estudio : valor('Estúdio') },
  ].filter((c): c is CampoInfo => Boolean(c.valor?.trim()));
  const historico = [
    { label: 'Onde assistido', valor: filme ? filme.onde_consumi : valor('Onde consumi') },
    { label: 'Visualizações', valor: filme ? (filme.vezes_consumido == null ? '' : String(filme.vezes_consumido)) : valor('Vezes consumido') },
    { label: 'Última sessão', valor: filme ? dataPainel(filme.data_fim) : valor('Conclusão') },
  ].filter((c): c is CampoInfo => Boolean(c.valor?.trim()));
  const atores = elenco.filter(p => p.ator?.trim()).sort((a, b) => a.ordem - b.ordem).slice(0, 8);
  const faixas = trilha.filter(m => m.nome?.trim()).sort((a, b) => a.ordem - b.ordem);
  return <>
    {sinopse?.trim() && <SecaoObra titulo="Sinopse" icone={<BookOpen size={14} />}><p className={styles.prosa}>{sinopse}</p></SecaoObra>}
    {equipe.length > 0 && <SecaoObra titulo="Equipe" icone={<Clapperboard size={14} />}><div className={styles.equipeFilme}><CamposObra campos={equipe} /></div></SecaoObra>}
    {atores.length > 0 && <SecaoObra titulo="Elenco" icone={<Users size={14} />}><ul className={styles.elencoFilme}>{atores.map(p =>
      <li key={p.uuid} className={styles.atorFilme}>
        <span className={styles.fotoAtor} aria-hidden="true"><span>{p.ator!.trim().charAt(0).toLocaleUpperCase('pt-BR')}</span><ImagemObra url={p.foto_url} className={styles.imagemAtor} /></span>
        <div><strong>{p.ator}</strong>{p.personagem?.trim() && <p>{p.personagem}</p>}</div>
      </li>)}</ul></SecaoObra>}
    {faixas.length > 0 && <SecaoObra titulo="Trilha sonora" icone={<Music2 size={14} />}><ul className={styles.trilhaFilme}>{faixas.map(m => {
      const ouvir = urlExterna(m.link_spotify) || urlExterna(m.link_youtube_music);
      return <li key={m.uuid}><div><strong>{m.nome}</strong>{m.artista?.trim() && <span>{m.artista}</span>}</div>
        {ouvir && <a className={styles.linkExterno} href={ouvir} target="_blank" rel="noopener noreferrer" aria-label={`Ouvir ${m.nome}`}><Play size={12} />Ouvir</a>}
      </li>;
    })}</ul></SecaoObra>}
    {historico.length > 0 && <SecaoObra titulo="Onde assistido" icone={<Clock3 size={14} />}><div className={styles.historicoFilme}><CamposObra campos={historico} /></div></SecaoObra>}
    {comentario?.trim() && <SecaoObra titulo="Comentário pessoal" icone={<Pencil size={14} />}><p className={styles.prosa}>{comentario}</p></SecaoObra>}
  </>;
}
