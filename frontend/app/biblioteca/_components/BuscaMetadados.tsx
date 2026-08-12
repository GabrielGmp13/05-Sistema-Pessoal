'use client';

import { Search } from 'lucide-react';
import { useState } from 'react';

import { buscarMetadados, type FonteMetadados, type ResultadoMetadados } from '@/lib/biblioteca-metadados';
import styles from './BibliotecaSection.module.css';

interface BuscaMetadadosProps {
  fonte: FonteMetadados;
  termoInicial?: string;
  onSelect: (resultado: ResultadoMetadados) => void;
}

export default function BuscaMetadados({ fonte, termoInicial = '', onSelect }: BuscaMetadadosProps) {
  const [termo, setTermo] = useState(termoInicial);
  const [resultados, setResultados] = useState<ResultadoMetadados[]>([]);
  const [mensagem, setMensagem] = useState('');
  const [buscando, setBuscando] = useState(false);
  const youtube = fonte === 'youtube';

  async function buscar() {
    if (!termo.trim()) return;
    setBuscando(true);
    setMensagem('');
    setResultados([]);
    try {
      const resposta = await buscarMetadados(fonte, termo);
      setResultados(resposta.resultados);
      setMensagem(resposta.mensagem ?? (resposta.resultados.length === 0 ? 'Nenhum resultado encontrado.' : ''));
    } catch (error) {
      setMensagem(error instanceof Error ? error.message : 'Não foi possível concluir a busca.');
    } finally {
      setBuscando(false);
    }
  }

  return (
    <div className={styles.buscaMetadados}>
      <span className={styles.buscaMetadadosTitulo}>Preenchimento automático</span>
      <div className={styles.buscaMetadadosLinha}>
        <input
          type={youtube ? 'url' : 'search'}
          value={termo}
          placeholder={youtube ? 'Cole a URL do YouTube' : 'Busque pelo título'}
          onChange={(event) => setTermo(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              void buscar();
            }
          }}
        />
        <button type="button" className={styles.btnGhost} onClick={() => void buscar()} disabled={buscando || !termo.trim()}>
          <Search size={16} aria-hidden="true" />
          {buscando ? 'Buscando...' : youtube ? 'Ler URL' : 'Buscar'}
        </button>
      </div>
      {mensagem && <p className={styles.buscaMetadadosMensagem}>{mensagem}</p>}
      {resultados.length > 0 && (
        <div className={styles.resultadosMetadados}>
          {resultados.map((resultado) => (
            <button
              type="button"
              key={resultado.id}
              className={styles.resultadoMetadados}
              onClick={() => {
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
