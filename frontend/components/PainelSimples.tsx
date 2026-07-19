'use client';

import { useEffect } from 'react';
import styles from './PainelDetalheObra.module.css';
import type { CampoInfo } from './PainelDetalheObra';

interface PainelSimplesProps {
  aberto: boolean;
  onFechar: () => void;
  titulo: string;
  bannerUrl?: string | null;
  capaUrl?: string | null;
  infoGeral: CampoInfo[];
  children?: React.ReactNode; // seções extras específicas do tipo (ex: volumes, anotações)
}

// Versão simplificada do painel de detalhe, para tipos de mídia sem
// elenco/trilha sonora (Mangás, Livros, Podcasts). Mesmo visual/comportamento
// do PainelDetalheObra (leitura, fecha com Esc/backdrop/✕) — ver DESIGN.md.
export default function PainelSimples({
  aberto,
  onFechar,
  titulo,
  bannerUrl,
  capaUrl,
  infoGeral,
  children,
}: PainelSimplesProps) {
  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === 'Escape') onFechar();
    }
    if (aberto) document.addEventListener('keydown', aoTeclar);
    return () => document.removeEventListener('keydown', aoTeclar);
  }, [aberto, onFechar]);

  if (!aberto) return null;

  const imagemTopo = bannerUrl || capaUrl || null;

  return (
    <div className={styles.overlay} onClick={onFechar}>
      <div className={styles.painel} onClick={(e) => e.stopPropagation()}>
        <button className={styles.btnFechar} onClick={onFechar} title="Fechar (Esc)">
          ✕
        </button>

        {imagemTopo && (
          <div className={styles.banner} style={{ backgroundImage: `url(${imagemTopo})` }} />
        )}

        <div className={styles.conteudo}>
          <h1 className={styles.titulo}>{titulo}</h1>

          {infoGeral.length > 0 && (
            <section className={styles.secao}>
              <div className={styles.infoGrid}>
                {infoGeral.map((campo) => (
                  <div key={campo.label} className={styles.infoItem}>
                    <span className={styles.infoLabel}>{campo.label}</span>
                    <span className={styles.infoValor}>{campo.valor}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {children}
        </div>
      </div>
    </div>
  );
}