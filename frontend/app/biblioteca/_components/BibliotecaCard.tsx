'use client';

import { Heart, MoreHorizontal, Pencil, Star, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { getSignedUrl } from '@/lib/supabase';

import styles from './BibliotecaCard.module.css';

const STATUS_LABEL: Record<string, string> = {
  quero_ver: 'Quero ver',
  assistindo: 'Assistindo',
  assistido: 'Assistido',
  quero_ler: 'Quero ler',
  lendo: 'Lendo',
  lido: 'Lido',
  quero_ouvir: 'Quero ouvir',
  ouvindo: 'Ouvindo',
  concluido: 'Concluído',
  pausado: 'Pausado',
  abandonado: 'Abandonado',
};

interface BibliotecaCardProps {
  titulo: string;
  subtitulo?: string | null;
  capaUrl: string | null;
  capaPath?: string | null;
  favorito: boolean;
  nota: number | null;
  ano: number | null;
  generos: { nome: string }[];
  status?: string | null;
  detalhe?: string | null;
  onClick: () => void;
  onEditar: () => void;
  onAlternarFavorito: () => void;
  onApagar: () => void;
  menuAberto: boolean;
  onAlternarMenu: () => void;
  placeholder?: string;
}

export default function BibliotecaCard({
  titulo,
  subtitulo,
  capaUrl,
  capaPath,
  favorito,
  nota,
  ano,
  generos,
  status,
  detalhe,
  onClick,
  onEditar,
  onAlternarFavorito,
  onApagar,
  menuAberto,
  onAlternarMenu,
  placeholder = '🎬',
}: BibliotecaCardProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const generosVisiveis = generos.slice(0, 2);
  const [capaPrivada, setCapaPrivada] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    if (!capaPath) { setCapaPrivada(null); return; }
    void getSignedUrl('capas', capaPath, 3600).then((url) => { if (ativo) setCapaPrivada(url); });
    return () => { ativo = false; };
  }, [capaPath]);

  const statusLabel = status ? STATUS_LABEL[status] ?? status : null;

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
        {capaPrivada ?? capaUrl ? (
          <img className={styles.capa} src={(capaPrivada ?? capaUrl) as string} alt={titulo} loading="lazy" />
        ) : (
          <div className={styles.capaPlaceholder}>
            <span>{placeholder}</span>
          </div>
        )}

        {nota != null ? (
          <span className={styles.notaBadge} aria-label={`Nota ${Number(nota).toFixed(1)} de 5`}>
            <Star aria-hidden="true" />
            {Number(nota).toFixed(1)}
          </span>
        ) : null}

        <button
          type="button"
          className={`${styles.favorito} ${favorito ? styles.favoritoAtivo : ''}`}
          aria-label={favorito ? `Remover ${titulo} dos favoritos` : `Adicionar ${titulo} aos favoritos`}
          aria-pressed={favorito}
          title={favorito ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          onClick={(event) => {
            event.stopPropagation();
            onAlternarFavorito();
          }}
        >
          <Heart aria-hidden="true" />
        </button>

        {statusLabel ? (
          <span className={styles.status}>
            <i aria-hidden="true" />
            {statusLabel}
          </span>
        ) : null}
      </div>

      <div className={styles.body} onClick={onClick}>
        <h3 className={styles.nome}>{titulo}</h3>
        {subtitulo ? <p className={styles.subtitulo}>{subtitulo}</p> : null}

        <div className={styles.linhaMeta}>
          {ano != null ? <span>{ano}</span> : null}
          {ano != null && detalhe ? <span aria-hidden="true">·</span> : null}
          {detalhe ? <span>{detalhe}</span> : null}
        </div>

        {generosVisiveis.length > 0 ? (
          <div className={styles.generos}>
            {generosVisiveis.map((genero) => (
              <span key={genero.nome}>{genero.nome}</span>
            ))}
          </div>
        ) : null}
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
                onAlternarMenu();
                onAlternarFavorito();
              }}
            >
              <Heart aria-hidden="true" />
              {favorito ? 'Remover favorito' : 'Favoritar'}
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={(event) => {
                event.stopPropagation();
                onAlternarMenu();
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
                onAlternarMenu();
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
