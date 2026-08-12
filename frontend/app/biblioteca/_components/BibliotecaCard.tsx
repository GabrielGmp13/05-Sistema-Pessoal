'use client';

import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useEffect, useRef } from 'react';

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
  placeholder?: string;
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
  placeholder = '🎬',
}: BibliotecaCardProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const generoPrincipal = generos[0]?.nome;

  useEffect(() => {
    if (!menuAberto) return;

    function handlePointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !menuRef.current?.contains(event.target)) {
        onAlternarMenu();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      onAlternarMenu();
      buttonRef.current?.focus();
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuAberto, onAlternarMenu]);

  return (
    <div className={styles.card}>
      <div className={styles.capaWrapper} onClick={onClick}>
        {capaUrl ? (
          <img className={styles.capa} src={capaUrl} alt={titulo} loading="lazy" />
        ) : (
          <div className={styles.capaPlaceholder}>
            <span>{placeholder}</span>
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
          {ano != null ? <span className={styles.ano}>{ano}</span> : <span />}
          {nota != null && (
            <span className={styles.nota}>
              <span className={styles.estrelaIcon}>★</span>
              {Number(nota).toFixed(1)}
            </span>
          )}
        </div>

        {generoPrincipal && <p className={styles.genero}>{generoPrincipal}</p>}
      </div>

      <div ref={menuRef} className={styles.menuWrapper}>
        <button
          ref={buttonRef}
          type="button"
          className={`${styles.btnIcon} ${menuAberto ? styles.btnIconVisivel : ''}`}
          onClick={(event) => {
            event.stopPropagation();
            onAlternarMenu();
          }}
          aria-label={`Ações de ${titulo}`}
          aria-haspopup="menu"
          aria-expanded={menuAberto}
          title="Ações"
        >
          <MoreHorizontal aria-hidden="true" />
        </button>
        {menuAberto && (
          <div className={styles.menuDropdown} role="menu">
            <button
              type="button"
              role="menuitem"
              onClick={(event) => {
                event.stopPropagation();
                onEditar();
              }}
            >
              <Pencil aria-hidden="true" />
              Editar
            </button>
            <button
              type="button"
              role="menuitem"
              className={styles.menuItemPerigo}
              onClick={(event) => {
                event.stopPropagation();
                onApagar();
              }}
            >
              <Trash2 aria-hidden="true" />
              Apagar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
