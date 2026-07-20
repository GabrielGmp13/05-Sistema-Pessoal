'use client';

import styles from './BibliotecaBanner.module.css';

interface BibliotecaBannerProps {
  titulo: string;
  total: number;
  onAdicionar: () => void;
  rotuloAdicionar?: string;
}

export default function BibliotecaBanner({
  titulo,
  total,
  onAdicionar,
  rotuloAdicionar = 'Adicionar',
}: BibliotecaBannerProps) {
  return (
    <div className={styles.banner}>
      <h1 className={styles.titulo}>{titulo}</h1>
      <div className={styles.meta}>
        <p className={styles.contagem}>
          {total} {total === 1 ? 'título na sua coleção' : 'títulos na sua coleção'}
        </p>
        <button className={styles.btnAdicionar} onClick={onAdicionar}>
          + {rotuloAdicionar}
        </button>
      </div>
    </div>
  );
}