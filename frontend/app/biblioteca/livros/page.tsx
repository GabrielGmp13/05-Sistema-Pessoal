'use client';

import { useEffect, useState } from 'react';
import {
  Livro,
  LivroInput,
  listarLivros,
  criarLivro,
  atualizarLivro,
  apagarLivro,
} from '@/lib/livros';
import PainelSimples from '@/components/PainelSimples';
import { CampoInfo } from '@/components/PainelDetalheObra';
import AnotacoesLivroEditor from '@/components/AnotacoesLivroEditor';
import styles from '../filmes/page.module.css';

const STATUS_LABEL: Record<string, string> = {
  quero_ler: 'Quero ler',
  lendo: 'Lendo',
  lido: 'Lido',
  pausado: 'Pausado',
  abandonado: 'Abandonado',
};

const FORMATO_LABEL: Record<string, string> = {
  fisico: 'Físico',
  ebook: 'E-book',
  audiobook: 'Audiobook',
};

const FORM_VAZIO: LivroInput = {
  titulo: '',
  autor: '',
  editora: '',
  idioma: '',
  formato: 'fisico',
  status: 'quero_ler',
  comentario: '',
};

export default function LivrosPage() {
  const [livros, setLivros] = useState<Livro[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [modalAberto, setModalAberto] = useState(false);
  const [editandoUuid, setEditandoUuid] = useState<string | null>(null);
  const [form, setForm] = useState<LivroInput>(FORM_VAZIO);
  const [salvando, setSalvando] = useState(false);

  const [menuAbertoUuid, setMenuAbertoUuid] = useState<string | null>(null);
  const [painelLivro, setPainelLivro] = useState<Livro | null>(null);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    const resultado = await listarLivros();
    if (resultado === null) {
      setErro('Não foi possível carregar os livros.');
    } else {
      setLivros(resultado);
    }
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  function abrirNovo() {
    setEditandoUuid(null);
    setForm(FORM_VAZIO);
    setModalAberto(true);
  }

  function abrirEdicao(livro: Livro) {
    setEditandoUuid(livro.uuid);
    setForm({
      titulo: livro.titulo,
      autor: livro.autor ?? '',
      editora: livro.editora ?? '',
      idioma: livro.idioma ?? '',
      formato: livro.formato,
      status: livro.status,
      nota: livro.nota ?? undefined,
      paginas_total: livro.paginas_total ?? undefined,
      pagina_atual: livro.pagina_atual,
      ano_publicacao: livro.ano_publicacao ?? undefined,
      comentario: livro.comentario ?? '',
    });
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setEditandoUuid(null);
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.titulo?.trim()) return;

    setSalvando(true);
    const resultado = editandoUuid
      ? await atualizarLivro(editandoUuid, form)
      : await criarLivro(form);

    if (resultado === null) {
      setErro('Não foi possível salvar o livro.');
    } else {
      fecharModal();
      await carregar();
    }
    setSalvando(false);
  }

  async function confirmarExclusao(uuid: string) {
    if (!confirm('Apagar este livro?')) return;
    // TODO(BACKLOG): trocar confirm() nativo por modal .open
    const ok = await apagarLivro(uuid);
    if (!ok) {
      setErro('Não foi possível apagar o livro.');
    } else {
      await carregar();
    }
  }

  function montarInfoGeral(livro: Livro): CampoInfo[] {
    const campos: CampoInfo[] = [];
    if (livro.autor) campos.push({ label: 'Autor', valor: livro.autor });
    if (livro.editora) campos.push({ label: 'Editora', valor: livro.editora });
    if (livro.idioma) campos.push({ label: 'Idioma', valor: livro.idioma });
    campos.push({ label: 'Formato', valor: FORMATO_LABEL[livro.formato] ?? livro.formato });
    campos.push({ label: 'Status', valor: STATUS_LABEL[livro.status] ?? livro.status });
    if (livro.paginas_total)
      campos.push({
        label: 'Progresso',
        valor: `${livro.pagina_atual} / ${livro.paginas_total} páginas`,
      });
    if (livro.ano_publicacao)
      campos.push({ label: 'Ano de publicação', valor: String(livro.ano_publicacao) });
    if (livro.nota != null) campos.push({ label: 'Nota', valor: `${livro.nota} / 5` });
    if (livro.comentario) campos.push({ label: 'Comentário', valor: livro.comentario });
    return campos;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Livros</h1>
        <button className={styles.btnPrimario} onClick={abrirNovo}>
          + Novo livro
        </button>
      </div>

      {erro && <p className={styles.erro}>{erro}</p>}

      {carregando ? (
        <p className={styles.vazio}>Carregando...</p>
      ) : livros.length === 0 ? (
        <div className={styles.vazio}>
          <p>Nenhum livro cadastrado ainda.</p>
          <button className={styles.btnPrimario} onClick={abrirNovo}>
            Adicionar o primeiro
          </button>
        </div>
      ) : (
        <div className={styles.grid}>
          {livros.map((livro) => (
            <div key={livro.uuid} className={styles.card}>
              <div className={styles.cardClicavel} onClick={() => setPainelLivro(livro)}>
                <div className={styles.cardHeader}>
                  <h3>{livro.titulo}</h3>
                </div>
                {livro.autor && <p className={styles.meta}>{livro.autor}</p>}
                <p className={styles.badge}>{STATUS_LABEL[livro.status] ?? livro.status}</p>
                {livro.paginas_total && (
                  <p className={styles.meta}>
                    {livro.pagina_atual} / {livro.paginas_total} pág.
                  </p>
                )}
              </div>

              <div className={styles.menuWrapper}>
                <button
                  className={styles.btnIcon}
                  onClick={() =>
                    setMenuAbertoUuid(menuAbertoUuid === livro.uuid ? null : livro.uuid)
                  }
                  title="Ações"
                >
                  ⋯
                </button>
                {menuAbertoUuid === livro.uuid && (
                  <div className={styles.menuDropdown}>
                    <button
                      onClick={() => {
                        setMenuAbertoUuid(null);
                        abrirEdicao(livro);
                      }}
                    >
                      Editar
                    </button>
                    <button
                      className={styles.menuItemPerigo}
                      onClick={() => {
                        setMenuAbertoUuid(null);
                        confirmarExclusao(livro.uuid);
                      }}
                    >
                      Apagar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {modalAberto && (
        <div className={styles.modalOverlay} onClick={fecharModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{editandoUuid ? 'Editar livro' : 'Novo livro'}</h2>
              <button className={styles.btnIcon} onClick={fecharModal}>
                ✕
              </button>
            </div>
            <form onSubmit={salvar} className={styles.modalBody}>
              <label>
                Título *
                <input
                  required
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                />
              </label>
              <label>
                Autor
                <input
                  value={form.autor ?? ''}
                  onChange={(e) => setForm({ ...form, autor: e.target.value })}
                />
              </label>
              <label>
                Editora
                <input
                  value={form.editora ?? ''}
                  onChange={(e) => setForm({ ...form, editora: e.target.value })}
                />
              </label>
              <label>
                Idioma
                <input
                  value={form.idioma ?? ''}
                  onChange={(e) => setForm({ ...form, idioma: e.target.value })}
                />
              </label>
              <label>
                Formato
                <select
                  value={form.formato ?? 'fisico'}
                  onChange={(e) =>
                    setForm({ ...form, formato: e.target.value as LivroInput['formato'] })
                  }
                >
                  <option value="fisico">Físico</option>
                  <option value="ebook">E-book</option>
                  <option value="audiobook">Audiobook</option>
                </select>
              </label>
              <label>
                Status
                <select
                  value={form.status ?? 'quero_ler'}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value as LivroInput['status'] })
                  }
                >
                  <option value="quero_ler">Quero ler</option>
                  <option value="lendo">Lendo</option>
                  <option value="lido">Lido</option>
                  <option value="pausado">Pausado</option>
                  <option value="abandonado">Abandonado</option>
                </select>
              </label>
              <label>
                Páginas totais
                <input
                  type="number"
                  inputMode="numeric"
                  value={form.paginas_total ?? ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      paginas_total:
                        e.target.value === '' ? undefined : Number(e.target.value),
                    })
                  }
                />
              </label>
              <label>
                Página atual
                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={form.pagina_atual ?? 0}
                  onChange={(e) =>
                    setForm({ ...form, pagina_atual: Number(e.target.value) })
                  }
                />
              </label>
              <label>
                Ano de publicação
                <input
                  type="number"
                  inputMode="numeric"
                  value={form.ano_publicacao ?? ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      ano_publicacao:
                        e.target.value === '' ? undefined : Number(e.target.value),
                    })
                  }
                />
              </label>
              <label>
                Nota (0 a 5, meia estrela)
                <input
                  type="number"
                  min={0}
                  max={5}
                  step={0.5}
                  inputMode="decimal"
                  value={form.nota ?? ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      nota: e.target.value === '' ? undefined : Number(e.target.value),
                    })
                  }
                />
              </label>
              <label>
                Comentário
                <textarea
                  value={form.comentario ?? ''}
                  onChange={(e) => setForm({ ...form, comentario: e.target.value })}
                  rows={3}
                />
              </label>

              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnGhost} onClick={fecharModal}>
                  Cancelar
                </button>
                <button type="submit" className={styles.btnPrimario} disabled={salvando}>
                  {salvando ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>

            {editandoUuid && (
              <div className={styles.modalBody}>
                <AnotacoesLivroEditor livroUuid={editandoUuid} />
              </div>
            )}
          </div>
        </div>
      )}

      {painelLivro && (
        <PainelSimples
          aberto={!!painelLivro}
          onFechar={() => setPainelLivro(null)}
          titulo={painelLivro.titulo}
          bannerUrl={painelLivro.banner_url}
          capaUrl={painelLivro.capa_url}
          infoGeral={montarInfoGeral(painelLivro)}
        />
      )}
    </div>
  );
}