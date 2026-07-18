'use client';

import { useEffect, useState } from 'react';
import {
  listarTrilhaSonora,
  criarTrilhaSonora,
  apagarTrilhaSonora,
  TrilhaSonoraItem,
  TipoObraTrilha,
} from '@/lib/trilha-sonora';
import styles from './ListaEditavel.module.css';

interface Props {
  tipoObra: TipoObraTrilha;
  obraUuid: string;
}

const VAZIO = { nome: '', artista: '', link_spotify: '' };

export default function TrilhaSonoraEditor({ tipoObra, obraUuid }: Props) {
  const [itens, setItens] = useState<TrilhaSonoraItem[]>([]);
  const [novo, setNovo] = useState(VAZIO);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    setCarregando(true);
    const res = await listarTrilhaSonora(tipoObra, obraUuid);
    setItens(res ?? []);
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [obraUuid]);

  async function adicionar() {
    if (!novo.nome.trim()) return;
    setSalvando(true);
    const criado = await criarTrilhaSonora(tipoObra, obraUuid, {
      nome: novo.nome,
      artista: novo.artista || undefined,
      link_spotify: novo.link_spotify || undefined,
      ordem: itens.length,
    });
    if (criado) {
      setNovo(VAZIO);
      await carregar();
    }
    setSalvando(false);
  }

  async function remover(uuid: string) {
    await apagarTrilhaSonora(uuid);
    await carregar();
  }

  return (
    <div className={styles.wrapper}>
      <h4>Trilha sonora</h4>
      {carregando ? (
        <p className={styles.vazio}>Carregando...</p>
      ) : (
        <ul className={styles.lista}>
          {itens.map((item) => (
            <li key={item.uuid}>
              <span>
                <strong>{item.nome}</strong>
                {item.artista ? ` — ${item.artista}` : ''}
              </span>
              <button type="button" onClick={() => remover(item.uuid)}>
                ✕
              </button>
            </li>
          ))}
          {itens.length === 0 && <li className={styles.vazio}>Nenhuma faixa ainda.</li>}
        </ul>
      )}

      <div className={styles.linhaAdicionar}>
        <input
          placeholder="Nome da faixa"
          value={novo.nome}
          onChange={(e) => setNovo({ ...novo, nome: e.target.value })}
        />
        <input
          placeholder="Artista (opcional)"
          value={novo.artista}
          onChange={(e) => setNovo({ ...novo, artista: e.target.value })}
        />
        <input
          placeholder="Link Spotify (opcional)"
          value={novo.link_spotify}
          onChange={(e) => setNovo({ ...novo, link_spotify: e.target.value })}
        />
        <button type="button" onClick={adicionar} disabled={salvando}>
          + Adicionar
        </button>
      </div>
    </div>
  );
}