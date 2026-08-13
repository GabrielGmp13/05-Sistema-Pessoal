'use client';

import { useEffect, useRef, useState } from 'react';

import { buscarMetadados, type FonteMetadados, type ResultadoMetadados } from '@/lib/biblioteca-metadados';
import styles from './BibliotecaSection.module.css';

interface BuscaMetadadosProps {
  fonte: FonteMetadados;
  termo: string;
  onSelect: (resultado: ResultadoMetadados) => void;
}

export default function BuscaMetadados({ fonte, termo, onSelect }: BuscaMetadadosProps) {
  const [resultados, setResultados] = useState<ResultadoMetadados[]>([]);
  const [mensagem, setMensagem] = useState('');
  const [buscando, setBuscando] = useState(false);
  const termosSelecionados = useRef(new Set<string>());

  useEffect(() => {
    const consulta = termo.trim();
    if (consulta.length < 2) {
      setResultados([]);
      setMensagem('');
      setBuscando(false);
      return;
    }

    if (termosSelecionados.current.delete(consulta)) return;

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setBuscando(true);
      setMensagem('');
      try {
        const resposta = await buscarMetadados(fonte, consulta, controller.signal);
        setResultados(resposta.resultados);
        setMensagem(resposta.mensagem ?? (resposta.resultados.length === 0 ? 'Nenhum resultado encontrado. Continue preenchendo manualmente.' : ''));
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setResultados([]);
        setMensagem('Busca automática indisponível. Continue preenchendo manualmente.');
      } finally {
        if (!controller.signal.aborted) setBuscando(false);
      }
    }, 550);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [fonte, termo]);

  return (
    <div className={styles.buscaMetadados} aria-live="polite">
      {buscando && <p className={styles.buscaMetadadosMensagem}>Buscando sugestões...</p>}
      {mensagem && <p className={styles.buscaMetadadosMensagem}>{mensagem}</p>}
      {resultados.length > 0 && (
        <div className={styles.resultadosMetadados} aria-label="Sugestões de preenchimento automático">
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
              <span><strong>{resultado.titulo}</strong><small>{resultado.autor ?? resultado.ano ?? resultado.subtitulo ?? ''}</small></span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
