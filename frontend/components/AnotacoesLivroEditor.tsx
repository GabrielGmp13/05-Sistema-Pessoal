'use client';

import { useEffect, useState } from 'react';
import {
  listarAnotacoesLivro,
  criarAnotacaoLivro,
  apagarAnotacaoLivro,
  LivroAnotacao,
  TipoAnotacaoLivro,
} from '@/lib/livros-anotacoes';
import styles from './ListaEditavel.module.css';

interface Props {
  livroUuid: string;
}

const VAZIO = { tipo: 'anotacao' as TipoAnotacaoLivro, pagina: '', texto: '' };

export default function AnotacoesLivroEditor({ livroUuid }: Props) {
  const [itens, setItens] = useState<LivroAnotacao[]>([]);
  const [novo, setNovo] = useState(VAZIO);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    setCarregando(true);
    const res = await listarAnotacoesLivro(livroUuid);
    setItens(res ?? []);
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [livroUuid]);

  async function adicionar() {
    if (!novo.texto.trim()) return;
    setSalvando(true);
    const criado = await criarAnotacaoLivro(livroUuid, {
      tipo: novo.tipo,
      pagina: novo.pagina ? Number(novo.pagina) : undefined,
      texto: novo.texto,
    });
    if (criado) {
      setNovo(VAZIO);
      await carregar();
    }
    setSalvando(false);
  }

  async function remover(uuid: string) {
    await apagarAnotacaoLivro(uuid);
    await carregar();
  }

  return (
    <div className={styles.wrapper}>
      <h4>Anotações e citações</h4>
      {carregando ? (
        <p className={styles.vazio}>Carregando...</p>
      ) : (
        <ul className={styles.lista}>
          {itens.map((item) => (
            <li key={item.uuid} style={{ alignItems: 'flex-start' }}>
              <span>
                <strong>{item.tipo === 'citacao' ? '"' : ''}</strong>
                {item.texto}
                {item.tipo === 'citacao' ? '"' : ''}
                {item.pagina != null ? ` (p. ${item.pagina})` : ''}
              </span>
              <button type="button" onClick={() => remover(item.uuid)}>
                ✕
              </button>
            </li>
          ))}
          {itens.length === 0 && (
            <li className={styles.vazio}>Nenhuma anotação ainda.</li>
          )}
        </ul>
      )}

      <div className={styles.linhaAdicionar}>
        <select
          value={novo.tipo}
          onChange={(e) => setNovo({ ...novo, tipo: e.target.value as TipoAnotacaoLivro })}
        >
          <option value="anotacao">Anotação</option>
          <option value="citacao">Citação</option>
        </select>
        <input
          placeholder="Página (opcional)"
          type="number"
          inputMode="numeric"
          value={novo.pagina}
          onChange={(e) => setNovo({ ...novo, pagina: e.target.value })}
          style={{ maxWidth: '110px' }}
        />
        <input
          placeholder="Texto"
          value={novo.texto}
          onChange={(e) => setNovo({ ...novo, texto: e.target.value })}
        />
        <button type="button" onClick={adicionar} disabled={salvando}>
          + Adicionar
        </button>
      </div>
    </div>
  );
}