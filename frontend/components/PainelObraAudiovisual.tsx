'use client';

import { Check, Music2, Users } from 'lucide-react';
import type { ElencoItem } from '@/lib/elenco';
import type { TrilhaSonoraItem } from '@/lib/trilha-sonora';
import type { SerieTemporada } from '@/lib/series-temporadas';
import type { AnimeTemporada } from '@/lib/animes-temporadas';
import type { OpeningEnding } from '@/lib/openings-endings';
import type { Filme } from '@/lib/filmes';
import type { OrdemConsumoItem } from '@/lib/animes-ordem-consumo';
import { ImagemObra, NotaObra, SecaoObra, LinkMusica } from './PainelObraLayout';
import { dataPainel } from './painel-obra-dados';
import styles from './PainelDetalheObra.module.css';

export function TemporadasObra({ temporadas }: { temporadas: (AnimeTemporada | SerieTemporada)[] }) {
  if (!temporadas.length) return null;
  return <SecaoObra titulo={`Temporadas · ${temporadas.length}`}><div className={styles.gradeDois}>{temporadas.map(t => {
    const dadosAnime = 'nome_original' in t ? t : null;
    return <article key={t.uuid} id={`obra-${t.uuid}`} tabIndex={-1} className={styles.cartao}>
      <div className={styles.linhaObra}><ImagemObra url={dadosAnime?.capa_url} className={styles.miniCapa} />
        <div><span className={styles.numero}>Temporada {t.numero}</span><h3>{dadosAnime?.nome_original || `Temporada ${t.numero}`}</h3>
          {dadosAnime?.nome_traduzido && dadosAnime.nome_traduzido !== dadosAnime.nome_original && <p>{dadosAnime.nome_traduzido}</p>}
          <p>{[dadosAnime?.ano_lancamento, t.numero_episodios != null ? `${t.numero_episodios} episódios` : null].filter(v => v != null).join(' · ')}</p>
          {t.data_assisti && <p><Check size={12} /> Assistida em {dataPainel(t.data_assisti)}</p>}
          <NotaObra valor={t.minha_nota} />{t.nota_imdb != null && <p>IMDb · {t.nota_imdb} / 10</p>}
        </div>
      </div>
    </article>;
  })}</div></SecaoObra>;
}
export function ElencoObra({ elenco }: { elenco: ElencoItem[] }) {
  const atores = elenco.filter(p => p.ator?.trim());
  if (!atores.length) return null;
  return <SecaoObra titulo="Elenco" icone={<Users size={15} />}><div className={styles.elenco}>{atores.map(p => <div key={p.uuid} className={styles.linhaObra}>
    <ImagemObra url={p.foto_url} className={styles.avatar} /><div><strong>{p.ator}</strong>{p.personagem && <p>{p.personagem}</p>}</div>
  </div>)}</div></SecaoObra>;
}
export function MusicasAnime({ musicas }: { musicas: OpeningEnding[] }) {
  const grupos = [['opening', 'Openings'], ['ending', 'Endings'], ['trilha_sonora', 'Trilha sonora']] as const;
  if (!musicas.some(m => m.nome?.trim())) return null;
  return <SecaoObra titulo="Músicas da obra" icone={<Music2 size={15} />}><div className={styles.gradeMusicas}>
    {grupos.map(([tipo, titulo]) => {
      const faixas = musicas.filter(m => m.tipo === tipo && m.nome?.trim());
      return faixas.length > 0 && <div key={tipo}><h3 className={styles.subtituloSecao}>{titulo}</h3><ul className={styles.lista}>{faixas.map(m =>
        <li key={m.uuid} className={styles.cartao}><h3>{m.nome}</h3>{m.artista && <p>{m.artista}</p>}<NotaObra valor={m.minha_nota} /><div><LinkMusica url={m.link_video}>Ouvir</LinkMusica></div></li>)}</ul></div>;
    })}
  </div></SecaoObra>;
}
export function TrilhaObra({ musicas }: { musicas: TrilhaSonoraItem[] }) {
  const faixas = musicas.filter(m => m.nome?.trim());
  if (!faixas.length) return null;
  return <SecaoObra titulo="Trilha sonora" icone={<Music2 size={15} />}><ul className={styles.lista}>{faixas.map((m, i) =>
    <li key={m.uuid} className={styles.linhaLista}><span className={styles.numero}>{String(i + 1).padStart(2, '0')}</span><div><strong>{m.nome}</strong>{m.artista && <small>{m.artista}</small>}</div>
      <div className={styles.links}><LinkMusica url={m.link_spotify}>Spotify</LinkMusica><LinkMusica url={m.link_youtube_music}>YouTube Music</LinkMusica></div></li>)}</ul></SecaoObra>;
}
export function ComplementosObra({ obras }: { obras: Filme[] }) {
  if (!obras.length) return null;
  return <SecaoObra titulo="Complementos"><div className={styles.gradeDois}>{obras.map(o => <article key={o.uuid} id={`obra-${o.uuid}`} tabIndex={-1} className={styles.cartao}>
    <div className={styles.linhaObra}><ImagemObra url={o.capa_url} path={o.capa_path} className={styles.miniCapa} /><div><h3>{o.titulo}</h3>
      <p>{[o.tipo_complemento, o.ano_lancamento].filter(Boolean).join(' · ')}</p><NotaObra valor={o.nota} />
      {o.sinopse && <details className={styles.episodios}><summary>Sinopse</summary><p>{o.sinopse}</p></details>}
    </div></div>
  </article>)}</div></SecaoObra>;
}
export function OrdemObra({ ordem, referencias }: { ordem: OrdemConsumoItem[]; referencias: string[] }) {
  const itens = ordem.filter(o => o.rotulo?.trim() && referencias.includes(o.referencia_uuid));
  if (!itens.length) return null;
  return <SecaoObra titulo="Ordem de consumo"><ol className={styles.linhaTemporal}>{itens.map((o, i) =>
    <li key={o.uuid}><small>{String(i + 1).padStart(2, '0')} · {o.tipo_referencia === 'temporada' ? 'Temporada' : 'Complemento'}</small>
      <a className={styles.linkExterno} href={`#obra-${o.referencia_uuid}`} onClick={e => {
        e.preventDefault();
        const alvo = document.getElementById(`obra-${o.referencia_uuid}`);
        alvo?.focus({ preventScroll: true });
        alvo?.scrollIntoView({ block: 'nearest' });
      }}>{o.rotulo}</a></li>)}</ol></SecaoObra>;
}
