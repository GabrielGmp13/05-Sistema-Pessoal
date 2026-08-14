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
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import AnotacoesLivroEditor from '@/components/AnotacoesLivroEditor';
import SeletorGenero from '@/components/SeletorGenero';
import StarRating from '@/components/StarRating';
import BibliotecaBanner from './BibliotecaBanner';
import BibliotecaCard from './BibliotecaCard';
import BuscaMetadados from './BuscaMetadados';
import { sb, getUserId } from '@/lib/supabase';
import { getGeneros, getMapaGenerosDosItens, salvarGenerosDoItem, seedGenerosSeNecessario } from '@/lib/generos';
import type { Genero } from '@/lib/generos';
import { ordenarItensBiblioteca, type OrdenacaoBiblioteca } from '@/lib/biblioteca-ordenacao';
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
  favorito: false,
};

interface LivrosSectionProps {
  gatilhoAdicionar: number;
  busca?: string;
  onTotalCarregado?: (total: number) => void;
  ordenacao: OrdenacaoBiblioteca;
  onOrdenacaoChange: (ordenacao: OrdenacaoBiblioteca) => void;
}

export default function LivrosSection({
  gatilhoAdicionar,
  busca = '',
  onTotalCarregado,
  ordenacao,
  onOrdenacaoChange,
}: LivrosSectionProps) {
  const [livros, setLivros] = useState<Livro[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [modalAberto, setModalAberto] = useState(false);
  const [editandoUuid, setEditandoUuid] = useState<string | null>(null);
  const [form, setForm] = useState<LivroInput>(FORM_VAZIO);
  const [salvando, setSalvando] = useState(false);

  const [menuAbertoUuid, setMenuAbertoUuid] = useState<string | null>(null);
  const [painelLivro, setPainelLivro] = useState<Livro | null>(null);
  const [livroParaApagar, setLivroParaApagar] = useState<string | null>(null);

  const [generos, setGeneros] = useState<Genero[]>([]);
  const [generosSelecionados, setGenerosSelecionados] = useState<string[]>([]);
  const [generosPorItem, setGenerosPorItem] = useState<Record<string, Genero[]>>({});

  async function carregarGenerosDosItens(lista: Livro[]) {
    const userId = await getUserId();
    if (!userId) return;
    await seedGenerosSeNecessario(sb, userId);
    const [generosAtuais, uuidsPorItem] = await Promise.all([
      getGeneros(sb, userId),
      getMapaGenerosDosItens(sb, userId, 'livros', lista.map((item) => item.uuid)),
    ]);
    setGeneros(generosAtuais);
    const generosPorUuid = new Map(generosAtuais.map((genero) => [genero.uuid, genero]));
    const mapa: Record<string, Genero[]> = {};
    for (const item of lista) {
      mapa[item.uuid] = (uuidsPorItem[item.uuid] ?? [])
        .map((uid) => generosPorUuid.get(uid))
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
    const timeoutId = window.setTimeout(() => void carregar(), 0);
    return () => window.clearTimeout(timeoutId);
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
      duracao_minutos: livro.duracao_minutos ?? undefined,
      comentario: livro.comentario ?? '',
      favorito: livro.favorito,
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
      const userId = await getUserId();
      const { error: erroGeneros } = userId
        ? await salvarGenerosDoItem(sb, userId, 'livros', resultado.uuid, generosSelecionados)
        : { error: 'Sessão indisponível' };
      fecharModal();
      await carregar();
      if (erroGeneros) setErro('Livro salvo, mas não foi possível salvar os gêneros.');
    }
    setSalvando(false);
  }

  async function confirmarExclusao() {
    if (!livroParaApagar) return;
    const ok = await apagarLivro(livroParaApagar);
    if (!ok) {
      setErro('Não foi possível apagar o livro.');
    } else {
      await carregar();
    }
  }

  async function alternarFavorito(livro: Livro) {
    const atualizado = await atualizarLivro(livro.uuid, {
      titulo: livro.titulo,
      favorito: !livro.favorito,
    });
    if (!atualizado) {
      setErro('Não foi possível atualizar o favorito.');
      return;
    }
    setLivros((atuais) => atuais.map((item) => item.uuid === atualizado.uuid ? atualizado : item));
    setPainelLivro((atual) => atual?.uuid === atualizado.uuid ? atualizado : atual);
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
    if (livro.duracao_minutos)
      campos.push({ label: 'Duração/tempo', valor: `${livro.duracao_minutos} min` });
    if (livro.comentario) campos.push({ label: 'Comentário', valor: livro.comentario });
    return campos;
  }

  const itensFiltrados = busca
    ? livros.filter((l) => l.titulo.toLowerCase().includes(busca.toLowerCase()))
    : livros;
  const itensOrdenados = ordenarItensBiblioteca(itensFiltrados, ordenacao, {
    titulo: (livro) => livro.titulo,
    atualizadoEm: (livro) => livro.updated_at,
    nota: (livro) => livro.nota,
    favorito: (livro) => livro.favorito,
    status: (livro) => livro.status,
  });

  return (
    <>
      <BibliotecaBanner
        titulo="Livros"
        total={livros.length}
        onAdicionar={abrirNovo}
        rotuloAdicionar="Nova leitura"
        capas={livros.map((f) => f.capa_url)}
        imagemFundo="/biblioteca/banners/livros.jpg"
        ordenacao={ordenacao}
        onOrdenacaoChange={onOrdenacaoChange}
      />

      <div className={styles.container}>
        {erro && <p className={styles.erro}>{erro}</p>}

      {carregando ? (
        <p className={styles.vazio}>Carregando...</p>
      ) : itensOrdenados.length === 0 ? (
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
          {itensOrdenados.map((livro) => (
            <BibliotecaCard
              key={livro.uuid}
              titulo={livro.titulo}
              capaUrl={livro.capa_url}
              favorito={livro.favorito}
              nota={livro.nota}
              ano={livro.ano_publicacao}
              generos={generosPorItem[livro.uuid] ?? []}
              status={livro.status}
              detalhe={[
                livro.paginas_total ? `${livro.paginas_total} págs.` : null,
                livro.duracao_minutos ? `${livro.duracao_minutos} min` : null,
              ].filter(Boolean).join(' · ') || null}
              onClick={() => setPainelLivro(livro)}
              onEditar={() => abrirEdicao(livro)}
              onAlternarFavorito={() => void alternarFavorito(livro)}
              onApagar={() => setLivroParaApagar(livro.uuid)}
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
              <BuscaMetadados
                fonte="google_livros"
                termo={form.titulo}
                onSelect={(resultado) => setForm((atual) => ({
                  ...atual,
                  titulo: resultado.titulo,
                  autor: resultado.autor ?? atual.autor,
                  isbn: resultado.isbn ?? atual.isbn,
                  google_books_id: resultado.identificadorExterno ?? atual.google_books_id,
                  capa_url: resultado.capaUrl ?? atual.capa_url,
                  paginas_total: resultado.paginas ?? atual.paginas_total,
                  editora: resultado.editora ?? atual.editora,
                  idioma: resultado.idioma ?? atual.idioma,
                  ano_publicacao: resultado.ano ?? atual.ano_publicacao,
                  link_oficial: resultado.linkOficial ?? atual.link_oficial,
                }))}
              />
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
                Duração/tempo estimado (min)
                <input
                  type="number"
                  min={1}
                  inputMode="numeric"
                  value={form.duracao_minutos ?? ''}
                  onChange={(e) => setForm({
                    ...form,
                    duracao_minutos: e.target.value === '' ? undefined : Number(e.target.value),
                  })}
                />
              </label>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={form.favorito ?? false}
                  onChange={(e) => setForm({ ...form, favorito: e.target.checked })}
                />
                Favorito
              </label>
              <StarRating
                value={form.nota}
                onChange={(nota) => setForm({ ...form, nota: nota ?? undefined })}
              />
              <div>
                <div style={{ fontSize: '0.82rem', color: 'var(--texto-secundario)', marginBottom: '0.4rem' }}>
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

      <ConfirmDialog
        open={livroParaApagar !== null}
        title="Apagar livro?"
        description="O livro deixará de aparecer na Biblioteca. Esta ação pode ser cancelada agora."
        confirmLabel="Apagar"
        onOpenChange={(open) => {
          if (!open) setLivroParaApagar(null);
        }}
        onConfirm={confirmarExclusao}
      />

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
