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
import SeletorGenero from '@/components/SeletorGenero';
import BibliotecaBanner from './BibliotecaBanner';
import BibliotecaCard from './BibliotecaCard';
import { sb, getUserId } from '@/lib/supabase';
import { getGeneros, getGenerosDoItem } from '@/lib/generos';
import type { Genero } from '@/lib/generos';
import styles from './BibliotecaSection.module.css';

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

interface LivrosSectionProps {
  gatilhoAdicionar: number;
  busca?: string;
  onTotalCarregado?: (total: number) => void;
}

export default function LivrosSection({ gatilhoAdicionar, busca = '', onTotalCarregado }: LivrosSectionProps) {
  const [livros, setLivros] = useState<Livro[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [modalAberto, setModalAberto] = useState(false);
  const [editandoUuid, setEditandoUuid] = useState<string | null>(null);
  const [form, setForm] = useState<LivroInput>(FORM_VAZIO);
  const [salvando, setSalvando] = useState(false);

  const [menuAbertoUuid, setMenuAbertoUuid] = useState<string | null>(null);
  const [painelLivro, setPainelLivro] = useState<Livro | null>(null);

  const [generos, setGeneros] = useState<Genero[]>([]);
  const [generosSelecionados, setGenerosSelecionados] = useState<string[]>([]);
  const [generosPorItem, setGenerosPorItem] = useState<Record<string, Genero[]>>({});

  async function carregarGeneros() {
    const userId = await getUserId();
    if (!userId) return;
    const lista = await getGeneros(sb, userId);
    setGeneros(lista);
  }

  async function carregarGenerosDosItens(lista: Livro[]) {
    const userId = await getUserId();
    if (!userId) return;
    const mapa: Record<string, Genero[]> = {};
    for (const item of lista) {
      const uuids = await getGenerosDoItem(sb, userId, 'livros', item.uuid);
      mapa[item.uuid] = uuids
        .map((uid) => generos.find((g) => g.uuid === uid))
        .filter((g): g is Genero => g != null);
    }
    setGenerosPorItem(mapa);
  }

  async function carregar() {
    setCarregando(true);
    setErro(null);
    const resultado = await listarLivros();
    if (resultado === null) {
      setErro('Não foi possível carregar os livros.');
    } else {
      setLivros(resultado);
      onTotalCarregado?.(resultado.length);
      await carregarGenerosDosItens(resultado);
    }
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
    carregarGeneros();
  }, []);

  useEffect(() => {
    if (gatilhoAdicionar > 0) abrirNovo();
  }, [gatilhoAdicionar]);

  function abrirNovo() {
    setEditandoUuid(null);
    setForm(FORM_VAZIO);
    setGenerosSelecionados([]);
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
    setGenerosSelecionados(generosPorItem[livro.uuid]?.map((g) => g.uuid) ?? []);
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
    if (livro.nota != null) campos.push({ label: 'Nota', valor: `${livro.nota} / 10` });
    if (livro.comentario) campos.push({ label: 'Comentário', valor: livro.comentario });
    return campos;
  }

  const itensFiltrados = busca
    ? livros.filter((l) => l.titulo.toLowerCase().includes(busca.toLowerCase()))
    : livros;

  return (
    <>
      <BibliotecaBanner
        titulo="Livros"
        total={livros.length}
        onAdicionar={abrirNovo}
        rotuloAdicionar="Nova leitura"
        capas={livros.map((f) => f.capa_url)}
        imagemFundo="/biblioteca/banners/livros.jpg"
      />

      <div className={styles.container}>
        {erro && <p className={styles.erro}>{erro}</p>}

      {erro && <p className={styles.erro}>{erro}</p>}

      {carregando ? (
        <p className={styles.vazio}>Carregando...</p>
      ) : itensFiltrados.length === 0 ? (
        <div className={styles.vazio}>
          <p>{busca ? 'Nenhum livro encontrado para esta busca.' : 'Nenhum livro cadastrado ainda.'}</p>
          {!busca && (
            <button className={styles.btnPrimario} onClick={abrirNovo}>
              Adicionar o primeiro
            </button>
          )}
        </div>
      ) : (
        <div className={styles.grid}>
          {itensFiltrados.map((livro) => (
            <BibliotecaCard
              key={livro.uuid}
              titulo={livro.titulo}
              capaUrl={livro.capa_url}
              favorito={livro.favorito}
              nota={livro.nota}
              ano={livro.ano_publicacao}
              generos={generosPorItem[livro.uuid] ?? []}
              onClick={() => setPainelLivro(livro)}
              onEditar={() => abrirEdicao(livro)}
              onApagar={() => confirmarExclusao(livro.uuid)}
              menuAberto={menuAbertoUuid === livro.uuid}
              onAlternarMenu={() =>
                setMenuAbertoUuid(menuAbertoUuid === livro.uuid ? null : livro.uuid)
              }
            />
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
                Nota (0 a 10)
                <input
                  type="number"
                  min={0}
                  max={10}
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
              <div>
                <div style={{ fontSize: '0.82rem', color: '#aaa', marginBottom: '0.4rem' }}>
                  Gêneros
                </div>
                <SeletorGenero
                  generos={generos}
                  selecionados={generosSelecionados}
                  onChange={setGenerosSelecionados}
                />
              </div>
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
    </>
  );
}