'use client';

import { useEffect, useState } from 'react';
import {
  listarTemporadasAnime,
  criarTemporadaAnime,
  apagarTemporadaAnime,
  AnimeTemporada,
} from '@/lib/animes-temporadas';
import EpisodiosEditor from './EpisodiosEditor';
import styles from './ListaEditavel.module.css';

interface Props {
  animeUuid: string;
}

const VAZIO = { numero: '', numero_episodios: '', minha_nota: '' };

export default function TemporadasAnimeEditor({ animeUuid }: Props) {
  const [itens, setItens] = useState<AnimeTemporada[]>([]);
  const [novo, setNovo] = useState(VAZIO);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [expandidaUuid, setExpandidaUuid] = useState<string | null>(null);

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