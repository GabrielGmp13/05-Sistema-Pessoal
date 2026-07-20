'use client';

import styles from './BibliotecaCard.module.css';

interface BibliotecaCardProps {
  titulo: string;
  capaUrl: string | null;
  favorito: boolean;
  nota: number | null;
  ano: number | null;
  generos: { nome: string }[];
  onClick: () => void;
  onEditar: () => void;
  onApagar: () => void;
  menuAberto: boolean;
  onAlternarMenu: () => void;
}

export default function BibliotecaCard({
  titulo,
  capaUrl,
  favorito,
  nota,
  ano,
  generos,
  onClick,
  onEditar,
  onApagar,
  menuAberto,
  onAlternarMenu,
}: BibliotecaCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.capaWrapper} onClick={onClick}>
        {capaUrl ? (
          <img
            className={styles.capa}
            src={capaUrl}
            alt={titulo}
            loading="lazy"
          />
        ) : (
          <div className={styles.capaPlaceholder}>
            <span>🎬</span>
          </div>
        )}

        {favorito && (
          <span className={styles.favorito} aria-label="Favorito">
            ❤️
          </span>
        )}
      </div>

      <div className={styles.body} onClick={onClick}>
        <h3 className={styles.nome}>{titulo}</h3>

        <div className={styles.linhaMeta}>
          {nota != null && (
            <span className={styles.nota}>
              <span className={styles.estrelaIcon}>★</span>
              {Number(nota).toFixed(1)}
            </span>
          )}

          {ano != null && (
            <span className={styles.ano}>{ano}</span>
          )}
        </div>

        {generos.length > 0 && (
          <div className={styles.generos}>
            {generos.map((g, i) => (
              <span key={i} className={styles.genero}>
                {g.nome}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className={styles.menuWrapper}>
        <button
          className={styles.btnIcon}
          onClick={(e) => {
            e.stopPropagation();
            onAlternarMenu();
          }}
          title="Ações"
        >
          ⋯
        </button>
        {menuAberto && (
          <div className={styles.menuDropdown}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditar();
              }}
            >
              Editar
            </button>
            <button
              className={styles.menuItemPerigo}
              onClick={(e) => {
                e.stopPropagation();
                onApagar();
              }}
            >
              Apagar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}