'use client';

import { useEffect, useState } from 'react';
import {
  listarVolumes,
  criarVolume,
  atualizarVolume,
  apagarVolume,
  MangaVolume,
} from '@/lib/mangas-volumes';
import styles from './ListaEditavel.module.css';

interface Props {
  mangaUuid: string;
}

const VAZIO = { numero: '', arco: '', cor: '#b8f566' };

export default function VolumesEditor({ mangaUuid }: Props) {
  const [itens, setItens] = useState<MangaVolume[]>([]);
  const [novo, setNovo] = useState(VAZIO);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    setCarregando(true);
    const res = await listarVolumes(mangaUuid);
    setItens(res ?? []);
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mangaUuid]);

  async function adicionar() {
    const numero = Number(novo.numero);
    if (!numero || numero < 1) return;
    setSalvando(true);
    const criado = await criarVolume(mangaUuid, {
      numero,
      arco: novo.arco || undefined,
      cor: novo.cor || undefined,
    });
    if (criado) {
      setNovo(VAZIO);
      await carregar();
    }
    setSalvando(false);
  }

  async function alternarLido(vol: MangaVolume) {
    await atualizarVolume(vol.uuid, { lido: !vol.lido });
    await carregar();
  }

  async function remover(uuid: string) {
    await apagarVolume(uuid);
    await carregar();
  }

  return (
    <div className={styles.wrapper}>
      <h4>Volumes</h4>
      {carregando ? (
        <p className={styles.vazio}>Carregando...</p>
      ) : (
        <ul className={styles.lista}>
          {itens.map((vol) => (
            <li key={vol.uuid}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                {vol.cor && (
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: vol.cor,
                      display: 'inline-block',
                    }}
                  />
                )}
                <strong>Vol {vol.numero}</strong>
                {vol.arco ? ` — ${vol.arco}` : ''}
              </span>
              <span style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <label style={{ fontSize: '0.72rem', color: '#888' }}>
                  <input type="checkbox" checked={vol.lido} onChange={() => alternarLido(vol)} />{' '}
                  lido
                </label>
                <button type="button" onClick={() => remover(vol.uuid)}>
                  ✕
                </button>
              </span>
            </li>
          ))}
          {itens.length === 0 && <li className={styles.vazio}>Nenhum volume ainda.</li>}
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
          placeholder="Arco (opcional)"
          value={novo.arco}
          onChange={(e) => setNovo({ ...novo, arco: e.target.value })}
        />
        <input
          type="color"
          value={novo.cor}
          onChange={(e) => setNovo({ ...novo, cor: e.target.value })}
          title="Cor do arco"
          style={{ width: '2.2rem', padding: '0.15rem', flex: '0 0 auto' }}
        />
        <button type="button" onClick={adicionar} disabled={salvando}>
          + Adicionar
        </button>
      </div>
    </div>
  );
}