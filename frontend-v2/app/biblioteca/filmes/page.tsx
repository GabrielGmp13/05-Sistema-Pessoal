'use client';

import { useEffect, useState } from 'react';
import {
  Filme,
  FilmeInput,
  listarFilmes,
  criarFilme,
  atualizarFilme,
  apagarFilme,
} from '@/lib/filmes';
import PainelDetalheObra, { CampoInfo } from '@/components/PainelDetalheObra';
import ElencoEditor from '@/components/ElencoEditor';
import TrilhaSonoraEditor from '@/components/TrilhaSonoraEditor';
import styles from './page.module.css';

const STATUS_LABEL: Record<string, string> = {
  quero_ver: 'Quero ver',
  assistido: 'Assistido',
  abandonado: 'Abandonado',
};

const FORM_VAZIO: FilmeInput = {
  titulo: '',
  diretor: '',
  status: 'quero_ver',
  comentario: '',
  roteirista: '',
  produtores: '',
  estudio: '',
  distribuidora: '',
};

export default function FilmesPage() {
  const [filmes, setFilmes] = useState<Filme[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [modalAberto, setModalAberto] = useState(false);
  const [editandoUuid, setEditandoUuid] = useState<string | null>(null);
  const [form, setForm] = useState<FilmeInput>(FORM_VAZIO);
  const [salvando, setSalvando] = useState(false);

  const [menuAbertoUuid, setMenuAbertoUuid] = useState<string | null>(null);
  const [painelFilme, setPainelFilme] = useState<Filme | null>(null);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    const resultado = await listarFilmes();
    if (resultado === null) {
      setErro('Não foi possível carregar os filmes.');
    } else {
      setFilmes(resultado);
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

  function abrirEdicao(filme: Filme) {
    setEditandoUuid(filme.uuid);
    setForm({
      titulo: filme.titulo,
      diretor: filme.diretor ?? '',
      status: filme.status,
      comentario: filme.comentario ?? '',
      nota: filme.nota ?? undefined,
      roteirista: filme.roteirista ?? '',
      produtores: filme.produtores ?? '',
      estudio: filme.estudio ?? '',
      distribuidora: filme.distribuidora ?? '',
      orcamento: filme.orcamento ?? undefined,
      bilheteria: filme.bilheteria ?? undefined,
      ano_lancamento: filme.ano_lancamento ?? undefined,
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
      ? await atualizarFilme(editandoUuid, form)
      : await criarFilme(form);

    if (resultado === null) {
      setErro('Não foi possível salvar o filme.');
    } else {
      fecharModal();
      await carregar();
    }
    setSalvando(false);
  }

  function montarInfoGeral(filme: Filme): CampoInfo[] {
    const campos: CampoInfo[] = [];
    if (filme.diretor) campos.push({ label: 'Direção', valor: filme.diretor });
    if (filme.ano_lancamento) campos.push({ label: 'Ano', valor: String(filme.ano_lancamento) });
    campos.push({ label: 'Status', valor: STATUS_LABEL[filme.status] ?? filme.status });
    if (filme.nota != null) campos.push({ label: 'Nota', valor: `${filme.nota} / 5` });
    if (filme.roteirista) campos.push({ label: 'Roteiro', valor: filme.roteirista });
    if (filme.produtores) campos.push({ label: 'Produção', valor: filme.produtores });
    if (filme.estudio) campos.push({ label: 'Estúdio', valor: filme.estudio });
    if (filme.distribuidora)
      campos.push({ label: 'Distribuidora', valor: filme.distribuidora });
    if (filme.duracao_minutos)
      campos.push({ label: 'Duração', valor: `${filme.duracao_minutos} min` });
    if (filme.comentario) campos.push({ label: 'Comentário', valor: filme.comentario });
    return campos;
  }

  async function confirmarExclusao(uuid: string) {
    if (!confirm('Apagar este filme?')) return;
    // TODO(BACKLOG): trocar confirm() nativo por modal .open — mesma
    // pendência já registrada para Treino v2 em BACKLOG.md.
    const ok = await apagarFilme(uuid);
    if (!ok) {
      setErro('Não foi possível apagar o filme.');
    } else {
      await carregar();
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Filmes</h1>
        <button className={styles.btnPrimario} onClick={abrirNovo}>
          + Novo filme
        </button>
      </div>

      {erro && <p className={styles.erro}>{erro}</p>}

      {carregando ? (
        <p className={styles.vazio}>Carregando...</p>
      ) : filmes.length === 0 ? (
        <div className={styles.vazio}>
          <p>Nenhum filme cadastrado ainda.</p>
          <button className={styles.btnPrimario} onClick={abrirNovo}>
            Adicionar o primeiro
          </button>
        </div>
      ) : (
        <div className={styles.grid}>
          {filmes.map((filme) => (
            <div key={filme.uuid} className={styles.card}>
              <div className={styles.cardClicavel} onClick={() => setPainelFilme(filme)}>
                <div className={styles.cardHeader}>
                  <h3>{filme.titulo}</h3>
                </div>
                {filme.diretor && <p className={styles.meta}>Direção: {filme.diretor}</p>}
                <p className={styles.badge}>{STATUS_LABEL[filme.status] ?? filme.status}</p>
                {filme.ano_lancamento && (
                  <p className={styles.meta}>{filme.ano_lancamento}</p>
                )}
              </div>

              <div className={styles.menuWrapper}>
                <button
                  className={styles.btnIcon}
                  onClick={() =>
                    setMenuAbertoUuid(menuAbertoUuid === filme.uuid ? null : filme.uuid)
                  }
                  title="Ações"
                >
                  ⋯
                </button>
                {menuAbertoUuid === filme.uuid && (
                  <div className={styles.menuDropdown}>
                    <button
                      onClick={() => {
                        setMenuAbertoUuid(null);
                        abrirEdicao(filme);
                      }}
                    >
                      Editar
                    </button>
                    <button
                      className={styles.menuItemPerigo}
                      onClick={() => {
                        setMenuAbertoUuid(null);
                        confirmarExclusao(filme.uuid);
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
              <h2>{editandoUuid ? 'Editar filme' : 'Novo filme'}</h2>
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
                Diretor
                <input
                  value={form.diretor ?? ''}
                  onChange={(e) => setForm({ ...form, diretor: e.target.value })}
                />
              </label>
              <label>
                Status
                <select
                  value={form.status ?? 'quero_ver'}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value as FilmeInput['status'] })
                  }
                >
                  <option value="quero_ver">Quero ver</option>
                  <option value="assistido">Assistido</option>
                  <option value="abandonado">Abandonado</option>
                </select>
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
                Ano de lançamento
                <input
                  type="number"
                  inputMode="numeric"
                  value={form.ano_lancamento ?? ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      ano_lancamento:
                        e.target.value === '' ? undefined : Number(e.target.value),
                    })
                  }
                />
              </label>
              <label>
                Roteirista
                <input
                  value={form.roteirista ?? ''}
                  onChange={(e) => setForm({ ...form, roteirista: e.target.value })}
                />
              </label>
              <label>
                Produtores
                <input
                  value={form.produtores ?? ''}
                  onChange={(e) => setForm({ ...form, produtores: e.target.value })}
                />
              </label>
              <label>
                Estúdio
                <input
                  value={form.estudio ?? ''}
                  onChange={(e) => setForm({ ...form, estudio: e.target.value })}
                />
              </label>
              <label>
                Distribuidora
                <input
                  value={form.distribuidora ?? ''}
                  onChange={(e) => setForm({ ...form, distribuidora: e.target.value })}
                />
              </label>
              <label>
                Orçamento (R$)
                <input
                  type="number"
                  inputMode="decimal"
                  value={form.orcamento ?? ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      orcamento: e.target.value === '' ? undefined : Number(e.target.value),
                    })
                  }
                />
              </label>
              <label>
                Bilheteria (R$)
                <input
                  type="number"
                  inputMode="decimal"
                  value={form.bilheteria ?? ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      bilheteria: e.target.value === '' ? undefined : Number(e.target.value),
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
                <ElencoEditor tipoObra="filme" obraUuid={editandoUuid} />
                <TrilhaSonoraEditor tipoObra="filme" obraUuid={editandoUuid} />
              </div>
            )}
          </div>
        </div>
      )}

      {painelFilme && (
        <PainelDetalheObra
          aberto={!!painelFilme}
          onFechar={() => setPainelFilme(null)}
          tipoObra="filme"
          obraUuid={painelFilme.uuid}
          titulo={painelFilme.titulo}
          bannerUrl={painelFilme.banner_url}
          capaUrl={painelFilme.capa_url}
          infoGeral={montarInfoGeral(painelFilme)}
        />
      )}
    </div>
  );
}