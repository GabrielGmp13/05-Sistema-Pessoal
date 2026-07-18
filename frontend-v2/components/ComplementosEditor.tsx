'use client';

import { useEffect, useState } from 'react';
import { listarComplementosDoAnime, criarFilme, Filme } from '@/lib/filmes';
import styles from './ListaEditavel.module.css';

interface Props {
  animeUuid: string;
}

type TipoComplemento = 'filme' | 'ova' | 'ona' | 'special';

const LABEL_TIPO: Record<TipoComplemento, string> = {
  filme: 'Filme',
  ova: 'OVA',
  ona: 'ONA',
  special: 'Special',
};

const VAZIO = { titulo: '', tipo_complemento: 'ova' as TipoComplemento };

// Complementos (filme/OVA/ONA/Special) não são tabela própria — DEC-025:
// são linhas reais em `filmes`, com anime_uuid apontando pra este anime.
// Editáveis normalmente na tela de Filmes da Biblioteca também.
export default function ComplementosEditor({ animeUuid }: Props) {
  const [itens, setItens] = useState<Filme[]>([]);
  const [novo, setNovo] = useState(VAZIO);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    setCarregando(true);
    const res = await listarComplementosDoAnime(animeUuid);
    setItens(res ?? []);
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animeUuid]);

  async function adicionar() {
    if (!novo.titulo.trim()) return;
    setSalvando(true);
    const criado = await criarFilme({
      titulo: novo.titulo,
      anime_uuid: animeUuid,
      tipo_complemento: novo.tipo_complemento,
    });
    if (criado) {
      setNovo(VAZIO);
      await carregar();
    }
    setSalvando(false);
  }

  return (
    <div className={styles.wrapper}>
      <h4>Complementos (Filme / OVA / ONA / Special)</h4>
      <p className={styles.vazio} style={{ marginBottom: '0.5rem' }}>
        Cada complemento é um filme real, editável também na tela de Filmes.
      </p>
      {carregando ? (
        <p className={styles.vazio}>Carregando...</p>
      ) : (
        <ul className={styles.lista}>
          {itens.map((item) => (
            <li key={item.uuid}>
              <span>
                <strong>{item.titulo}</strong>
                {item.tipo_complemento
                  ? ` — ${LABEL_TIPO[item.tipo_complemento as TipoComplemento] ?? item.tipo_complemento}`
                  : ''}
              </span>
            </li>
          ))}
          {itens.length === 0 && <li className={styles.vazio}>Nenhum complemento ainda.</li>}
        </ul>
      )}

      <div className={styles.linhaAdicionar}>
        <input
          placeholder="Título"
          value={novo.titulo}
          onChange={(e) => setNovo({ ...novo, titulo: e.target.value })}
        />
        <select
          value={novo.tipo_complemento}
          onChange={(e) =>
            setNovo({ ...novo, tipo_complemento: e.target.value as TipoComplemento })
          }
        >
          <option value="filme">Filme</option>
          <option value="ova">OVA</option>
          <option value="ona">ONA</option>
          <option value="special">Special</option>
        </select>
        <button type="button" onClick={adicionar} disabled={salvando}>
          + Adicionar
        </button>
      </div>
    </div>
  );
}