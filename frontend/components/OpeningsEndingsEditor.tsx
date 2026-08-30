'use client';

import { useEffect, useState } from 'react';
import {
  listarOpeningsEndings,
  criarOpeningEnding,
  apagarOpeningEnding,
  OpeningEnding,
  TipoOpeningEnding,
} from '@/lib/openings-endings';
import styles from './ListaEditavel.module.css';
import BuscaMetadados from '@/app/biblioteca/_components/BuscaMetadados';

interface Props {
  animeUuid: string;
}

const VAZIO = { tipo: 'opening' as TipoOpeningEnding, nome: '', artista: '', link_video: '' };

export default function OpeningsEndingsEditor({ animeUuid }: Props) {
  const [itens, setItens] = useState<OpeningEnding[]>([]);
  const [novo, setNovo] = useState(VAZIO);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [busca, setBusca] = useState('');

  async function carregar() {
    setCarregando(true);
    const res = await listarOpeningsEndings(animeUuid);
    setItens(res ?? []);
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animeUuid]);

  async function adicionar() {
    if (!novo.nome.trim()) return;
    setSalvando(true);
    const criado = await criarOpeningEnding(animeUuid, {
      tipo: novo.tipo,
      nome: novo.nome,
      artista: novo.artista || undefined,
      link_video: novo.link_video || undefined,
      ordem: itens.length,
    });
    if (criado) {
      setNovo(VAZIO);
      await carregar();
    }
    setSalvando(false);
  }

  async function remover(uuid: string) {
    await apagarOpeningEnding(uuid);
    await carregar();
  }

  return (
    <div className={styles.wrapper}>
      <h4>Openings / Endings</h4>
      <div className={styles.linhaAdicionar}>
        <input placeholder="Pesquisar música, artista ou anime" value={busca} onChange={(e) => setBusca(e.target.value)} />
      </div>
      <BuscaMetadados fonte="musica" termo={busca} onSelect={(resultado) => {
        setNovo((atual) => ({ ...atual, nome: resultado.titulo, artista: resultado.autor ?? '', link_video: resultado.linkOficial ?? '' }));
        setBusca('');
      }} />
      {carregando ? (
        <p className={styles.vazio}>Carregando...</p>
      ) : (
        <ul className={styles.lista}>
          {itens.map((item) => (
            <li key={item.uuid}>
              <span>
                <strong>{item.tipo === 'opening' ? 'OP' : 'ED'}</strong> {item.nome}
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
        <select
          value={novo.tipo}
          onChange={(e) => setNovo({ ...novo, tipo: e.target.value as TipoOpeningEnding })}
        >
          <option value="opening">Opening</option>
          <option value="ending">Ending</option>
        </select>
        <input
          placeholder="Nome"
          value={novo.nome}
          onChange={(e) => setNovo({ ...novo, nome: e.target.value })}
        />
        <input
          placeholder="Artista (opcional)"
          value={novo.artista}
          onChange={(e) => setNovo({ ...novo, artista: e.target.value })}
        />
        <input
          placeholder="Link da música ou vídeo (opcional)"
          value={novo.link_video}
          onChange={(e) => setNovo({ ...novo, link_video: e.target.value })}
        />
        <button type="button" onClick={adicionar} disabled={salvando}>
          + Adicionar
        </button>
      </div>
    </div>
  );
}
