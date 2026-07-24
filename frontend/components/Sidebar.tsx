'use client';

import { useEffect, useState } from 'react';
import styles from './Sidebar.module.css';
import { getSession } from '@/lib/supabase';

export interface SidebarItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

interface SidebarProps {
  itens: SidebarItem[];
  ativoId: string;
  onSelecionar: (id: string) => void;
  onAdicionar: () => void;
  rotuloAdicionar?: string;
  busca?: string;
  onBuscaChange?: (valor: string) => void;
}

interface PerfilUsuario {
  nome: string;
  avatarUrl: string | null;
  backgroundUrl: string | null;
}

export default function Sidebar({
  itens,
  ativoId,
  onSelecionar,
  onAdicionar,
  rotuloAdicionar = 'Adicionar',
  busca = '',
  onBuscaChange,
}: SidebarProps) {
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null);

  useEffect(() => {
    async function carregarPerfil() {
      const session = await getSession();
      const meta = session?.user?.user_metadata;
      setPerfil({
        nome: meta?.full_name || meta?.name || session?.user?.email?.split('@')[0] || 'Usuário',
        avatarUrl: meta?.avatar_url || null,
        // campo opcional — se você quiser um banner de perfil no futuro, salve
        // em user_metadata.background_url; até lá cai no fallback só-cor
        backgroundUrl: meta?.background_url || null,
      });
    }
    carregarPerfil();
  }, []);

  const inicial = perfil?.nome?.charAt(0).toUpperCase() || 'U';

  return (
    <aside className={styles.sidebar}>
      {/* Faixa de perfil */}
      <div
        className={styles.perfilFaixa}
        style={
          perfil?.backgroundUrl
            ? { backgroundImage: `url(${perfil.backgroundUrl})` }
            : undefined
        }
      >
        <div className={styles.perfilOverlay} />
        {perfil && (
          <div className={styles.perfil}>
            <div className={styles.avatar}>
              {perfil.avatarUrl ? (
                <img className={styles.avatarImg} src={perfil.avatarUrl} alt={perfil.nome} />
              ) : (
                <span className={styles.avatarFallback}>{inicial}</span>
              )}
            </div>
            <div className={styles.perfilInfo}>
              <span className={styles.perfilNome}>{perfil.nome}</span>
              <span className={styles.perfilSub}>Sistema Pessoal</span>
            </div>
          </div>
        )}
      </div>

      <div className={styles.corpo}>
        {/* Busca */}
        {onBuscaChange && (
          <div className={styles.buscaWrapper}>
            <input
              className={styles.buscaInput}
              type="text"
              placeholder="Buscar..."
              value={busca}
              onChange={(e) => onBuscaChange(e.target.value)}
            />
          </div>
        )}

        <p className={styles.secaoLabel}>Biblioteca</p>

        <nav>
          <ul className={styles.lista}>
            {itens.map((item) => {
              const ativo = ativoId === item.id;
              return (
                <li key={item.id}>
                  <button
                    className={`${styles.item} ${ativo ? styles.itemAtivo : ''}`}
                    onClick={() => onSelecionar(item.id)}
                  >
                    {item.icon && <span className={styles.icone}>{item.icon}</span>}
                    <span className={styles.label}>{item.label}</span>
                    {ativo && item.count != null && (
                      <span className={styles.count}>{item.count}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <div className={styles.rodape}>
        <button className={styles.btnAdicionar} onClick={onAdicionar}>
          + {rotuloAdicionar}
        </button>
      </div>
    </aside>
  );
}