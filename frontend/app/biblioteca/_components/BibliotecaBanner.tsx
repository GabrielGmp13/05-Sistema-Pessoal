'use client';

import { Plus } from 'lucide-react';
import styles from './BibliotecaBanner.module.css';

interface BibliotecaBannerProps {
  titulo: string;
  total: number;
  onAdicionar: () => void;
  rotuloAdicionar?: string;
  /** Capas reais usadas na composição visual da categoria. */
  capas?: (string | null)[];
  /** Textura existente usada apenas no fallback quando a categoria não tem capa. */
  imagemFundo?: string;
}

export default function BibliotecaBanner({
  titulo,
  total,
  onAdicionar,
  rotuloAdicionar = 'Adicionar',
  capas = [],
  imagemFundo,
}: BibliotecaBannerProps) {
  const capasValidas = Array.from(new Set(capas.filter((c): c is string => !!c))).slice(0, 4);
  const textoContagem = `${total} ${total === 1 ? 'título' : 'títulos'} na sua coleção`;

  return (
    <>
      <div className={styles.banner}>
        {capasValidas.length === 0 && imagemFundo ? (
          <div
            className={styles.texturaFallback}
            style={{ backgroundImage: `url(${imagemFundo})` }}
            aria-hidden="true"
          />
        ) : null}

        <div className={styles.conteudo}>
          <p className={styles.selo}>Categoria ativa</p>
          <h1 className={styles.titulo}>{titulo}</h1>
          <p className={styles.contagem}>{textoContagem}</p>
          <button type="button" className={styles.btnAdicionar} onClick={onAdicionar}>
            <Plus aria-hidden="true" />
            {rotuloAdicionar}
          </button>
        </div>

        <div className={styles.colagem} aria-hidden="true">
          {capasValidas.length > 0 ? (
            capasValidas.map((url) => (
              <img
                key={url}
                className={styles.miniCapa}
                src={url}
                alt=""
              />
            ))
          ) : (
            <div className={styles.colagemFallback}>
              <span />
              <span />
              <span />
            </div>
          )}
        </div>
      </div>

      <div className={styles.colecaoCabecalho}>
        <div>
          <p className={styles.colecaoSelo}>Biblioteca pessoal</p>
          <h2>Sua coleção</h2>
        </div>
        <span className={styles.totalPill}>{total}</span>
      </div>
    </>
  );
}
