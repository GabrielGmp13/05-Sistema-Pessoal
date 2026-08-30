'use client';

import { useEffect, useState } from 'react';
import { listarComplementosDoAnime, criarFilme, Filme } from '@/lib/filmes';
import styles from './ListaEditavel.module.css';
import BuscaMetadados from '@/app/biblioteca/_components/BuscaMetadados';
import type { ResultadoMetadados } from '@/lib/biblioteca-metadados';

interface Props {
  animeUuid: string;
  anilistId?: string | null;
}

type TipoComplemento = 'filme' | 'ova' | 'ona' | 'special';

const LABEL_TIPO: Record<TipoComplemento, string> = {
  filme: 'Filme',
  ova: 'OVA',
  ona: 'ONA',
  special: 'Special',
};

const VAZIO = { titulo: '', tipo_complemento: 'ova' as TipoComplemento };
const FORMATOS_COMPLEMENTO = ['MOVIE', 'OVA', 'ONA', 'SPECIAL'];

// Complementos (filme/OVA/ONA/Special) não são tabela própria — DEC-025:
// são linhas reais em `filmes`, com anime_uuid apontando pra este anime.
// Editáveis normalmente na tela de Filmes da Biblioteca também.
export default function ComplementosEditor({ animeUuid, anilistId }: Props) {
  const [itens, setItens] = useState<Filme[]>([]);
  const [novo, setNovo] = useState(VAZIO);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [selecionado, setSelecionado] = useState<ResultadoMetadados | null>(null);
  const [buscaObra, setBuscaObra] = useState('');

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
      titulo_original: selecionado?.titulo,
      sinopse: selecionado?.descricao,
      anilist_id: selecionado?.anilistId,
      mal_id: selecionado?.malId,
      anime_uuid: animeUuid,
      tipo_complemento: novo.tipo_complemento,
      capa_url: selecionado?.capaUrl,
      ano_lancamento: selecionado?.ano,
      duracao_minutos: selecionado?.duracaoMinutos,
      link_anilist: selecionado?.linkOficial,
      link_mal: selecionado?.malId ? `https://myanimelist.net/anime/${selecionado.malId}` : undefined,
    });
    if (criado) {
      setNovo(VAZIO);
      setSelecionado(null);
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
      <div className={styles.linhaAdicionar}>
        <input placeholder="Pesquisar filme, OVA, ONA ou especial" value={buscaObra} onChange={(e) => setBuscaObra(e.target.value)} />
      </div>
      <BuscaMetadados fonte="jikan_anime" termo={buscaObra} formatos={FORMATOS_COMPLEMENTO} onSelect={(resultado) => {
        const tipos: Record<string, TipoComplemento> = { MOVIE: 'filme', OVA: 'ova', ONA: 'ona', SPECIAL: 'special' };
        const tipo = tipos[resultado.formato ?? ''];
        if (!tipo) return;
        setSelecionado(resultado);
        setNovo({ titulo: resultado.subtitulo || resultado.titulo, tipo_complemento: tipo });
        setBuscaObra('');
      }} />
      {anilistId ? <p className={styles.vazio}>Sugestões relacionadas pela AniList</p> : null}
      {anilistId ? <BuscaMetadados fonte="anilist_relacoes" termo={anilistId} formatos={FORMATOS_COMPLEMENTO} onSelect={(resultado) => {
        const tipos: Record<string, TipoComplemento> = { MOVIE: 'filme', OVA: 'ova', ONA: 'ona', SPECIAL: 'special' };
        const tipo = tipos[resultado.formato ?? ''];
        if (!tipo) return;
        setSelecionado(resultado);
        setNovo({ titulo: resultado.subtitulo || resultado.titulo, tipo_complemento: tipo });
      }} /> : <p className={styles.vazio}>Selecione um resultado da AniList no cadastro principal para pesquisar complementos.</p>}
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
