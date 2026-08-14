'use client';

import Link from 'next/link';
import { Plus, Search, Tags } from 'lucide-react';
import styles from './Sidebar.module.css';

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
  acaoSecundaria?: { href: string; label: string };
}

export default function Sidebar({
  itens,
  ativoId,
  onSelecionar,
  onAdicionar,
  rotuloAdicionar = 'Adicionar',
  busca = '',
  onBuscaChange,
  acaoSecundaria,
}: SidebarProps) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.corpo}>
        {/* Busca */}
        {onBuscaChange && (
          <div className={styles.buscaWrapper}>
            <Search className={styles.buscaIcone} aria-hidden="true" />
            <input
              className={styles.buscaInput}
              type="text"
              placeholder="Buscar na biblioteca"
              aria-label="Buscar na biblioteca"
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
                    type="button"
                    className={`${styles.item} ${ativo ? styles.itemAtivo : ''}`}
                    onClick={() => onSelecionar(item.id)}
                  >
                    {item.icon && <span className={styles.icone}>{item.icon}</span>}
                    <span className={styles.label}>{item.label}</span>
                    {item.count != null && (
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
        {acaoSecundaria ? (
          <Link href={acaoSecundaria.href} className={styles.btnSecundario}>
            <Tags aria-hidden="true" />
            {acaoSecundaria.label}
          </Link>
        ) : null}
        <button type="button" className={styles.btnAdicionar} onClick={onAdicionar}>
          <Plus aria-hidden="true" />
          {rotuloAdicionar}
        </button>
      </div>
    </aside>
  );
}
