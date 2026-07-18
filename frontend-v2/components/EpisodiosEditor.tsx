'use client';

import { useEffect, useState } from 'react';
import {
  listarEpisodios,
  criarEpisodio,
  atualizarEpisodio,
  apagarEpisodio,
  calcularPercentualFiller,
  AnimeEpisodio,
} from '@/lib/animes-episodios';
import styles from './ListaEditavel.module.css';

interface Props {
  temporadaUuid: string;
}

const VAZIO = { numero: '', titulo: '', arco: '' };

export default function EpisodiosEditor({ temporadaUuid }: Props) {
  const [itens, setItens] = useState<AnimeEpisodio[]>([]);
  const [novo, setNovo] = useState(VAZIO);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    setCarregando(true);
    const res = await listarEpisodios(temporadaUuid);
    setItens(res ?? []);
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [temporadaUuid]);

  async function adicionar() {
    const numero = Number(novo.numero);
    if (!numero || numero < 1) return;
    setSalvando(true);
    const criado = await criarEpisodio(temporadaUuid, {
      numero,
      titulo: novo.titulo || undefined,
      arco: novo.arco || undefined,
    });
    if (criado) {
      setNovo(VAZIO);
      await carregar();
    }
    setSalvando(false);
  }

  async function alternarFiller(ep: AnimeEpisodio) {
    await atualizarEpisodio(ep.uuid, { filler: !ep.filler });
    await carregar();
  }

  async function alternarAssistido(ep: AnimeEpisodio) {
    await atualizarEpisodio(ep.uuid, { assistido: !ep.assistido });
    await carregar();
  }

  async function remover(uuid: string) {
    await apagarEpisodio(uuid);
    await carregar();
  }

  const percentualFiller = calcularPercentualFiller(itens);

  return (
    <div className={styles.wrapper} style={{ marginLeft: '1rem', borderTop: 'none' }}>
      <h4>
        Episódios {itens.length > 0 && `— ${percentualFiller}% filler`}
      </h4>
      {carregando ? (
        <p className={styles.vazio}>Carregando...</p>
      ) : (
        <ul className={styles.lista}>
          {itens.map((ep) => (
            <li key={ep.uuid}>
              <span>
                <strong>Ep {ep.numero}</strong>
                {ep.titulo ? ` — ${ep.titulo}` : ''}
                {ep.arco ? ` (${ep.arco})` : ''}
              </span>
              <span style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <label style={{ fontSize: '0.72rem', color: '#888' }}>
                  <input
                    type="checkbox"
                    checked={ep.filler}
                    onChange={() => alternarFiller(ep)}
                  />{' '}
                  filler
                </label>
                <label style={{ fontSize: '0.72rem', color: '#888' }}>
                  <input
                    type="checkbox"
                    checked={ep.assistido}
                    onChange={() => alternarAssistido(ep)}
                  />{' '}
                  assistido
                </label>
                <button type="button" onClick={() => remover(ep.uuid)}>
                  ✕
                </button>
              </span>
            </li>
          ))}
          {itens.length === 0 && <li className={styles.vazio}>Nenhum episódio ainda.</li>}
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
          placeholder="Título (opcional)"
          value={novo.titulo}
          onChange={(e) => setNovo({ ...novo, titulo: e.target.value })}
        />
        <input
          placeholder="Arco (opcional)"
          value={novo.arco}
          onChange={(e) => setNovo({ ...novo, arco: e.target.value })}
        />
        <button type="button" onClick={adicionar} disabled={salvando}>
          + Adicionar
        </button>
      </div>
    </div>
  );
}