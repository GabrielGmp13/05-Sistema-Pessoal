'use client';

import styles from './BibliotecaBanner.module.css';

interface BibliotecaBannerProps {
  titulo: string;
  total: number;
  onAdicionar: () => void;
  rotuloAdicionar?: string;
  /** capa_url dos itens da categoria — usado como fallback de mosaico
   *  se não houver imagem estática dedicada (ver imagemFundo). */
  capas?: (string | null)[];
  /** Caminho estático em /public, ex: '/biblioteca/banners/filmes.jpg'.
   *  Se informado, tem prioridade sobre o mosaico de capas. */
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
  const capasValidas = capas.filter((c): c is string => !!c);
  const mosaico: string[] = [];
  if (!imagemFundo) {
    for (let i = 0; i < 16; i++) {
      if (capasValidas.length === 0) break;
      mosaico.push(capasValidas[i % capasValidas.length]);
    }
  }

  return (
    <>
      <div className={styles.banner}>
        {imagemFundo ? (
          <div className={styles.imagemUnica} style={{ backgroundImage: `url(${imagemFundo})` }} />
        ) : mosaico.length > 0 ? (
          <div className={styles.mosaico}>
            {mosaico.map((url, i) => (
              <div key={i} className={styles.mosaicoItem} style={{ backgroundImage: `url(${url})` }} />
            ))}
          </div>
        ) : (
          <div className={styles.mosaicoFallback} />
        )}

        <div className={styles.topoOverlay}>
          <p className={styles.selo}>Minha Biblioteca</p>
        </div>

        <div className={styles.transicao} />

        <div className={styles.tituloWrapper}>
          <h1 className={styles.titulo}>{titulo}</h1>
        </div>
      </div>

      <div className={styles.subHeader}>
        <p className={styles.contagem}>
          {total} {total === 1 ? 'título na sua coleção' : 'títulos na sua coleção'}
        </p>
        <button className={styles.btnAdicionar} onClick={onAdicionar}>
          + {rotuloAdicionar}
        </button>
      </div>
    </>
  );
}