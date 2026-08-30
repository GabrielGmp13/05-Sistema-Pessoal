'use client';

import { useEffect, useState } from 'react';
import {
  listarTemporadasAnime,
  criarTemporadaAnime,
  apagarTemporadaAnime,
  AnimeTemporada,
} from '@/lib/animes-temporadas';
import EpisodiosEditor from './EpisodiosEditor';
import BuscaMetadados from '@/app/biblioteca/_components/BuscaMetadados';
import type { ResultadoMetadados } from '@/lib/biblioteca-metadados';
import styles from './ListaEditavel.module.css';

interface Props {
  animeUuid: string;
  anilistId?: string | null;
}

const VAZIO = { numero: '', numero_episodios: '', minha_nota: '' };
const FORMATOS_TEMPORADA = ['TV', 'TV_SHORT'];
const RELACOES_TEMPORADA = ['SEQUEL', 'PREQUEL'];

export default function TemporadasAnimeEditor({ animeUuid, anilistId }: Props) {
  const [itens, setItens] = useState<AnimeTemporada[]>([]);
  const [novo, setNovo] = useState(VAZIO);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [expandidaUuid, setExpandidaUuid] = useState<string | null>(null);
  const [relacaoSelecionada, setRelacaoSelecionada] = useState<ResultadoMetadados | null>(null);

  async function carregar() {
    setCarregando(true);
    const res = await listarTemporadasAnime(animeUuid);
    setItens(res ?? []);
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animeUuid]);

  async function adicionar() {
    const numero = Number(novo.numero);
    if (!numero || numero < 1) return;
    setSalvando(true);
    const criada = await criarTemporadaAnime(animeUuid, {
      numero,
      numero_episodios: novo.numero_episodios ? Number(novo.numero_episodios) : undefined,
      minha_nota: novo.minha_nota ? Number(novo.minha_nota) : undefined,
    });
    if (criada) {
      setNovo(VAZIO);
      setRelacaoSelecionada(null);
      await carregar();
    }
    setSalvando(false);
  }

  async function remover(uuid: string) {
    await apagarTemporadaAnime(uuid);
    if (expandidaUuid === uuid) setExpandidaUuid(null);
    await carregar();
  }

  return (
    <div className={styles.wrapper}>
      <h4>Temporadas</h4>
      {anilistId ? (
        <BuscaMetadados
          fonte="anilist_relacoes"
          termo={anilistId}
          formatos={FORMATOS_TEMPORADA}
          relacoes={RELACOES_TEMPORADA}
          onSelect={(resultado) => {
            setRelacaoSelecionada(resultado);
            setNovo({
              numero: String(Math.max(1, itens.length + 1)),
              numero_episodios: resultado.episodios ? String(resultado.episodios) : '',
              minha_nota: '',
            });
          }}
        />
      ) : <p className={styles.vazio}>Selecione um resultado da AniList no cadastro principal para pesquisar temporadas.</p>}
      {relacaoSelecionada ? <p className={styles.vazio}>Selecionada: <strong>{relacaoSelecionada.titulo}</strong>. Confirme o número abaixo.</p> : null}
      {carregando ? (
        <p className={styles.vazio}>Carregando...</p>
      ) : (
        <ul className={styles.lista}>
          {itens.map((item) => (
            <li key={item.uuid} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>
                  <strong>Temporada {item.numero}</strong>
                  {item.numero_episodios != null ? ` — ${item.numero_episodios} eps` : ''}
                </span>
                <span>
                  <button
                    type="button"
                    onClick={() =>
                      setExpandidaUuid(expandidaUuid === item.uuid ? null : item.uuid)
                    }
                  >
                    {expandidaUuid === item.uuid ? 'Fechar episódios' : 'Ver episódios'}
                  </button>
                  <button type="button" onClick={() => remover(item.uuid)}>
                    ✕
                  </button>
                </span>
              </div>
              {expandidaUuid === item.uuid && <EpisodiosEditor temporadaUuid={item.uuid} />}
            </li>
          ))}
          {itens.length === 0 && <li className={styles.vazio}>Nenhuma temporada ainda.</li>}
        </ul>
      )}

      <div className={styles.linhaAdicionar}>
        <input
          placeholder="Número"
          type="number"
          inputMode="numeric"
          value={novo.numero}
          onChange={(e) => setNovo({ ...novo, numero: e.target.value })}
        />
        <input
          placeholder="Episódios (opcional)"
          type="number"
          inputMode="numeric"
          value={novo.numero_episodios}
          onChange={(e) => setNovo({ ...novo, numero_episodios: e.target.value })}
        />
        <input
          placeholder="Minha nota (opcional)"
          type="number"
          step={0.5}
          min={0}
          max={5}
          inputMode="decimal"
          value={novo.minha_nota}
          onChange={(e) => setNovo({ ...novo, minha_nota: e.target.value })}
        />
        <button type="button" onClick={adicionar} disabled={salvando}>
          + Adicionar
        </button>
      </div>
    </div>
  );
}
