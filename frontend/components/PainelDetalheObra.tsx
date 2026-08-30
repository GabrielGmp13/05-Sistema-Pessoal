'use client';

import { useEffect, useState } from 'react';
import { listarElenco, ElencoItem, TipoObraElenco } from '@/lib/elenco';
import { listarTrilhaSonora, TrilhaSonoraItem } from '@/lib/trilha-sonora';
import { listarTemporadas, SerieTemporada } from '@/lib/series-temporadas';
import { listarTemporadasAnime, AnimeTemporada } from '@/lib/animes-temporadas';
import { listarOpeningsEndings, OpeningEnding } from '@/lib/openings-endings';
import { getSignedUrl } from '@/lib/supabase';
import styles from './PainelDetalheObra.module.css';

export interface CampoInfo {
  label: string;
  valor: string;
}

interface PainelDetalheObraProps {
  aberto: boolean;
  onFechar: () => void;
  tipoObra: TipoObraElenco; // 'filme' | 'serie' | 'anime'
  obraUuid: string;
  titulo: string;
  bannerUrl?: string | null;
  bannerPath?: string | null;
  capaUrl?: string | null;
  capaPath?: string | null;
  infoGeral: CampoInfo[];
}

// Painel de detalhe de obra — somente leitura (ver DESIGN.md e DEC-026).
// Edição continua exclusivamente no modal de formulário (menu "⋯" → Editar).
export default function PainelDetalheObra({
  aberto,
  onFechar,
  tipoObra,
  obraUuid,
  titulo,
  bannerUrl,
  bannerPath,
  capaUrl,
  capaPath,
  infoGeral,
}: PainelDetalheObraProps) {
  const [elenco, setElenco] = useState<ElencoItem[]>([]);
  const [trilha, setTrilha] = useState<TrilhaSonoraItem[]>([]);
  const [temporadasSerie, setTemporadasSerie] = useState<SerieTemporada[]>([]);
  const [temporadasAnime, setTemporadasAnime] = useState<AnimeTemporada[]>([]);
  const [openingsEndings, setOpeningsEndings] = useState<OpeningEnding[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [bannerPrivado, setBannerPrivado] = useState<string | null>(null);
  const [capaPrivada, setCapaPrivada] = useState<string | null>(null);

  useEffect(() => {
    if (!aberto) return;
    let cancelado = false;

    async function carregar() {
      setCarregando(true);
      const elencoPromise = tipoObra === 'anime' ? Promise.resolve([]) : listarElenco(tipoObra, obraUuid);
      const trilhaPromise =
        tipoObra !== 'anime' ? listarTrilhaSonora(tipoObra, obraUuid) : Promise.resolve([]);
      const temporadasSeriePromise =
        tipoObra === 'serie' ? listarTemporadas(obraUuid) : Promise.resolve([]);
      const temporadasAnimePromise =
        tipoObra === 'anime' ? listarTemporadasAnime(obraUuid) : Promise.resolve([]);
      const openingsPromise =
        tipoObra === 'anime' ? listarOpeningsEndings(obraUuid) : Promise.resolve([]);

      const [elencoRes, trilhaRes, temporadasSerieRes, temporadasAnimeRes, openingsRes] =
        await Promise.all([
          elencoPromise,
          trilhaPromise,
          temporadasSeriePromise,
          temporadasAnimePromise,
          openingsPromise,
        ]);

      if (cancelado) return;
      setElenco(elencoRes ?? []);
      setTrilha((trilhaRes ?? []) as TrilhaSonoraItem[]);
      setTemporadasSerie((temporadasSerieRes ?? []) as SerieTemporada[]);
      setTemporadasAnime((temporadasAnimeRes ?? []) as AnimeTemporada[]);
      setOpeningsEndings((openingsRes ?? []) as OpeningEnding[]);
      setCarregando(false);
    }

    carregar();
    return () => {
      cancelado = true;
    };
  }, [aberto, tipoObra, obraUuid]);

  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === 'Escape') onFechar();
    }
    if (aberto) document.addEventListener('keydown', aoTeclar);
    return () => document.removeEventListener('keydown', aoTeclar);
  }, [aberto, onFechar]);

  useEffect(() => {
    let ativo = true;
    void Promise.all([
      bannerPath ? getSignedUrl('capas', bannerPath) : null,
      capaPath ? getSignedUrl('capas', capaPath) : null,
    ]).then(([banner, capa]) => { if (ativo) { setBannerPrivado(banner); setCapaPrivada(capa); } });
    return () => { ativo = false; };
  }, [bannerPath, capaPath]);

  if (!aberto) return null;
  const imagemTopo = bannerPrivado || bannerUrl || capaPrivada || capaUrl || null;
  const temporadas = tipoObra === 'anime' ? temporadasAnime : temporadasSerie;

  return (
    <div className={styles.overlay} onClick={onFechar}>
      <div className={styles.painel} onClick={(e) => e.stopPropagation()}>
        <button className={styles.btnFechar} onClick={onFechar} title="Fechar (Esc)">
          ✕
        </button>

        {imagemTopo && (
          <div className={styles.banner} style={{ backgroundImage: `url(${imagemTopo})` }} />
        )}

        <div className={styles.conteudo}>
          <h1 className={styles.titulo}>{titulo}</h1>

          {infoGeral.length > 0 && (
            <section className={styles.secao}>
              <div className={styles.infoGrid}>
                {infoGeral.map((campo) => (
                  <div key={campo.label} className={styles.infoItem}>
                    <span className={styles.infoLabel}>{campo.label}</span>
                    <span className={styles.infoValor}>{campo.valor}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {(tipoObra === 'serie' || tipoObra === 'anime') && (
            <section className={styles.secao}>
              <h2>Temporadas</h2>
              {carregando ? (
                <p className={styles.vazio}>Carregando...</p>
              ) : temporadas.length === 0 ? (
                <p className={styles.vazio}>Nenhuma temporada registrada.</p>
              ) : (
                <div className={styles.scrollHorizontal}>
                  {temporadas.map((t) => (
                    <div key={t.uuid} className={styles.cardTemporada}>
                      <strong>{'nome_original' in t && t.nome_original ? t.nome_original : `Temporada ${t.numero}`}</strong>
                      {t.numero_episodios != null && <p>{t.numero_episodios} episódios</p>}
                      {t.minha_nota != null && <p>Minha nota: {t.minha_nota}</p>}
                      {t.nota_imdb != null && <p>IMDb: {t.nota_imdb}</p>}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {tipoObra !== 'anime' && <section className={styles.secao}>
            <h2>Elenco</h2>
            {carregando ? (
              <p className={styles.vazio}>Carregando...</p>
            ) : elenco.length === 0 ? (
              <p className={styles.vazio}>
                Nenhum ator registrado.
              </p>
            ) : (
              <div className={styles.scrollHorizontal}>
                {elenco.map((item) => (
                  <div key={item.uuid} className={styles.cardAtor}>
                    <div
                      className={styles.fotoAtor}
                      style={item.foto_url ? { backgroundImage: `url(${item.foto_url})` } : {}}
                    />
                    <strong>
                      {item.ator}
                    </strong>
                    {item.personagem && <p>{item.personagem}</p>}
                  </div>
                ))}
              </div>
            )}
          </section>}

          {tipoObra === 'anime' ? (
            <section className={styles.secao}>
              <h2>Openings / Endings</h2>
              {carregando ? (
                <p className={styles.vazio}>Carregando...</p>
              ) : openingsEndings.length === 0 ? (
                <p className={styles.vazio}>Nenhuma faixa registrada.</p>
              ) : (
                <div className={styles.scrollHorizontal}>
                  {openingsEndings.map((item) => (
                    <div key={item.uuid} className={styles.cardMusica}>
                      <strong>
                        {item.tipo === 'opening' ? 'OP' : item.tipo === 'ending' ? 'ED' : 'OST'} — {item.nome}
                      </strong>
                      {item.artista && <p>{item.artista}</p>}
                      {item.link_video && (
                        <a href={item.link_video} target="_blank" rel="noreferrer">
                          Assistir
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          ) : (
            <section className={styles.secao}>
              <h2>Trilha sonora</h2>
              {carregando ? (
                <p className={styles.vazio}>Carregando...</p>
              ) : trilha.length === 0 ? (
                <p className={styles.vazio}>Nenhuma faixa registrada.</p>
              ) : (
                <div className={styles.scrollHorizontal}>
                  {trilha.map((item) => (
                    <div key={item.uuid} className={styles.cardMusica}>
                      <strong>{item.nome}</strong>
                      {item.artista && <p>{item.artista}</p>}
                      {item.link_spotify && (
                        <a href={item.link_spotify} target="_blank" rel="noreferrer">
                          Spotify
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
