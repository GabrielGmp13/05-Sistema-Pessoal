'use client';

import { useEffect, useState } from 'react';
import { listarComplementosDoAnime, criarFilme, Filme } from '@/lib/filmes';
import styles from './ListaEditavel.module.css';
import BuscaMetadados from '@/app/biblioteca/_components/BuscaMetadados';
import { completarResultadoAniList, type ResultadoMetadados } from '@/lib/biblioteca-metadados';

interface Props {
  animeUuid: string;
  anilistId?: string | null;
  onChanged?: () => void | Promise<void>;
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
export default function ComplementosEditor({ animeUuid, anilistId, onChanged }: Props) {
  const [itens, setItens] = useState<Filme[]>([]);
  const [novo, setNovo] = useState(VAZIO);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [selecionado, setSelecionado] = useState<ResultadoMetadados | null>(null);
  const [buscaObra, setBuscaObra] = useState('');
  const [erro, setErro] = useState('');

  async function carregar() {
    setCarregando(true);
    const res = await listarComplementosDoAnime(animeUuid);
    setItens(res ?? []);
    setCarregando(false);
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void carregar(), 0);
    return () => window.clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animeUuid]);

  async function adicionar() {
    if (!selecionado || !novo.titulo.trim()) return;
    setErro('');
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
      diretor: selecionado?.diretor,
      roteirista: selecionado?.roteirista,
      produtores: selecionado?.produtores,
      estudio: selecionado?.estudio ?? selecionado?.autor,
    });
    if (criado) {
      setNovo(VAZIO);
      setSelecionado(null);
      await carregar();
      await onChanged?.();
    } else {
      setErro('Não foi possível adicionar este complemento. A atualização do banco pode ainda não ter sido aplicada.');
    }
    setSalvando(false);
  }

  async function selecionarObra(resultado: ResultadoMetadados) {
    const completo = await completarResultadoAniList(resultado);
    const tipos: Record<string, TipoComplemento> = { MOVIE: 'filme', OVA: 'ova', ONA: 'ona', SPECIAL: 'special' };
    const tipo = tipos[completo.formato ?? ''];
    if (!tipo) return;
    setSelecionado(completo);
    setNovo({ titulo: completo.subtitulo || completo.titulo, tipo_complemento: tipo });
    setBuscaObra('');
  }

  return (
    <div className={styles.wrapper}>
      <h4>Complementos (Filme / OVA / ONA / Special)</h4>
      <p className={styles.vazio} style={{ marginBottom: '0.5rem' }}>
        Cada complemento é um filme real, editável também na tela de Filmes.
      </p>
      {erro ? <p className={styles.erro}>{erro}</p> : null}
      <div className={styles.linhaAdicionar}>
        <input placeholder="Pesquisar filme, OVA, ONA ou especial" value={buscaObra} onChange={(e) => setBuscaObra(e.target.value)} />
      </div>
      <BuscaMetadados fonte="jikan_anime" termo={buscaObra} formatos={FORMATOS_COMPLEMENTO} onSelect={(resultado) => void selecionarObra(resultado)} />
      {anilistId ? <p className={styles.vazio}>Sugestões relacionadas pela AniList</p> : null}
      {anilistId ? <BuscaMetadados fonte="anilist_relacoes" termo={anilistId} formatos={FORMATOS_COMPLEMENTO} onSelect={(resultado) => void selecionarObra(resultado)} /> : <p className={styles.vazio}>Selecione um resultado da AniList no cadastro principal para pesquisar complementos.</p>}
      {selecionado ? <div className={styles.obraSelecionada}>
        {selecionado.capaUrl ? <img src={selecionado.capaUrl} alt="" /> : null}
        <span><strong>{selecionado.titulo}</strong>{selecionado.subtitulo ? <small>{selecionado.subtitulo}</small> : null}<small>{[selecionado.formato, selecionado.ano].filter(Boolean).join(' · ')}</small></span>
      </div> : null}
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

      {selecionado ? <div className={styles.confirmarObra}><button type="button" onClick={adicionar} disabled={salvando}>{salvando ? 'Adicionando...' : `Adicionar como ${LABEL_TIPO[novo.tipo_complemento]}`}</button></div> : null}
    </div>
  );
}
