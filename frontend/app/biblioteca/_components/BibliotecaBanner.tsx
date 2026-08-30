'use client';

import { ArrowUpDown, Check, ChevronDown, Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { OrdenacaoBiblioteca } from '@/lib/biblioteca-ordenacao';
import styles from './BibliotecaBanner.module.css';

const OPCOES_ORDENACAO: { value: OrdenacaoBiblioteca; label: string }[] = [
  { value: 'recentes', label: 'Mais recentes' },
  { value: 'titulo', label: 'Título A-Z' },
  { value: 'nota', label: 'Nota maior' },
  { value: 'favoritos', label: 'Favoritos primeiro' },
  { value: 'status', label: 'Status / progresso' },
];

interface BibliotecaBannerProps {
  titulo: string;
  total: number;
  onAdicionar: () => void;
  rotuloAdicionar?: string;
  /** Capas reais usadas na composição visual da categoria. */
  capas?: (string | null)[];
  /** Textura existente usada apenas no fallback quando a categoria não tem capa. */
  imagemFundo?: string;
  ordenacao: OrdenacaoBiblioteca;
  onOrdenacaoChange: (ordenacao: OrdenacaoBiblioteca) => void;
  notaDisponivel?: boolean;
}

export default function BibliotecaBanner({
  titulo,
  total,
  onAdicionar,
  rotuloAdicionar = 'Adicionar',
  capas = [],
  imagemFundo,
  ordenacao,
  onOrdenacaoChange,
  notaDisponivel = true,
}: BibliotecaBannerProps) {
  const [menuAberto, setMenuAberto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const capasValidas = Array.from(new Set(capas.filter((c): c is string => !!c))).slice(0, 4);
  const textoContagem = `${total} ${total === 1 ? 'título' : 'títulos'} na sua coleção`;
  const rotuloOrdenacao = OPCOES_ORDENACAO.find((opcao) => opcao.value === ordenacao)?.label;

  useEffect(() => {
    if (!menuAberto) return;

    function fecharAoClicarFora(event: PointerEvent) {
      if (event.target instanceof Node && !menuRef.current?.contains(event.target)) setMenuAberto(false);
    }

    function fecharComEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuAberto(false);
    }

    document.addEventListener('pointerdown', fecharAoClicarFora);
    document.addEventListener('keydown', fecharComEscape);
    return () => {
      document.removeEventListener('pointerdown', fecharAoClicarFora);
      document.removeEventListener('keydown', fecharComEscape);
    };
  }, [menuAberto]);

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
        <div className={styles.colecaoAcoes}>
          <div className={styles.ordenacao} ref={menuRef}>
            <button
              type="button"
              className={styles.ordenacaoBotao}
              onClick={() => setMenuAberto((aberto) => !aberto)}
              aria-expanded={menuAberto}
              aria-haspopup="menu"
            >
              <ArrowUpDown aria-hidden="true" />
              <span>{rotuloOrdenacao}</span>
              <ChevronDown aria-hidden="true" />
            </button>
            {menuAberto ? (
              <div className={styles.ordenacaoMenu} role="menu" aria-label="Ordenar coleção">
                {OPCOES_ORDENACAO.map((opcao) => {
                  const desabilitada = opcao.value === 'nota' && !notaDisponivel;
                  return (
                    <button
                      key={opcao.value}
                      type="button"
                      role="menuitemradio"
                      aria-checked={ordenacao === opcao.value}
                      disabled={desabilitada}
                      onClick={() => {
                        onOrdenacaoChange(opcao.value);
                        setMenuAberto(false);
                      }}
                    >
                      <span>{opcao.label}</span>
                      {ordenacao === opcao.value ? <Check aria-hidden="true" /> : null}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
          <span className={styles.totalPill}>{total}</span>
        </div>
      </div>
    </>
  );
}
