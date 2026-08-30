'use client';

import { useEffect, useRef, useState } from 'react';

import { buscarMetadados, type FonteMetadados, type ResultadoMetadados } from '@/lib/biblioteca-metadados';
import styles from './BibliotecaSection.module.css';

const FONTE_LABEL: Record<FonteMetadados, string> = {
  youtube: 'YouTube', tmdb_filme: 'TMDB', tmdb_serie: 'TMDB', google_livros: 'Google Books + Open Library',
  jikan_anime: 'AniList + Jikan', jikan_manga: 'AniList + Jikan', itunes_podcast: 'iTunes',
  anilist_relacoes: 'relações da AniList', musica: 'YouTube + Apple Music',
  anilist_detalhe: 'AniList',
  artigo: 'site do artigo',
};

interface BuscaMetadadosProps {
  fonte: FonteMetadados;
  termo: string;
  onSelect: (resultado: ResultadoMetadados) => void;
  formatos?: string[];
  relacoes?: string[];
}

export default function BuscaMetadados({ fonte, termo, onSelect, formatos, relacoes }: BuscaMetadadosProps) {
  const [resultados, setResultados] = useState<ResultadoMetadados[]>([]);
  const [mensagem, setMensagem] = useState('');
  const [buscando, setBuscando] = useState(false);
  const termosSelecionados = useRef(new Set<string>());

  useEffect(() => {
    const consulta = termo.trim();
    if (consulta.length < 2) {
      setResultados([]);
      setMensagem('');
      return;
    }

    if (termosSelecionados.current.delete(consulta)) return;

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setBuscando(true);
      setMensagem('');
      try {
        const resposta = await buscarMetadados(fonte, consulta, controller.signal);
        const resultadosFiltrados = resposta.resultados.filter((resultado) =>
          (!formatos || formatos.includes(resultado.formato ?? '')) &&
          (!relacoes || relacoes.includes(resultado.tipoRelacao ?? ''))
        );
        setResultados(resultadosFiltrados);
        setMensagem(resposta.mensagem ?? (resultadosFiltrados.length === 0 ? 'Nenhum resultado compatível encontrado. Continue preenchendo manualmente.' : ''));
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setResultados([]);
        setMensagem('Busca automática indisponível. Continue preenchendo manualmente.');
      } finally {
        if (!controller.signal.aborted) setBuscando(false);
      }
    }, 280);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [fonte, termo, formatos, relacoes]);

  const consultaValida = termo.trim().length >= 2;

  return (
    <div className={styles.buscaMetadados} aria-live="polite">
      {!consultaValida ? <p className={styles.buscaMetadadosMensagem}>Digite ao menos 2 caracteres para buscar no {FONTE_LABEL[fonte]}. O cadastro manual continua disponível.</p> : null}
      {consultaValida && buscando && <p className={styles.buscaMetadadosMensagem}>Buscando sugestões...</p>}
      {consultaValida && mensagem && <p className={styles.buscaMetadadosMensagem}>{mensagem}</p>}
      {consultaValida && resultados.length > 0 && (
        <div className={styles.resultadosMetadados} aria-label="Sugestões de preenchimento automático">
          <p className={styles.fonteMetadados}>Resultados de {FONTE_LABEL[fonte]} · selecione para preencher e revise antes de salvar</p>
          {resultados.map((resultado) => (
            <button
              type="button"
              key={resultado.id}
              className={styles.resultadoMetadados}
              onClick={() => {
                [resultado.titulo, resultado.linkOficial].filter(Boolean).forEach((valor) => termosSelecionados.current.add(valor as string));
                onSelect(resultado);
                setResultados([]);
                setMensagem('Dados preenchidos. Revise antes de salvar.');
              }}
            >
              {resultado.capaUrl ? <img src={resultado.capaUrl} alt="" /> : <span className={styles.resultadoSemCapa} />}
              <span><strong>{resultado.titulo}</strong><small>{[resultado.subtitulo ?? resultado.autor, resultado.formato, resultado.ano, resultado.episodios ? `${resultado.episodios} episódios` : null, resultado.idioma?.toUpperCase(), resultado.siteOrigem, resultado.duracaoMinutos ? `${resultado.duracaoMinutos} min` : null].filter(Boolean).join(' · ')}</small>{resultado.descricao ? <em>{resultado.descricao}</em> : null}</span>
            </button>
          ))}
          <p className={styles.fonteMetadados}>A disponibilidade e as quotas pertencem ao provedor. Falhas nunca bloqueiam o cadastro manual.</p>
        </div>
      )}
    </div>
  );
}
