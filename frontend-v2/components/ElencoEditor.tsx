'use client';

import { useEffect, useState } from 'react';
import {
  listarElenco,
  criarElenco,
  apagarElenco,
  ElencoItem,
  TipoObraElenco,
} from '@/lib/elenco';
import styles from './ListaEditavel.module.css';

interface Props {
  tipoObra: TipoObraElenco;
  obraUuid: string;
}

const VAZIO = {
  ator: '',
  dublador_original: '',
  dublador_br: '',
  personagem: '',
  foto_url: '',
};

export default function ElencoEditor({ tipoObra, obraUuid }: Props) {
  const [itens, setItens] = useState<ElencoItem[]>([]);
  const [novo, setNovo] = useState(VAZIO);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const ehAnime = tipoObra === 'anime';

  async function carregar() {
    setCarregando(true);
    const res = await listarElenco(tipoObra, obraUuid);
    setItens(res ?? []);
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [obraUuid]);

  async function adicionar() {
    if (ehAnime ? !novo.dublador_original.trim() : !novo.ator.trim()) return;
    setSalvando(true);
    const criado = await criarElenco(tipoObra, obraUuid, {
      ator: ehAnime ? undefined : novo.ator,
      dublador_original: ehAnime ? novo.dublador_original : undefined,
      dublador_br: ehAnime ? novo.dublador_br || undefined : undefined,
      personagem: novo.personagem || undefined,
      foto_url: novo.foto_url || undefined,
      ordem: itens.length,
    });
    if (criado) {
      setNovo(VAZIO);
      await carregar();
    }
    setSalvando(false);
  }

  async function remover(uuid: string) {
    await apagarElenco(uuid);
    await carregar();
  }

  return (
    <div className={styles.wrapper}>
      <h4>{ehAnime ? 'Dublagem' : 'Elenco'}</h4>
      {carregando ? (
        <p className={styles.vazio}>Carregando...</p>
      ) : (
        <ul className={styles.lista}>
          {itens.map((item) => (
            <li key={item.uuid}>
              <span>
                <strong>
                  {ehAnime
                    ? [item.dublador_original, item.dublador_br].filter(Boolean).join(' / ')
                    : item.ator}
                </strong>
                {item.personagem ? ` — ${item.personagem}` : ''}
              </span>
              <button type="button" onClick={() => remover(item.uuid)}>
                ✕
              </button>
            </li>
          ))}
          {itens.length === 0 && (
            <li className={styles.vazio}>
              {ehAnime ? 'Nenhum dublador ainda.' : 'Nenhum ator ainda.'}
            </li>
          )}
        </ul>
      )}

      <div className={styles.linhaAdicionar}>
        {ehAnime ? (
          <>
            <input
              placeholder="Dublador original (japonês)"
              value={novo.dublador_original}
              onChange={(e) => setNovo({ ...novo, dublador_original: e.target.value })}
            />
            <input
              placeholder="Dublador BR (opcional)"
              value={novo.dublador_br}
              onChange={(e) => setNovo({ ...novo, dublador_br: e.target.value })}
            />
          </>
        ) : (
          <input
            placeholder="Ator"
            value={novo.ator}
            onChange={(e) => setNovo({ ...novo, ator: e.target.value })}
          />
        )}
        <input
          placeholder="Personagem (opcional)"
          value={novo.personagem}
          onChange={(e) => setNovo({ ...novo, personagem: e.target.value })}
        />
        <input
          placeholder="URL da foto (opcional)"
          value={novo.foto_url}
          onChange={(e) => setNovo({ ...novo, foto_url: e.target.value })}
        />
        <button type="button" onClick={adicionar} disabled={salvando}>
          + Adicionar
        </button>
      </div>
    </div>
  );
}